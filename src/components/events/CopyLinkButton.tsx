'use client';

import { useState, useEffect } from 'react';
import { Copy, CheckCircle, Download } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  
  useEffect(() => {
    let isCancelled = false;
    const origin = window.location.origin;
    const fullUrl = `${origin}/events/${slug}/register`;
    
    QRCode.toDataURL(fullUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 200,
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `registration-qr-${slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!url) {
    return <div className="mt-4 p-4 bg-slate-900/60 rounded-2xl border border-white/10 animate-pulse h-32"></div>;
  }

  return (
    <div className="mt-4 p-6 bg-slate-950/70 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-6 items-center md:items-start text-slate-100">
      {/* QR Code Section */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div className="bg-white p-2.5 rounded-2xl shadow-md border border-white/10">
          {qrCodeDataUrl ? (
            <Image src={qrCodeDataUrl} alt="Registration QR Code" width={128} height={128} className="w-32 h-32 object-contain" unoptimized />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center bg-slate-900 animate-pulse rounded-xl">
              <span className="text-xs font-mono text-slate-400">Loading...</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleDownloadQR}
          disabled={!qrCodeDataUrl}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs hover:bg-slate-800 transition-colors border border-white/10 shadow-sm disabled:opacity-50 active-scale"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      </div>

      {/* Link Section */}
      <div className="flex-1 w-full flex flex-col justify-center h-full pt-1">
        <h4 className="text-base font-bold text-white mb-1.5">Public Registration</h4>
        <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
          Share this QR code or the link below with attendees so they can register and receive their tickets.
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
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] whitespace-nowrap active-scale"
            title="Copy Link"
          >
            {copied ? (
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Copied!</span>
            ) : (
              <span className="flex items-center gap-1.5"><Copy className="w-4 h-4" /> Copy Link</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
