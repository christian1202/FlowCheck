import { connection } from 'next/server';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAttendeesPaginated, getAttendeesStats, getUniqueEventsForAdmin, type AttendeeWithEvent } from '@/data/attendees';
import AttendeesDashboard from '@/components/attendees/AttendeesDashboard';

export default async function AttendeesPage() {
  await connection();
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let initialAttendees: AttendeeWithEvent[] = [];
  let initialStats = { total: 0, checkedIn: 0, registered: 0 };
  let uniqueEvents: { id: string; title: string }[] = [];
  let error: string | null = null;
  
  try {
    const attendeesResult = await getAttendeesPaginated(adminId, {}, 1, 20);
    const statsResult = await getAttendeesStats(adminId);
    const eventsResult = await getUniqueEventsForAdmin(adminId);

    initialAttendees = attendeesResult;
    initialStats = statsResult;
    uniqueEvents = eventsResult;
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1 fade-in-stagger w-full max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            GLOBAL ATTENDEE REGISTRY
          </div>
          <h2 className="font-display-lg-mobile md:font-display-lg tracking-tight text-white gradient-text">
            Attendees
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-1.5 max-w-2xl">
            View and manage all registered attendees across your event streams.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-error-container text-on-error-container p-4 rounded-2xl mb-8 font-body-md text-sm border border-red-200">
          Could not load attendees: {error}
        </div>
      ) : (
        <AttendeesDashboard 
          initialAttendees={initialAttendees} 
          initialStats={initialStats} 
          uniqueEvents={uniqueEvents} 
        />
      )}
    </div>
  );
}
