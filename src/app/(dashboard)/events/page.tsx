import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { getDashboardStats, getRecentDashboardEvents } from '@/data/dashboard';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getEventDisplayStatus, getEventStatusStyles } from '@/lib/statusUtils';
import EventsSkeleton from '@/components/ui/skeletons/EventsSkeleton';

async function DashboardContent({ adminId }: { adminId: string }) {
  let dashboardEvents: Awaited<ReturnType<typeof getRecentDashboardEvents>> = [];
  let error = null;
  let stats = { totalEvents: 0, activeEvents: 0, totalScans: 0 };
  
  try {
    const [eventsResult, statsResult] = await Promise.all([
      getRecentDashboardEvents(adminId),
      getDashboardStats(adminId),
    ]);
    
    dashboardEvents = eventsResult;
    stats = statsResult;
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (error) {
    return (
      <div className="bg-red-950/90 md:bg-red-950/60 text-red-300 p-4 rounded-2xl mb-8 text-xs font-mono border border-red-500/30 md:backdrop-blur-xl">
        Error loading events: {error}
      </div>
    );
  }

  return (
    <>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        
        {/* Metric Card 1: Total Events */}
        <div className="claude-card hover-lift flex flex-col justify-between gap-4 rounded-3xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Global</span>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Total Events</h4>
            <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{stats.totalEvents}</div>
          </div>
        </div>

        {/* Metric Card 2: Active Events */}
        <div className="claude-card hover-lift flex flex-col justify-between gap-4 rounded-3xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">play_circle</span>
            </div>
            {stats.activeEvents > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Now
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Active Events</h4>
            <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{stats.activeEvents}</div>
          </div>
        </div>

        {/* Metric Card 3: Total Scans */}
        <div className="claude-card hover-lift flex flex-col justify-between gap-4 rounded-3xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">barcode_scanner</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Scans</span>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Total Scans</h4>
            <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{stats.totalScans.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/10">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Recent Events
            </h3>
            <Link prefetch={false} 
              href="/events/all" 
              className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors transform-gpu group"
            >
              View All <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {dashboardEvents.length === 0 ? (
            <div className="text-center claude-card rounded-3xl p-12 flex flex-col items-center">
              <div className="h-20 w-20 bg-white/[0.04] border border-white/10 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <span className="material-symbols-outlined text-4xl">event_note</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">No events found</h3>
              <p className="text-xs text-slate-400 mb-6 max-w-md">You haven&apos;t created any events yet. Get started by initializing your first stream.</p>
              <Link prefetch={false}
                href="/events/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-xl active-scale transition-colors transition-transform transform-gpu shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              >
                <span className="material-symbols-outlined mr-2 text-lg">add</span>
                <span>Create New Event</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardEvents.map((event) => {
                const displayStatus = getEventDisplayStatus(event.status, event.closesAt);
                const statusClasses = getEventStatusStyles(displayStatus);

                return (
                  <div key={event.id} className="block group h-full relative">
                    <div className="claude-card rounded-3xl hover-lift p-6 flex flex-col h-full min-h-[300px] transition-colors transition-transform transform-gpu duration-300 relative overflow-hidden">
                      
                      {/* Full card link */}
                      <Link href={`/events/${event.id}/settings`} className="absolute inset-0 z-10" aria-label={`View settings for ${event.title}`}></Link>

                      {/* Top: Status Pill */}
                      <div className="mb-4 relative z-10 flex justify-between items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest ${statusClasses}`}>
                          {displayStatus}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="mb-4 flex-1 relative z-10">
                        <h4 className="text-base font-bold text-white mb-1.5 line-clamp-2 group-hover:text-amber-300 transition-colors">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Date & Location */}
                      <div className="space-y-2 mb-6 relative z-10 text-xs text-slate-300">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                          </div>
                          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[15px]">location_on</span>
                          </div>
                          <span className="line-clamp-1 flex-1">{event.location || 'No location set'}</span>
                          {event.mapLink && (
                            <a 
                              href={event.mapLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="relative z-20 ml-auto w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500/20 transition-colors" 
                              title="View on Google Maps"
                            >
                              <span className="material-symbols-outlined text-[15px]">map</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Footer Progress Meter */}
                      <div className="pt-4 border-t border-white/10 relative z-10">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                            <span className="font-mono text-amber-400 font-bold">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default async function EventsPage() {
  await connection();
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1 fade-in-stagger w-full max-w-7xl mx-auto text-slate-100">
      
      {/* Header Greeting - streams immediately */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            LIVE OPERATIONS CENTER
          </div>
          <h2 className="font-display-lg-mobile md:font-display-lg tracking-tight text-white gradient-text">
            Dashboard Overview
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-1.5 max-w-2xl">
            Real-time status across all active event streams, attendee registrations, and scanner nodes.
          </p>
        </div>
      </div>

      <Suspense fallback={<EventsSkeleton />}>
        <DashboardContent adminId={adminId} />
      </Suspense>
    </div>
  );
}
