'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="p-container-margin md:p-section-padding flex-1 w-full max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
      <div className="bg-error-container text-on-error-container p-8 rounded-xl max-w-2xl text-center shadow-sm border border-error/20">
        <span className="material-symbols-outlined text-6xl mb-4 text-error">error</span>
        <h2 className="font-headline-md text-headline-md font-bold mb-4">Something went wrong</h2>
        <p className="font-body-md text-on-error-container/80 mb-6 bg-surface-container-highest p-4 rounded text-left overflow-auto max-h-32 text-sm font-mono">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        
        {error.message?.includes('credentials are not configured') && (
          <p className="font-body-sm mb-6 text-left">
            <strong>Hint:</strong> It looks like your Cloudflare environment is missing secret keys.
            Make sure to run <code>wrangler secret put SUPABASE_SERVICE_ROLE_KEY</code> in your terminal!
          </p>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-error text-on-error rounded-lg font-label-sm hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2 border border-error/30 rounded-lg font-label-sm hover:bg-error/10 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
