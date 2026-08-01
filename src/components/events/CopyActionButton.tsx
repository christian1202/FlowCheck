'use client';

import { useState, useTransition, memo, useCallback } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

interface CopyActionButtonProps {
  textToCopy: string;
  label?: string;
  onCopySuccess?: () => void;
  className?: string;
}

export const CopyActionButton = memo(function CopyActionButton({
  textToCopy,
  label = 'Copy Link',
  onCopySuccess,
  className = '',
}: CopyActionButtonProps) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const handleCopy = useCallback(() => {
    // 1. Immediately paint visual response to local button state (< 16ms INP)
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // 2. Execute async clipboard API without blocking the UI render thread
    if (textToCopy && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).catch((err) => {
        console.error('Failed to copy text:', err);
      });
    }

    // 3. Wrap any heavy parent callbacks in startTransition to prevent parent re-render lockups
    if (onCopySuccess) {
      startTransition(() => {
        onCopySuccess();
      });
    }
  }, [textToCopy, onCopySuccess]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors shadow-sm active-scale ${className}`}
      title={label}
    >
      {copied ? (
        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <CheckCircle className="w-3.5 h-3.5" /> Copied!
        </span>
      ) : (
        <span className="flex items-center gap-1.5 font-bold">
          <Copy className="w-3.5 h-3.5" /> {label}
        </span>
      )}
    </button>
  );
});

export default CopyActionButton;
