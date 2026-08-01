'use client';

import dynamic from 'next/dynamic';

const QRScannerDynamic = dynamic(() => import('./QRScanner'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col md:flex-row h-full min-h-[82vh] w-full absolute inset-0 pt-14 md:pt-0 text-slate-100 bg-black">
      <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 z-10 bg-ambient-mesh">
        <div className="relative z-10 w-full max-w-md aspect-square border border-white/15 rounded-3xl overflow-hidden shadow-2xl bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse">
            <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Scanner Offline</h3>
          <p className="text-xs text-slate-400 mb-6 text-center max-w-xs">
            Activate camera stream to scan attendee QR codes in real-time.
          </p>
          <div className="h-11 w-52 bg-gradient-to-r from-amber-500/30 to-amber-600/30 rounded-xl border border-amber-500/40 animate-pulse flex items-center justify-center text-amber-300 font-bold text-xs gap-2">
            <span className="material-symbols-outlined text-lg">videocam</span>
            <span>Initializing Engine...</span>
          </div>
        </div>
      </div>
      <aside className="hidden md:flex w-80 bg-slate-950 border-l border-white/10 flex-col h-full shrink-0"></aside>
    </div>
  )
});

export default function ScannerWrapper({ eventId }: { eventId: string }) {
  return <QRScannerDynamic eventId={eventId} />;
}
