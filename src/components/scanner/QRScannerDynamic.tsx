'use client';

import dynamic from 'next/dynamic';

const QRScannerDynamic = dynamic(() => import('./QRScanner'), { 
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] w-full bg-surface-bright">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-primary text-5xl animate-pulse">qr_code_scanner</span>
        <p className="font-body-sm text-on-surface-variant animate-pulse">Initializing Scanner...</p>
      </div>
    </div>
  )
});

export default function ScannerWrapper({ eventId }: { eventId: string }) {
  return <QRScannerDynamic eventId={eventId} />;
}
