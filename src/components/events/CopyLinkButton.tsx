'use client';

import { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  
  // Create absolute URL
  const url = typeof window !== 'undefined' ? `${window.location.origin}/events/${slug}/register` : `/events/${slug}/register`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="mt-4 p-4 bg-surface-container-highest rounded-lg border border-outline-variant">
      <p className="text-sm font-semibold text-on-surface mb-2">Public Registration Link</p>
      <div className="flex gap-2">
        <input 
          type="text" 
          readOnly 
          value={url} 
          className="flex-1 bg-surface border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface font-mono"
        />
        <button
          onClick={handleCopy}
          className="flex items-center justify-center px-4 py-2 bg-primary text-on-primary rounded-md hover:bg-tertiary-container transition-colors shadow-sm"
          title="Copy Link"
        >
          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-xs text-on-surface-variant mt-2">
        Share this link with attendees so they can register and receive their QR code tickets.
      </p>
    </div>
  );
}
