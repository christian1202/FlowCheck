'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { scanTicketAction } from '@/actions/scanner';
import type { ScanResultResponse } from '@/data/scanner';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

type ScannerStatus = 'idle' | 'scanning' | 'processing' | 'result';

export default function QRScanner({ eventId }: { eventId: string }) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResultResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Play audio feedback
  const playSound = (type: 'success' | 'error' | 'warning') => {
    try {
      // Assuming we have these simple notification sounds in public/sounds/
      // In a real implementation we would make sure they exist, otherwise we fallback to no sound.
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play prevented by browser', e));
    } catch (e) {
      // Ignore audio errors
    }
  };

  const processScan = async (decodedText: string) => {
    // Prevent double scanning while processing
    if (status === 'processing') return;
    
    // Pause scanner to process
    if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
      scannerRef.current.pause();
    }
    
    setStatus('processing');
    setScanResult(null);
    setErrorMsg(null);

    const res = await scanTicketAction(eventId, decodedText);
    
    if (res.error) {
      setErrorMsg(res.error);
      playSound('error');
    } else if (res.data) {
      setScanResult(res.data);
      if (res.data.result === 'success') {
        playSound('success');
      } else if (res.data.result === 'duplicate') {
        playSound('warning');
      } else {
        playSound('error');
      }
    }

    setStatus('result');

    // Auto-resume after 2.5 seconds
    setTimeout(() => {
      setStatus('scanning');
      setScanResult(null);
      setErrorMsg(null);
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
        { facingMode: 'environment' }, // Prefer back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processScan(decodedText);
        },
        (errorMessage) => {
          // Ignore general read errors (happens constantly when no QR is in view)
        }
      );
      setStatus('scanning');
    } catch (err) {
      console.error("Error starting scanner:", err);
      setErrorMsg("Could not start camera. Please ensure you have granted camera permissions and are using HTTPS.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
      await scannerRef.current.stop();
      setStatus('idle');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      
      {/* Scanner Viewport */}
      <div className="w-full relative bg-black rounded-lg overflow-hidden shadow-lg" style={{ minHeight: '300px' }}>
        <div id="qr-reader" className="w-full"></div>
        
        {/* Overlay when not scanning */}
        {status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
            <button 
              onClick={startScanner}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
              Start Camera
            </button>
          </div>
        )}

        {/* Processing Overlay */}
        {status === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Result Display Panel */}
      <div className="w-full mt-6 min-h-[150px]">
        {errorMsg && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg border border-red-200 flex items-start">
            <AlertTriangle className="h-6 w-6 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {scanResult && (
          <div className={`p-4 rounded-lg border text-center shadow-sm transition-all duration-300 ${
            scanResult.result === 'success' ? 'bg-green-100 border-green-300 text-green-900' :
            scanResult.result === 'duplicate' ? 'bg-yellow-100 border-yellow-300 text-yellow-900' :
            'bg-red-100 border-red-300 text-red-900'
          }`}>
            <div className="flex justify-center mb-2">
              {scanResult.result === 'success' && <CheckCircle className="h-10 w-10 text-green-600" />}
              {scanResult.result === 'duplicate' && <Info className="h-10 w-10 text-yellow-600" />}
              {(scanResult.result === 'invalid_ticket' || scanResult.result === 'invalid_event' || scanResult.result === 'unauthorized') && 
                <XCircle className="h-10 w-10 text-red-600" />
              }
            </div>

            <h3 className="text-xl font-bold uppercase mb-1">
              {scanResult.result === 'success' ? 'Valid Ticket' :
               scanResult.result === 'duplicate' ? 'Already Scanned' :
               scanResult.result === 'invalid_ticket' ? 'Invalid Ticket' :
               scanResult.result === 'invalid_event' ? 'Wrong Event' : 'Unauthorized'}
            </h3>

            {scanResult.attendee && (
              <div className="mt-2 text-sm bg-white bg-opacity-50 p-2 rounded text-left inline-block w-full">
                <p><strong>Name:</strong> {scanResult.attendee.name}</p>
                <p><strong>Local:</strong> {scanResult.attendee.local}</p>
                <p><strong>Duty:</strong> {scanResult.attendee.duty}</p>
                {scanResult.result === 'duplicate' && scanResult.attendee.checkedInAt && (
                  <p className="text-yellow-800 font-semibold mt-1">
                    First checked in at: {new Date(scanResult.attendee.checkedInAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {status === 'scanning' && !scanResult && !errorMsg && (
          <div className="text-center p-4 text-gray-500 animate-pulse">
            Position QR code within the frame to scan
          </div>
        )}
      </div>
      
      {status !== 'idle' && (
        <button 
          onClick={stopScanner}
          className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Stop Camera
        </button>
      )}
    </div>
  );
}
