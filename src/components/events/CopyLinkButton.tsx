'use client';

import { useState, useEffect } from 'react';
import { Copy, CheckCircle, Download } from 'lucide-react';
import QRCode from 'qrcode';

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fullUrl = `${window.location.origin}/events/${slug}/register`;
    setUrl(fullUrl);
    
    QRCode.toDataURL(fullUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 200,
      color: { dark: '#000000', light: '#ffffff' }
    })
    .then(setQrCodeDataUrl)
    .catch(err => console.error('Failed to generate QR code', err));
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
    return <div className="mt-4 p-4 bg-surface-container-highest rounded-lg border border-outline-variant animate-pulse h-32"></div>;
  }

  return (
    <div className="mt-4 p-6 bg-surface-container-highest rounded-xl border border-outline-variant flex flex-col md:flex-row gap-6 items-center md:items-start">
      {/* QR Code Section */}
      <div className="flex flex-col items-center gap-3">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-outline-variant">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="Registration QR Code" className="w-32 h-32 object-contain" />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center bg-surface-container animate-pulse rounded-lg">
              <span className="text-xs font-medium text-on-surface-variant">Loading...</span>
            </div>
          )}
        </div>
        <button
          onClick={handleDownloadQR}
          disabled={!qrCodeDataUrl}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface text-on-surface rounded-md font-bold text-xs hover:bg-surface-container-highest transition-colors border border-outline-variant shadow-sm disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>

      {/* Link Section */}
      <div className="flex-1 w-full flex flex-col justify-center h-full pt-2">
        <h4 className="text-base font-bold text-on-surface mb-2">Public Registration</h4>
        <p className="text-sm text-on-surface-variant mb-4">
          Share this QR code or the link below with attendees so they can register and receive their tickets.
        </p>
        <div className="flex gap-2">
          <input 
            type="text" 
            readOnly 
            value={url} 
            className="flex-1 bg-surface border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface font-mono"
          />
          <button
            onClick={handleCopy}
            className="flex items-center justify-center px-4 py-2 bg-primary text-on-primary rounded-md hover:bg-tertiary-container transition-colors shadow-sm whitespace-nowrap"
            title="Copy Link"
          >
            {copied ? (
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Copied!</span>
            ) : (
              <span className="flex items-center gap-2"><Copy className="w-4 h-4" /> Copy Link</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
