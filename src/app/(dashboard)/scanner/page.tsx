import { Suspense } from 'react';
import { connection } from 'next/server';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getEventsPaginated, type EventWithRole } from '@/data/events';
import EventsList from '@/components/events/EventsList';
import { fetchEventsPage } from '@/app/(dashboard)/events/all/actions';
import EventsSkeleton from '@/components/ui/skeletons/EventsSkeleton';

async function ScannerSelectContent({ adminId }: { adminId: string }) {
  let initialEvents: EventWithRole[] = [];
  let error = null;
  
  try {
    initialEvents = await getEventsPaginated(adminId, 1, 20);
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-4 rounded-2xl mb-8 font-body-md text-sm border border-red-200">
        Could not load events: {error}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 relative">
      <EventsList initialEvents={initialEvents} linkSuffix="/scanner" fetchPages={true} fetchAction={fetchEventsPage} />
    </div>
  );
}

export default async function ScannerSelectPage() {
  await connection();
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1 fade-in-stagger w-full max-w-7xl mx-auto flex flex-col text-slate-100">
      {/* Hero Greeting - streams immediately */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            SCANNER TERMINAL
          </div>
          <h2 className="font-display-lg-mobile md:font-display-lg tracking-tight text-white gradient-text">
            Scanner Access
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-1.5 max-w-2xl">
            Select an active event stream to launch the QR scanner interface.
          </p>
        </div>
      </div>

      <Suspense fallback={<EventsSkeleton />}>
        <ScannerSelectContent adminId={adminId} />
      </Suspense>
    </div>
  );
}

