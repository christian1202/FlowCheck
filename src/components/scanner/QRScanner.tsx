'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { scanTicketAction } from '@/actions/scanner';
import type { ScanResultResponse } from '@/data/scanner';

type ScannerStatus = 'idle' | 'scanning' | 'processing' | 'result';

type RecentScan = {
  id: string;
  timestamp: Date;
  result: 'success' | 'duplicate' | 'error';
  message: string;
  attendee?: {
    name: string;
    local: string | null;
    duty: string | null;
  };
};

export default function QRScanner({ eventId }: { eventId: string }) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [currentOverlay, setCurrentOverlay] = useState<'none' | 'success' | 'duplicate' | 'error'>('none');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const playSound = (type: 'success' | 'error' | 'warning') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignore audio errors
    }
  };

  const processScan = async (decodedText: string) => {
    if (status === 'processing') return;
    
    if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
      scannerRef.current.pause();
    }
    
    setStatus('processing');
    setCurrentOverlay('none');

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
      newScan.result = res.data.result === 'success' ? 'success' : res.data.result === 'duplicate' ? 'duplicate' : 'error';
      newScan.attendee = res.data.attendee;
      newScan.message = res.data.result === 'success' ? 'Access Granted' : res.data.result === 'duplicate' ? 'Already Scanned' : 'Invalid Ticket';
      
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

    setRecentScans(prev => [newScan, ...prev].slice(0, 20)); // Keep last 20
    setStatus('result');

    setTimeout(() => {
      setStatus('scanning');
      setCurrentOverlay('none');
      if (scannerRef.current?.getState() === Html5QrcodeScannerState.PAUSED) {
        scannerRef.current.resume();
      }
    }, 2500);
  };

  const startScanner = async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('qr-reader');
    }

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processScan(decodedText);
        },
        () => {} // ignore errors while seeking
      );
      setStatus('scanning');
    } catch (err) {
      console.error("Error starting scanner:", err);
      alert("Could not start camera. Please ensure permissions are granted.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
      await scannerRef.current.stop();
      setStatus('idle');
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[80vh] w-full absolute inset-0 pt-16 md:pt-0">
      {/* Scanner Viewfinder */}
      <div className="flex-1 relative bg-black flex flex-col items-center justify-center p-gutter md:p-section-padding z-10">
        
        {/* Top Controls */}
        <div className="absolute top-gutter right-gutter z-20 flex gap-4">
          {status !== 'idle' && (
             <button onClick={stopScanner} className="h-touch-target px-4 rounded-full bg-surface/10 backdrop-blur-md border border-outline-variant/30 text-white font-label-sm text-label-sm hover:bg-surface/20 transition-colors">
               Stop Camera
             </button>
          )}
        </div>

        {/* Viewfinder Frame */}
        <div className="relative z-10 w-full max-w-md aspect-square border-2 border-white/20 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm bg-black/50">
          <div id="qr-reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
          
          {/* Scanning Line */}
          {status === 'scanning' && (
            <div className="absolute left-0 w-full h-0.5 bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)] animate-[scan_2s_infinite_linear] z-20 top-0"></div>
          )}

          {status === 'idle' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
               <button onClick={startScanner} className="bg-primary text-on-primary px-8 h-touch-target rounded-full font-label-sm shadow-md hover:scale-105 transition-transform flex items-center gap-2">
                 <span className="material-symbols-outlined">videocam</span> Start Scanner
               </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-white"></div>
            </div>
          )}

          {/* Success/Error Overlay */}
          {currentOverlay !== 'none' && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-40 animate-[fadeIn_0.3s_ease-out]">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-[bounceIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] ${
                currentOverlay === 'success' ? 'bg-green-600' : 
                currentOverlay === 'duplicate' ? 'bg-yellow-500' : 'bg-error'
              }`}>
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: "48px" }}>
                  {currentOverlay === 'success' ? 'check_circle' : currentOverlay === 'duplicate' ? 'info' : 'cancel'}
                </span>
              </div>
              <p className={`font-headline-md text-headline-md font-bold text-center px-4 ${
                 currentOverlay === 'success' ? 'text-green-700' : 
                 currentOverlay === 'duplicate' ? 'text-yellow-700' : 'text-error'
              }`}>
                {recentScans[0]?.message}
              </p>
              {recentScans[0]?.attendee && (
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 text-center px-4">
                  {recentScans[0].attendee.name} • {recentScans[0].attendee.local}
                </p>
              )}
            </div>
          )}
        </div>
        
        {status === 'scanning' && (
           <p className="mt-8 text-white/70 font-label-sm text-label-sm z-10 text-center max-w-sm px-4">
               Align QR code within the frame to scan. <br/>Hold steady for best results.
           </p>
        )}
      </div>

      {/* Recent Scans Sidebar */}
      <aside className="w-full md:w-80 bg-surface border-l border-outline-variant flex flex-col h-[40vh] md:h-full shrink-0 z-40 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] animate-[slideInRight_0.4s_ease-out]">
        <div className="p-gutter border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest sticky top-0 z-10">
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Recent Scans</h2>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">history</span>
            <span className="font-label-xs text-label-xs">Live</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-gutter space-y-3 bg-background">
          {recentScans.length === 0 ? (
            <div className="text-center text-on-surface-variant font-body-md py-8">
              No scans yet.
            </div>
          ) : (
            recentScans.map((scan) => (
              <div key={scan.id} className={`bg-surface-container-lowest p-3 rounded-lg shadow-sm flex items-start gap-3 transition-shadow relative overflow-hidden border ${
                scan.result === 'error' ? 'border-error/30' : 
                scan.result === 'duplicate' ? 'border-yellow-500/30' : 'border-outline-variant/40 hover:shadow-md'
              }`}>
                {scan.result !== 'success' && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${scan.result === 'error' ? 'bg-error' : 'bg-yellow-500'}`}></div>
                )}
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  scan.result === 'success' ? 'bg-primary/5 text-primary' :
                  scan.result === 'duplicate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-error-container text-on-error-container'
                }`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {scan.result === 'success' ? 'person' : scan.result === 'duplicate' ? 'info' : 'error'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-label-sm text-label-sm text-on-surface font-semibold truncate">
                      {scan.attendee?.name || 'Unknown Code'}
                    </p>
                    <span className="font-label-xs text-label-xs text-on-surface-variant">
                      {scan.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </span>
                  </div>
                  
                  {scan.result === 'success' ? (
                    <div className="flex items-center gap-2 mt-1">
                       <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-xs text-[10px] truncate max-w-[100px]">{scan.attendee?.local}</span>
                       <p className="font-body-md text-xs text-on-surface-variant truncate">{scan.attendee?.duty}</p>
                    </div>
                  ) : (
                    <p className={`font-body-md text-xs truncate mt-1 ${scan.result === 'error' ? 'text-error' : 'text-yellow-700'}`}>
                      {scan.message}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <style jsx global>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); opacity: 1; }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
