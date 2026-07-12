import { getEventById } from '@/data/events';
import { notFound, redirect } from 'next/navigation';
import QRScanner from '@/components/scanner/QRScanner';
import Link from 'next/link';
import { getAdminSessionId } from '@/lib/auth';

export default async function ScannerPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let event;
  try {
    event = await getEventById(id, adminId);
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      redirect('/events');
    }
    notFound();
  }

  if (event.status === 'draft' || event.status === 'archived') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-gutter">
        <div className="bg-error-container border border-error/20 rounded-xl p-8 max-w-md text-center">
          <span className="material-symbols-outlined text-error text-5xl mb-4">scan_delete</span>
          <h2 className="text-headline-md font-headline-md text-on-error-container font-bold">Scanner Disabled</h2>
          <p className="mt-2 font-body-md text-on-error-container/80">
            Scanning is only available for open or recently closed events. 
            This event is currently set to <strong>{event.status}</strong>.
          </p>
          <div className="mt-6">
            <Link href={`/events/${event.id}/settings`} className="bg-surface-container-lowest text-on-surface font-label-sm px-6 py-2 rounded-full inline-block hover:bg-surface-container-high transition-colors">
              Go to Event Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative h-full min-h-[calc(100vh-64px)] w-full flex flex-col bg-surface-bright overflow-hidden">
      {/* Mobile-only header back button (optional, since topnav is hidden on scanner if absolute) */}
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <Link href={`/events/${event.id}/settings`} className="w-touch-target h-touch-target bg-surface/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
      </div>

      <QRScanner eventId={event.id} />
    </div>
  );
}
