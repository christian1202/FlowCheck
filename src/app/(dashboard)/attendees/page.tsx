import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAttendeesPaginated, getAttendeesStats, getUniqueEventsForAdmin } from '@/data/attendees';
import AttendeesDashboard from '@/components/attendees/AttendeesDashboard';

export default async function AttendeesPage() {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let initialAttendees: any[] = [];
  let initialStats = { total: 0, checkedIn: 0, registered: 0 };
  let uniqueEvents: any[] = [];
  let error = null;
  
  try {
    initialAttendees = await getAttendeesPaginated(adminId, {}, 1, 50);
    initialStats = await getAttendeesStats(adminId, {});
    uniqueEvents = await getUniqueEventsForAdmin(adminId);
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="p-4 md:p-8 lg:p-12 flex-1 fade-in-stagger w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-primary tracking-tight">
            Attendees
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-2 max-w-2xl">
            View and manage all attendees across your events.
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
