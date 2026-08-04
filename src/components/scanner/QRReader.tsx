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

export default function QRReader({ eventId }: { eventId: string }) {
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

      // Fast auto-unlock software lock (800ms) for high-throughput scanning
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

    await new Promise((r) => setTimeout(r, 16));

    const { Html5Qrcode } = await import('html5-qrcode');

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('qr-reader');
    }

    let targetMode = mode;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const hasRear = devices.length > 1 || devices.some(d => /back|rear|environment|main/i.test(d.label));
        if (targetMode === 'environment' && !hasRear && devices.length === 1) {
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

    const newMirrored = newMode === 'user';
    
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

  // Dedicated useEffect handling mounting, unmounting, and camera stream cleanup
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const promise = scannerRef.current.stop();
          if (promise && promise.catch) {
            promise.catch(() => {});
          }
          scannerRef.current.clear();
        } catch {
          // Suppress synchronous throw on unmount
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full w-full absolute inset-0 bottom-16 md:bottom-0 pt-14 md:pt-0 text-slate-100 bg-black">
      {/* Viewfinder Area */}
      <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 z-10 bg-ambient-mesh">
        {/* Top Floating HUD Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2.5">
          <button
            type="button"
            onClick={toggleMirror}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors ${
              isMirrored
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/80 text-slate-300 border-white/10 hover:text-white hover:bg-slate-800'
            }`}
            title={isMirrored ? "Camera Mirrored (Click to Unmirror)" : "Camera Unmirrored (Click to Mirror)"}
          >
            <span className="material-symbols-outlined text-lg">flip</span>
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className="w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors active-scale"
            title={`Switch to ${facingMode === 'environment' ? 'Front' : 'Rear'} Camera`}
          >
            <span className="material-symbols-outlined text-lg">flip_camera_ios</span>
          </button>
        </div>

        {/* Dynamic Toast Feedback Overlay — clamped so long messages never clip on phones */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-[90%] px-4 py-2 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-amber-400 shrink-0">info</span>
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Viewfinder Glass Card */}
        <div className={`relative z-10 w-full max-w-md aspect-square border rounded-3xl overflow-hidden shadow-2xl bg-slate-950/90 flex flex-col items-center justify-center p-2 transition-colors duration-300 ${
          currentOverlay === 'success' 
            ? 'border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.3)]' 
            : currentOverlay === 'duplicate' 
            ? 'border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.3)]' 
            : currentOverlay === 'error' 
            ? 'border-red-500/80 shadow-[0_0_35px_rgba(239,68,68,0.3)]' 
            : 'border-white/15'
        }`}>
          {/* Stream Canvas Target */}
          <div 
            id="qr-reader" 
            className={`w-full h-full rounded-2xl overflow-hidden ${isMirrored ? 'scale-x-[-1]' : ''}`} 
          />

          {/* Idle Start Overlay */}
          {status === 'idle' && (
            <div className="absolute inset-0 z-20 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Scanner Offline</h3>
              <p className="text-xs text-slate-400 mb-6 text-center max-w-xs">
                Activate camera stream to scan attendee QR codes in real-time.
              </p>
              <button 
                type="button" 
                onClick={() => startScanner(facingMode)} 
                className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-sans rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] active-scale transition-colors transition-transform transform-gpu flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">videocam</span>
                <span>Start Camera Stream</span>
              </button>
            </div>
          )}

          {/* Processing Overlay */}
          {status === 'processing' && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3"></div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest animate-pulse">Verifying Pass...</span>
            </div>
          )}

          {/* Overlay Feedback Alerts */}
          {currentOverlay === 'success' && (
            <div className="absolute inset-0 z-20 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <span className="material-symbols-outlined text-5xl">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Access Granted</h3>
              <p className="text-xs text-emerald-300 font-mono">Attendee checked in successfully</p>
            </div>
          )}

          {currentOverlay === 'duplicate' && (
            <div className="absolute inset-0 z-20 bg-amber-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <span className="material-symbols-outlined text-5xl">warning</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Already Checked In</h3>
              <p className="text-xs text-amber-300 font-mono">This ticket has already been scanned</p>
            </div>
          )}

          {currentOverlay === 'error' && (
            <div className="absolute inset-0 z-20 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <span className="material-symbols-outlined text-5xl">cancel</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Invalid Pass</h3>
              <p className="text-xs text-red-300 font-mono">Ticket is invalid or unregistered</p>
            </div>
          )}
        </div>

        {/* Stream Actions */}
        {status !== 'idle' && (
          <div className="mt-6 z-10 flex gap-3">
            <button 
              type="button" 
              onClick={stopScanner} 
              className="py-2.5 px-5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono transition-colors active-scale flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">videocam_off</span>
              <span>Stop Stream</span>
            </button>
          </div>
        )}
      </div>

      {/* Side Log Drawer */}
      <aside className="w-full md:w-80 bg-slate-950 border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-[38dvh] md:h-full shrink-0 z-10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-lg">history</span>
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-200 font-bold">Live Scan Stream</h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {recentScans.length} Scans
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {recentScans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 font-mono text-xs">
              <span className="material-symbols-outlined text-3xl mb-2 text-slate-600">playlist_remove</span>
              <span>No scans recorded yet in this session.</span>
            </div>
          ) : (
            recentScans.map((scan) => (
              <div 
                key={scan.id} 
                className={`p-3 rounded-xl border text-xs font-sans transition-all animate-fade-in ${
                  scan.result === 'success' 
                    ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200' 
                    : scan.result === 'duplicate' 
                    ? 'bg-amber-950/30 border-amber-500/20 text-amber-200' 
                    : 'bg-red-950/30 border-red-500/20 text-red-200'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-bold truncate">{scan.attendee?.name || scan.message}</span>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                {scan.attendee && (
                  <div className="text-xs text-slate-400 flex gap-2 font-mono truncate">
                    <span>{scan.attendee.local || 'Local N/A'}</span>
                    <span>•</span>
                    <span>{scan.attendee.duty || 'Attendee'}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
