import Link from 'next/link';
import { getEventsForAdmin } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function EventsPage() {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let events: any[] = [];
  let error = null;
  
  try {
    const allEvents = await getEventsForAdmin(adminId);
    
    // Filter to only show events for today and tomorrow
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    
    events = allEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= startOfToday && eventDate < endOfTomorrow;
    });
  } catch (err: any) {
    error = err.message;
  }

  const activeEvents = events.filter(e => e.status === 'open').length;

  return (
    <div className="p-container-margin md:p-section-padding flex-1 fade-in-stagger w-full max-w-7xl mx-auto">
      {/* Hero Greeting */}
      <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
            Dashboard
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Manage and track attendance for your events.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 font-body-md text-sm">
          Could not load events: {error}
        </div>
      )}

      {/* Metrics Grid (Responsive Flex/Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Metric Card 1 */}
        <div className="bg-surface-container-lowest flex flex-col justify-between rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-surface-container-high">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Total Events</span>
            <span className="material-symbols-outlined text-primary text-opacity-50">calendar_today</span>
          </div>
          <div className="text-3xl font-bold font-headline-md text-primary mb-2">{events.length}</div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-surface-container-lowest flex flex-col justify-between rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-surface-container-high">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Active Events</span>
            <span className="material-symbols-outlined text-primary text-opacity-50">event_available</span>
          </div>
          <div className="text-3xl font-bold font-headline-md text-primary mb-2">{activeEvents}</div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-surface-container-lowest flex flex-col justify-between rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-surface-container-high">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Total Scans</span>
            <span className="material-symbols-outlined text-primary text-opacity-50">qr_code_scanner</span>
          </div>
          <div className="text-3xl font-bold font-headline-md text-primary mb-2">--</div>
          <div className="text-sm text-on-surface-variant">Data syncing soon</div>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-surface-container-lowest flex flex-col justify-between rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-surface-container-high">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-sm text-label-sm text-on-surface-variant">System Status</span>
            <span className="material-symbols-outlined text-primary text-opacity-50">cloud_done</span>
          </div>
          <div className="text-xl font-bold font-headline-md text-primary mb-2 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Online
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">Your Events</h3>
          </div>

          {events.length === 0 && !error ? (
            <div className="text-center border-2 border-dashed border-outline-variant rounded-xl p-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">event_note</span>
              <h3 className="font-label-sm font-bold text-primary">No events</h3>
              <p className="mt-1 font-body-md text-on-surface-variant mb-6">Get started by creating a new event.</p>
              <Link
                href="/events/new"
                className="inline-flex items-center px-6 py-3 bg-primary text-on-primary font-label-sm rounded-lg hover:bg-tertiary-container transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined mr-2">add</span>
                New Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}/settings`} className="block group">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-surface-container-high overflow-hidden flex flex-col sm:flex-row h-full">
                    <div className="p-6 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-headline-md text-headline-md text-primary font-bold group-hover:underline decoration-2 underline-offset-4">{event.title}</h4>
                          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors transform group-hover:translate-x-1">arrow_forward</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">location_on</span>
                          {event.location || 'No location set'} • {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-t border-surface-container-highest pt-4 mt-auto">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex flex-col">
                            <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Status</span>
                            <span className="font-label-sm text-label-sm text-primary font-bold capitalize">{event.status}</span>
                          </div>
                          <div className="h-8 w-px bg-surface-container-highest hidden sm:block"></div>
                          <div className="flex flex-col">
                            <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Capacity</span>
                            <span className="font-label-sm text-label-sm text-primary font-bold">{event.maxAttendees || 'Unlimited'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
