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
    
    // Sort events by date descending (upcoming and recent first, oldest last)
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
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
    <div className="p-4 md:p-8 lg:p-12 flex-1 fade-in-stagger w-full max-w-7xl mx-auto">
      {/* Hero Greeting */}
      <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-primary tracking-tight">
            Dashboard Overview
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-2 max-w-2xl">
            Welcome back. Here is your operational status for today across all events.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-2xl mb-8 font-body-md text-sm border border-red-200">
          Could not load events: {error}
        </div>
      )}

      {/* Metrics Grid (Responsive Flex/Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
        {/* Metric Card 1: Total Events */}
        <div className="glass-panel hover-lift flex flex-col gap-4 rounded-2xl p-6 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Total Events</h4>
            <div className="text-3xl font-bold text-on-surface">{allEvents.length}</div>
          </div>
        </div>

        {/* Metric Card 2: Active Events */}
        <div className="glass-panel hover-lift flex flex-col gap-4 rounded-2xl p-6 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">play_circle</span>
            </div>
            {activeEvents > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-500 text-white shadow-sm animate-pulse">Live</span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Active Events</h4>
            <div className="text-3xl font-bold text-on-surface">{activeEvents}</div>
          </div>
        </div>

        {/* Metric Card 3: Total Scans */}
        <div className="glass-panel hover-lift flex flex-col gap-4 rounded-2xl p-6 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">barcode_scanner</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Total Scans</h4>
            <div className="text-3xl font-bold text-on-surface">{totalScans.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <div className="space-y-6">
          <div className="flex justify-between items-end mb-6 pb-4 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-primary">Your Events</h3>
            <Link href="/events/all" className="text-primary font-bold text-sm flex items-center gap-1 hover:text-blue-600 transition-colors group">
              View All <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {dashboardEvents.length === 0 && !error ? (
            <div className="text-center glass-panel rounded-3xl p-16 flex flex-col items-center">
              <div className="h-24 w-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">event_note</span>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">No events found</h3>
              <p className="font-body-md text-on-surface-variant mb-8 max-w-md">You haven't created any events yet. Get started by setting up your first event.</p>
              <Link
                href="/events/new"
                className="inline-flex items-center px-8 py-4 bg-primary text-on-primary font-label-sm rounded-xl active-scale hover:bg-on-surface transition-all shadow-lg hover-lift"
              >
                <span className="material-symbols-outlined mr-2">add</span>
                <span className="font-semibold text-base">Create New Event</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardEvents.map((event) => {
                const displayStatus = getEventDisplayStatus(event.status, event.closesAt);
                const statusClasses = getEventStatusStyles(displayStatus);

                return (
                  <div key={event.id} className="block group h-full relative">
                    <div className="glass-panel rounded-3xl hover-lift p-6 flex flex-col h-full min-h-[320px] transition-all duration-300 relative overflow-hidden">
                      
                      {/* Full card clickable link */}
                      <Link href={`/events/${event.id}/settings`} className="absolute inset-0 z-10" aria-label={`View settings for ${event.title}`}></Link>

                      {/* Decorative gradient blob */}
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>

                      {/* Top: Pill */}
                      <div className="mb-6 relative z-10">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${statusClasses}`}>
                          {displayStatus}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="mb-6 flex-1 relative z-10">
                        <h4 className="font-headline-md text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h4>
                        {event.description && (
                          <p className="font-body-md text-sm text-on-surface-variant line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Date & Location */}
                      <div className="space-y-3 mb-8 relative z-10">
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          </div>
                          <span className="font-medium">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                          </div>
                          <span className="line-clamp-1 font-medium">{event.location || 'No location set'}</span>
                          {event.mapLink && (
                            <a 
                              href={event.mapLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="relative z-20 ml-auto w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer" 
                              title="View on Google Maps"
                            >
                              <span className="material-symbols-outlined text-[16px]">map</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-outline-variant/30 relative z-10">
                        {displayStatus === 'Closed' ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Final Attendance</span>
                              <span className="text-sm font-bold text-on-surface">{event.checkedInCount || 0}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Pre-registered vs Scanned</span>
                                <span className="text-[10px] font-bold text-on-surface">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out" 
                                  style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Capacity</span>
                              <span className="text-sm font-bold text-on-surface">
                                {event.registeredCount || 0} / {event.maxAttendees ? event.maxAttendees.toLocaleString() : 'Unlimited'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Pre-registered vs Scanned</span>
                                <span className="text-[10px] font-bold text-on-surface">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                                  style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
