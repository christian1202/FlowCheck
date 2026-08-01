'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { Copy, CheckCircle, Download, Maximize2, X } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';

export const CopyLinkButton = memo(function CopyLinkButton({ 
  slug, 
  eventTitle 
}: { 
  slug: string; 
  eventTitle?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showFullscreenQr, setShowFullscreenQr] = useState(false);
  
  useEffect(() => {
    let isCancelled = false;
    const origin = window.location.origin;
    const fullUrl = `${origin}/events/${slug}/register`;
    
    QRCode.toDataURL(fullUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: { dark: '#000000', light: '#ffffff' }
    })
    .then(dataUrl => {
      if (!isCancelled) {
        setUrl(fullUrl);
        setQrCodeDataUrl(dataUrl);
      }
    })
    .catch(err => {
      console.error('Failed to generate QR code', err);
      if (!isCancelled) setUrl(fullUrl);
    });

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullscreenQr) {
        setShowFullscreenQr(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenQr]);

  const handleCopy = useCallback(() => {
    // 1. Immediately paint visual response to screen (< 16ms INP)
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // 2. Execute async browser clipboard write without blocking main render thread
    if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch((err) => {
        console.error('Failed to copy link', err);
      });
    }
  }, [url]);

  const handleDownloadQR = useCallback(() => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `registration-qr-${slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [qrCodeDataUrl, slug]);

  if (!url) {
    return <div className="mt-4 p-4 bg-slate-900/60 rounded-2xl border border-white/10 animate-pulse h-32"></div>;
  }

  return (
    <>
      <div className="mt-4 p-6 bg-slate-950/70 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-6 items-center md:items-start text-slate-100">
        {/* QR Code Section */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowFullscreenQr(true)}
            disabled={!qrCodeDataUrl}
            className="bg-white p-2.5 rounded-2xl shadow-md border border-white/10 hover:border-amber-500/50 hover:shadow-lg transition-all duration-150 transform-gpu relative group cursor-pointer"
            title="Click to expand QR Code full screen"
          >
            {qrCodeDataUrl ? (
              <>
                <Image src={qrCodeDataUrl} alt="Registration QR Code" width={128} height={128} className="w-32 h-32 object-contain" unoptimized />
                <div className="absolute inset-0 bg-slate-950/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-mono font-bold gap-1 bg-slate-950/50 backdrop-blur-[2px]">
                  <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                </div>
              </>
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-slate-900 animate-pulse rounded-xl">
                <span className="text-xs font-mono text-slate-400">Loading...</span>
              </div>
            )}
          </button>
          
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowFullscreenQr(true)}
              disabled={!qrCodeDataUrl}
              className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-mono text-xs font-bold transition-colors shadow-sm disabled:opacity-50 active-scale"
              title="Full Screen QR Code"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={!qrCodeDataUrl}
              className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs hover:bg-slate-800 transition-colors border border-white/10 shadow-sm disabled:opacity-50 active-scale"
              title="Download QR Image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Link Section */}
        <div className="flex-1 w-full flex flex-col justify-center h-full pt-1">
          <h4 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
            <span>Public Registration</span>
            {eventTitle && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-normal truncate max-w-[200px]">
                {eventTitle}
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
            Share this QR code or the portal link below with attendees so they can register for {eventTitle ? <strong className="text-slate-200">{eventTitle}</strong> : 'this event'}.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={url} 
              className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-xs rounded-xl transition-colors transition-transform transform-gpu shadow-[0_0_15px_rgba(245,158,11,0.2)] whitespace-nowrap active-scale"
              title="Copy Link"
            >
              {copied ? (
                <span className="flex items-center gap-1.5 text-slate-950 font-bold"><CheckCircle className="w-4 h-4" /> Copied!</span>
              ) : (
                <span className="flex items-center gap-1.5 font-bold"><Copy className="w-4 h-4" /> Copy Link</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Code Modal */}
      {showFullscreenQr && qrCodeDataUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setShowFullscreenQr(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 flex flex-col items-center text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowFullscreenQr(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              aria-label="Close full screen view"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center mb-3 text-amber-600 shadow-sm">
              <span className="material-symbols-outlined text-xl pointer-events-none">qr_code_2</span>
            </div>

            {eventTitle && (
              <div className="mb-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-mono font-bold uppercase tracking-wider truncate max-w-full">
                {eventTitle}
              </div>
            )}

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              Public Registration QR Code
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              Scan this code with a mobile camera to open registration
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm mb-4">
              <Image 
                src={qrCodeDataUrl} 
                alt="Full Screen Registration QR Code" 
                width={320} 
                height={320} 
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain" 
                unoptimized 
              />
            </div>

            <p className="text-[11px] font-mono text-slate-400 truncate max-w-full px-2 mb-5">
              {url}
            </p>

            <button
              type="button"
              onClick={() => setShowFullscreenQr(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 active-scale"
            >
              <X className="w-4 h-4" /> Close Fullscreen
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default CopyLinkButton;
