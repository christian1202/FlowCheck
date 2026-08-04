'use client';

import { useEffect, useRef, useState } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { scanTicketAction } from '@/actions/scanner';
import { useDevicePower } from '@/hooks/useDevicePower';

type ScannerStatus = 'idle' | 'scanning' | 'processing' | 'result';

type RecentScan = {
  id: string;
  timestamp: Date;
  result: 'success' | 'duplicate' | 'error' | 'event_closed';
  message: string;
  attendee?: {
    name: string;
    local: string | null;
    duty: string | null;
  };
};

export default function QRScanner({ eventId }: { eventId: string }) {
  const isWeakDevice = useDevicePower();
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [currentOverlay, setCurrentOverlay] = useState<'none' | 'success' | 'duplicate' | 'error'>('none');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMirrored, setIsMirrored] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastScannedTokenRef = useRef<{ token: string; time: number } | null>(null);
  const processScanRef = useRef<(text: string) => Promise<void>>(async () => {});

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const playSound = (type: 'success' | 'error' | 'warning') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNode.gain.value = 0.3;

      if (type === 'success') {
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 880;
        osc1.connect(gainNode);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.15);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 1174.66;
        osc2.connect(gainNode);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.3);
      } else if (type === 'warning') {
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.value = 660;
          osc.connect(gainNode);
          osc.start(ctx.currentTime + i * 0.2);
          osc.stop(ctx.currentTime + i * 0.2 + 0.1);
        }
      } else {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.3);
        osc.connect(gainNode);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }

      setTimeout(() => ctx.close().catch(() => {}), 1000);
    } catch {
      // Ignore audio errors
    }
  };

  const processScan = async (decodedText: string) => {
    if (!decodedText || isProcessingRef.current) return;

    const now = Date.now();
    if (
      lastScannedTokenRef.current &&
      lastScannedTokenRef.current.token === decodedText &&
      now - lastScannedTokenRef.current.time < 3000
    ) {
      return;
    }

    isProcessingRef.current = true;
    lastScannedTokenRef.current = { token: decodedText, time: now };
    
    setStatus('processing');
    setCurrentOverlay('none');

    try {
      const res = await scanTicketAction(eventId, decodedText);
      
      const newScan: RecentScan = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        result: 'error',
        message: res.error || 'Unknown error'
      };

      if (res.error) {
        playSound('error');
        setCurrentOverlay('error');
      } else if (res.data) {
        newScan.result = res.data.result === 'success' ? 'success' : res.data.result === 'duplicate' ? 'duplicate' : res.data.result === 'event_closed' ? 'event_closed' : 'error';
        newScan.attendee = res.data.attendee;
        newScan.message = res.data.result === 'success' ? 'Access Granted' : res.data.result === 'duplicate' ? 'Already Scanned' : res.data.result === 'event_closed' ? 'Event is Closed' : 'Invalid Ticket';
        
        if (res.data.result === 'success') {
          playSound('success');
          setCurrentOverlay('success');
        } else if (res.data.result === 'duplicate') {
          playSound('warning');
          setCurrentOverlay('duplicate');
        } else {
          playSound('error');
          setCurrentOverlay('error');
        }
      }

      setRecentScans(prev => [newScan, ...prev].slice(0, 20));
    } catch (err) {
      console.error('Scan processing error:', err);
      playSound('error');
      setCurrentOverlay('error');
    } finally {
      setStatus('result');

      // Fast auto-unlock software lock (800ms) so camera keeps streaming seamlessly for high-throughput scanning
      setTimeout(() => {
        setStatus('scanning');
        setCurrentOverlay('none');
        isProcessingRef.current = false;
      }, 800);
    }
  };

  processScanRef.current = processScan;

  const startScanner = async (mode = facingMode) => {
    isProcessingRef.current = false;
    setStatus('processing');

    // Yield main thread to force instant Next Paint (< 16ms) before heavy WebRTC device query
    await new Promise((r) => setTimeout(r, 16));

    const { Html5Qrcode } = await import('html5-qrcode');

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('qr-reader');
    }

    let targetMode = mode;

    // Check available devices before starting
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const hasRear = devices.length > 1 || devices.some(d => /back|rear|environment|main/i.test(d.label));
        if (targetMode === 'environment' && !hasRear && devices.length === 1) {
          // PC/Laptop with single webcam
          showToast("Sorry, we didn't detect a rear camera on this device. Using default webcam.");
          targetMode = 'user';
          setFacingMode('user');
          setIsMirrored(true);
        }
      }
    } catch {
      // Permission not granted yet; proceed to start()
    }

    try {
      await scannerRef.current.start(
        { facingMode: targetMode },
        {
          fps: isWeakDevice ? 5 : 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processScanRef.current(decodedText);
        },
        () => {}
      );
      setStatus('scanning');
    } catch (err) {
      console.error("Error starting scanner:", err);

      // Fallback logic if environment mode fails on PC/Laptop
      if (targetMode === 'environment') {
        showToast("Sorry, we didn't detect a rear camera on this device.");
        setFacingMode('user');
        setIsMirrored(true);

        try {
          await scannerRef.current.start(
            { facingMode: 'user' },
            {
              fps: isWeakDevice ? 5 : 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              processScanRef.current(decodedText);
            },
            () => {}
          );
          setStatus('scanning');
          return;
        } catch (fallbackErr) {
          console.error("Fallback to front camera failed:", fallbackErr);
        }
      }

      alert("Could not start camera. Please ensure camera permissions are granted.");
    }
  };

  const stopScanner = async () => {
    isProcessingRef.current = false;
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Scanner was already stopped or idle
      }
      setStatus('idle');
    }
  };

  const toggleMirror = () => {
    const nextMirrored = !isMirrored;
    setIsMirrored(nextMirrored);
    showToast(
      nextMirrored 
        ? "Camera view mirrored (Inverted for natural video call orientation)" 
        : "Camera view unmirrored (Standard orientation)"
    );
  };

  const toggleCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';

    // If attempting to switch to rear camera on PC/laptop with single webcam
    if (newMode === 'environment') {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length === 1) {
          const hasRear = devices.some(d => /back|rear|environment|main/i.test(d.label));
          if (!hasRear) {
            showToast("Sorry, we didn't detect a rear camera on this device.");
            return;
          }
        }
      } catch {
        // Proceed with attempt
      }
    }

    const newMirrored = newMode === 'user'; // Default front camera to mirror mode
    
    setFacingMode(newMode);
    setIsMirrored(newMirrored);

    showToast(
      newMode === 'user'
        ? "Switched to Front Camera (Video Call Mirror Enabled)"
        : "Switched to Rear Camera (Standard Optical View)"
    );
    
    if (scannerRef.current && (status === 'scanning' || status === 'processing')) {
      await stopScanner();
      setTimeout(() => startScanner(newMode), 300);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const promise = scannerRef.current.stop();
          if (promise && promise.catch) {
            promise.catch(() => {});
          }
        } catch (err) {
          // Suppress synchronous throw: "Cannot stop, scanner is not running or paused."
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full w-full absolute inset-0 bottom-16 md:bottom-0 pt-14 md:pt-0 text-slate-100 bg-black">

      {/* Viewfinder Area */}
      <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 z-10 bg-ambient-mesh">

        {/* Top Floating HUD Controls — wraps and drops labels on very narrow screens */}
        <div className="absolute top-4 right-4 z-20 flex flex-wrap justify-end gap-2">
          <button
            onClick={toggleMirror}
            className={`px-3.5 min-h-10 rounded-xl bg-slate-900/95 md:bg-slate-900/80 md:backdrop-blur-md border text-xs font-mono transition-colors transition-transform transform-gpu flex items-center gap-1.5 active-scale ${
              isMirrored
                ? 'border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'border-white/10 text-slate-300 md:hover:text-white md:hover:bg-slate-800'
            }`}
            title="Toggle video mirror effect"
          >
            <span className="material-symbols-outlined text-sm">flip</span>
            <span className="hidden sm:inline">{isMirrored ? 'Mirrored' : 'Unmirrored'}</span>
          </button>
          <button
            onClick={toggleCamera}
            className="px-3.5 min-h-10 rounded-xl bg-slate-900/95 md:bg-slate-900/80 md:backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300 md:hover:text-white md:hover:bg-slate-800 transition-colors transition-transform transform-gpu flex items-center gap-1.5 active-scale"
            title="Switch front/rear camera"
          >
            <span className="material-symbols-outlined text-sm">cameraswitch</span>
            <span className="hidden sm:inline">{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
          </button>
          {status !== 'idle' && (
             <button
               onClick={stopScanner}
               className="px-3.5 min-h-10 rounded-xl bg-red-950/95 md:bg-red-950/80 md:backdrop-blur-md border border-red-500/40 text-xs font-mono text-red-300 md:hover:bg-red-900 transition-colors transition-transform transform-gpu flex items-center gap-1.5 active-scale"
             >
               <span className="material-symbols-outlined text-sm">stop_circle</span>
               <span className="hidden sm:inline">Stop</span>
             </button>
          )}
        </div>

        {/* HUD Notification Toast */}
        {toastMessage && (
          <div className="absolute top-16 md:top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-2xl bg-slate-900/95 md:bg-slate-900/90 md:backdrop-blur-xl border border-amber-500/40 text-amber-300 text-xs font-mono shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 animate-[fadeIn_0.2s_ease-out] max-w-[90%] text-center transform-gpu">
            <span className="material-symbols-outlined text-sm text-amber-400 shrink-0">info</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Futuristic Camera Frame */}
        <div className="relative z-10 w-full max-w-md aspect-square border border-white/15 rounded-3xl overflow-hidden shadow-2xl md:backdrop-blur-md bg-slate-950/90 md:bg-slate-950/70 claude-card transform-gpu">
          
          <div id="qr-reader" className={`w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full ${isMirrored ? '[&_video]:scale-x-[-1]' : ''}`}></div>
          
          {/* Laser Scanning Bar */}
          {status === 'scanning' && (
            <div className="scan-laser transform-gpu"></div>
          )}

          {/* Idle Start State */}
          {status === 'idle' && (
            <div className="absolute inset-0 bg-slate-950/95 md:bg-slate-950/85 md:backdrop-blur-xl flex flex-col items-center justify-center p-6 z-30">
               <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                 <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
               </div>
               <h3 className="text-lg font-bold text-white mb-1">Scanner Offline</h3>
               <p className="text-xs text-slate-400 mb-6 text-center max-w-xs">Activate camera stream to scan attendee QR codes in real-time.</p>
               <button 
                 onClick={() => startScanner()} 
                 className="bg-gradient-to-r from-amber-500 to-amber-600 md:hover:from-amber-400 md:hover:to-amber-500 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition-colors transition-transform transform-gpu shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 active-scale"
               >
                 <span className="material-symbols-outlined text-lg">videocam</span> 
                 <span>Start Optical Stream</span>
               </button>
            </div>
          )}

          {/* Processing State */}
          {status === 'processing' && (
            <div className="absolute inset-0 bg-slate-950/95 md:bg-slate-950/80 md:backdrop-blur-md flex flex-col items-center justify-center z-30 transform-gpu">
               <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-amber-400 border-white/10 mb-3"></div>
               <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Verifying Ticket...</span>
            </div>
          )}

          {/* Result Overlay */}
          {currentOverlay !== 'none' && (
            <div className="absolute inset-0 bg-slate-950/95 md:backdrop-blur-xl flex flex-col items-center justify-center p-6 z-40 animate-[fadeIn_0.25s_ease-out] transform-gpu">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 border ${
                currentOverlay === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 
                currentOverlay === 'duplicate' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              }`}>
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {currentOverlay === 'success' ? 'check_circle' : currentOverlay === 'duplicate' ? 'warning' : 'cancel'}
                </span>
              </div>
              <h3 className={`text-xl font-bold tracking-tight text-center ${
                 currentOverlay === 'success' ? 'text-emerald-300' : 
                 currentOverlay === 'duplicate' ? 'text-amber-300' : 'text-red-300'
              }`}>
                {recentScans[0]?.message}
              </h3>
              {recentScans[0]?.attendee && (
                <p className="text-xs text-slate-300 mt-2 font-mono text-center">
                  {recentScans[0].attendee.name} {recentScans[0].attendee.local ? `• ${recentScans[0].attendee.local}` : ''}
                </p>
              )}

              {/* Animated UI Cooldown Timer Indicator */}
              <div className="mt-6 w-full max-w-[220px] flex flex-col items-center">
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className={`h-full w-full rounded-full origin-left transform-gpu ${
                      currentOverlay === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                      currentOverlay === 'duplicate' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                      'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]'
                    }`}
                    style={{
                      animation: 'cooldownShrink 1.8s linear forwards'
                    }}
                  ></div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-slate-400">
                  <span className="material-symbols-outlined text-xs text-amber-400 animate-spin">hourglass_top</span>
                  <span>Cooldown active • Readying scanner...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {status === 'scanning' && (
           <p className="mt-6 text-slate-400 font-mono text-xs z-10 text-center max-w-sm">
               Align QR code inside target frame to process check-in.
           </p>
        )}
      </div>

      {/* Telemetry Log Sidebar */}
      <aside className="w-full md:w-80 bg-slate-950 border-l border-white/10 flex flex-col h-[38dvh] md:h-full shrink-0 z-20">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 transform-gpu isolation-isolate sticky top-0 z-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-bold">Telemetry Stream</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-mono text-emerald-400 uppercase">Live</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 hide-scrollbar">
          {recentScans.length === 0 ? (
            <div className="text-center text-slate-500 font-mono text-xs py-10">
              No scans recorded.
            </div>
          ) : (
            recentScans.map((scan) => (
              <div 
                key={scan.id} 
                className={`claude-card p-3 rounded-2xl flex items-start gap-3 border ${
                  scan.result === 'error' ? 'border-red-500/30 bg-red-950/20' : 
                  scan.result === 'duplicate' ? 'border-amber-500/30 bg-amber-950/20' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  scan.result === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  scan.result === 'duplicate' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <span className="material-symbols-outlined text-base">
                    {scan.result === 'success' ? 'person' : scan.result === 'duplicate' ? 'info' : 'error'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-xs font-bold text-white truncate">
                      {scan.attendee?.name || 'Unknown Token'}
                    </p>
                    <span className="text-[11px] font-mono text-slate-500">
                      {scan.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </span>
                  </div>
                  
                  {scan.result === 'success' ? (
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-slate-400">
                       <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-[11px] truncate">{scan.attendee?.local || 'Standard'}</span>
                       <span className="truncate">{scan.attendee?.duty}</span>
                    </div>
                  ) : (
                    <p className={`text-xs font-mono truncate mt-0.5 ${scan.result === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
                      {scan.message}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
