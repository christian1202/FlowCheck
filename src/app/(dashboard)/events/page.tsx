import Link from 'next/link';
import { getEventsForAdmin } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTotalScansForAdmin } from '@/data/scanner';
import { getEventDisplayStatus, getEventStatusStyles } from '@/lib/statusUtils';

export default async function EventsPage() {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let allEvents: any[] = [];
  let dashboardEvents: any[] = [];
  let error = null;
  let totalScans = 0;
  
  try {
    allEvents = await getEventsForAdmin(adminId);
    
    // Sort events by date (upcoming first)
    allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // For the list, just show the top 6 events
    dashboardEvents = allEvents.slice(0, 6);

    // Get total scans
    totalScans = await getTotalScansForAdmin(adminId);
  } catch (err: any) {
    error = err.message;
  }

  const activeEvents = allEvents.filter(e => {
    const isClosed = e.closesAt && new Date() > new Date(e.closesAt);
    return e.status === 'open' && !isClosed;
  }).length;

  return (
    <div className="p-container-margin md:p-section-padding flex-1 fade-in-stagger w-full max-w-7xl mx-auto">
      {/* Hero Greeting */}
      <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
            Dashboard Overview
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Welcome back. Here is your operational status for today.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 font-body-md text-sm">
          Could not load events: {error}
        </div>
      )}

      {/* Metrics Grid (Responsive Flex/Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Metric Card 1: Total Events */}
        <div className="bg-surface-container-lowest flex flex-col gap-4 rounded-xl p-6 shadow-sm border border-surface-container-high">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface-variant mb-1">Total Events</h4>
            <div className="text-xl font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">{allEvents.length}</div>
          </div>
        </div>

        {/* Metric Card 2: Active Events */}
        <div className="bg-surface-container-lowest flex flex-col gap-4 rounded-xl p-6 shadow-sm border border-surface-container-high">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">play_circle</span>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full font-label-xs font-bold uppercase tracking-wider bg-green-600 text-white dark:bg-green-700 dark:text-white">Live</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface-variant mb-1">Active Events</h4>
            <div className="text-xl font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">{activeEvents}</div>
          </div>
        </div>

        {/* Metric Card 3: Total Scans */}
        <div className="bg-surface-container-lowest flex flex-col gap-4 rounded-xl p-6 shadow-sm border border-surface-container-high">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">barcode_scanner</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface-variant mb-1">Total Scans</h4>
            <div className="text-xl font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">{totalScans.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-surface-container-highest">
            <h3 className="text-2xl font-bold text-primary">Your Events</h3>
            <Link href="/events/all" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {dashboardEvents.length === 0 && !error ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardEvents.map((event) => {
                const displayStatus = getEventDisplayStatus(event.status, event.closesAt);
                const statusClasses = getEventStatusStyles(displayStatus);

                return (
                  <Link key={event.id} href={`/events/${event.id}/settings`} className="block group">
                    <div className="bg-white dark:bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-surface-container-high p-6 flex flex-col h-full min-h-[300px]">
                      
                      {/* Top: Pill */}
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-xs font-bold uppercase tracking-wider ${statusClasses}`}>
                          {displayStatus}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="mb-6 flex-1">
                        <h4 className="text-xl font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-on-surface-variant line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Date & Location */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                          <span className="material-symbols-outlined text-[20px]">location_on</span>
                          <span className="line-clamp-1">{event.location || 'No location set'}</span>
                          {event.mapLink && (
                            <a 
                              href={event.mapLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()} 
                              className="text-primary hover:text-blue-500 flex items-center" 
                              title="View on Google Maps"
                            >
                              <span className="material-symbols-outlined text-[16px]">map</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px w-full bg-surface-container-highest mb-4"></div>

                      {/* Footer */}
                      {displayStatus === 'Closed' ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-on-surface-variant">Final Attendance</span>
                            <span className="text-sm font-bold text-on-surface-variant">{event.checkedInCount || 0}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-on-surface-variant">Pre-registered vs Scanned</span>
                              <span className="text-xs font-bold text-on-surface-variant">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                            </div>
                            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all duration-500" 
                                style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-on-surface-variant">Capacity</span>
                            <span className="text-sm font-bold text-on-surface-variant">
                              {event.registeredCount || 0} / {event.maxAttendees ? event.maxAttendees.toLocaleString() : 'Unlimited'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-on-surface-variant">Pre-registered vs Scanned</span>
                              <span className="text-xs font-bold text-on-surface-variant">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                            </div>
                            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all duration-500" 
                                style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

