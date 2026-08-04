import { Suspense } from 'react';
import { connection } from 'next/server';
import { getEventsPaginated, type EventWithRole } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EventsList from '@/components/events/EventsList';
import { fetchEventsPage } from './actions';
import EventsSkeleton from '@/components/ui/skeletons/EventsSkeleton';
import PrefetchLink from '@/components/ui/PrefetchLink';
import { warmEventSettings } from '@/actions/prefetch';

async function AllEventsContent({ adminId }: { adminId: string }) {
  let initialEvents: EventWithRole[] = [];
  let error = null;
  
  try {
    initialEvents = await getEventsPaginated(adminId, 1, 20);
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 font-body-md text-sm">
        Could not load events: {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      <EventsList initialEvents={initialEvents} fetchAction={fetchEventsPage} warmEvent={warmEventSettings} />
    </div>
  );
}

export default async function AllEventsPage() {
  await connection();
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1 fade-in-stagger w-full max-w-7xl mx-auto text-slate-100">
      {/* Hero Greeting - streams immediately */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            ALL EVENT ARCHIVES
          </div>
          <h2 className="font-display-lg-mobile md:font-display-lg tracking-tight text-white gradient-text">
            All Events
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-1.5 max-w-2xl">
            View and manage all your active, upcoming, and past event streams.
          </p>
        </div>
        <PrefetchLink
          href="/events/new"
          className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-xl active-scale transition-colors shadow-[0_0_20px_rgba(245,158,11,0.25)]"
        >
          <span className="material-symbols-outlined mr-2 text-lg">add</span>
          <span>New Event</span>
        </PrefetchLink>
      </div>

      <Suspense fallback={<EventsSkeleton />}>
        <AllEventsContent adminId={adminId} />
      </Suspense>
    </div>
  );
}

