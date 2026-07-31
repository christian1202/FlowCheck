import { getEventById, getEventTeam } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { publishEventAction } from '@/actions/events';
import Link from 'next/link';
import TeamManagement, { TeamMember } from '@/components/events/TeamManagement';
import CopyLinkButton from '@/components/events/CopyLinkButton';
import DeleteEventButton from '@/components/events/DeleteEventButton';
import LocalTimeDisplay from '@/components/ui/LocalTimeDisplay';
import { getEventDisplayStatus, getEventStatusStyles } from '@/lib/statusUtils';

export default async function EventSettingsPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const adminId = await getAdminSessionId();
  if (!adminId) redirect('/login');

  const [event, teamRecords] = await Promise.all([
    getEventById(id, adminId),
    getEventTeam(id)
  ]).catch((err) => {
    if (err instanceof Error && err.message === 'Unauthorized') redirect('/events');
    notFound();
  });

  if (!event || !teamRecords) notFound();

  // Server action to publish this specific event
  const publishAction = async () => {
    'use server';
    await publishEventAction(id);
  };

  const isScanner = event.adminRole === 'scanner';
  const displayStatus = getEventDisplayStatus(event.status, event.closesAt);
  const statusClasses = getEventStatusStyles(displayStatus);

  return (
    <div className="p-4 sm:p-6 md:p-8 flex-1 fade-in-stagger w-full max-w-5xl mx-auto space-y-8 text-slate-100">
      <div className="mb-2">
        <Link 
          href="/events/all" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 hover:border-amber-500/30 transition-all active-scale"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Hero Header Glass Panel */}
      <div className="w-full claude-card rounded-3xl shadow-2xl p-6 md:p-8 relative z-10 overflow-hidden border border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight gradient-text">Event Settings</h3>
            <p className="mt-1.5 max-w-2xl text-xs text-slate-400 font-sans leading-relaxed">
              Manage operational details and publication status for <span className="font-semibold text-slate-200">{event.title}</span>.
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest ${statusClasses}`}>
            {displayStatus === 'Open' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
            <span>{displayStatus}</span>
          </span>
        </div>
        
        <div className="space-y-8">
          {/* Structured Details Grid */}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-white/[0.02] p-5 rounded-2xl border border-white/10">
            
            {/* Title */}
            <div className="sm:col-span-1 p-3.5 rounded-xl bg-slate-950/50 border border-white/5">
              <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Title</dt>
              <dd className="text-xs font-bold text-white truncate">{event.title}</dd>
            </div>

            {/* Date */}
            <div className="sm:col-span-1 p-3.5 rounded-xl bg-slate-950/50 border border-white/5">
              <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Start Date & Time</dt>
              <dd className="text-xs font-semibold text-slate-200 flex items-center gap-2 font-mono">
                <span className="material-symbols-outlined text-sm text-amber-400">calendar_month</span>
                <LocalTimeDisplay date={event.date} />
              </dd>
            </div>

            {/* Location */}
            <div className="sm:col-span-1 p-3.5 rounded-xl bg-slate-950/50 border border-white/5">
              <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Venue Location</dt>
              <dd className="text-xs font-semibold text-slate-200 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-sm text-amber-400 shrink-0">location_on</span>
                  <span className="truncate">{event.location || 'N/A'}</span>
                </span>
                {event.mapLink && (
                  <a 
                    href={event.mapLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-[11px] font-mono transition-all flex items-center gap-1 shrink-0 active-scale shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                    title="View on Google Maps"
                  >
                    <span>Map</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                )}
              </dd>
            </div>

            {/* Capacity */}
            <div className="sm:col-span-1 p-3.5 rounded-xl bg-slate-950/50 border border-white/5">
              <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Capacity Limit</dt>
              <dd className="text-xs font-semibold text-slate-200 flex items-center gap-2 font-mono">
                <span className="material-symbols-outlined text-sm text-amber-400">group</span>
                <span>{event.maxAttendees ? `${event.maxAttendees} attendees` : 'Unlimited'}</span>
              </dd>
            </div>

            {/* Description */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950/50 border border-white/5">
              <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Description</dt>
              <dd className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{event.description || 'No description provided.'}</dd>
            </div>

            {/* Auto Closes At */}
            {event.closesAt && (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950/50 border border-white/5">
                <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-amber-400">schedule</span>
                  <span>Auto-Closes At</span>
                </dt>
                <dd className="text-xs font-mono font-semibold text-slate-200">
                  <LocalTimeDisplay date={event.closesAt} />
                </dd>
              </div>
            )}
          </dl>
          
          {/* Action Row */}
          <div className="border-t border-white/10 pt-6">
            
            {/* Publish Banner Action */}
            {event.status === 'draft' && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Event Stream Status: Draft</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Publish this event to generate public attendee registration portals.</p>
                </div>
                <form action={publishAction} className="w-full sm:w-auto">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-6 text-xs font-bold font-sans rounded-xl text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] active-scale gap-2"
                  >
                    <span className="material-symbols-outlined text-base">public</span>
                    <span>Publish Event</span>
                  </button>
                </form>
              </div>
            )}

            {/* Open Event Actions */}
            {event.status === 'open' && displayStatus !== 'Closed' && (
              <div className="mb-6">
                <CopyLinkButton slug={event.slug} />
              </div>
            )}
            
            {/* Operational Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 items-center flex-wrap pt-2">
              {!isScanner && (
                <Link
                  href={`/events/${event.id}/edit`}
                  className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-5 border border-white/10 rounded-xl text-xs font-bold text-slate-200 bg-slate-900/80 hover:bg-slate-800 hover:text-white hover:border-amber-500/30 transition-all active-scale gap-2"
                >
                  <span className="material-symbols-outlined text-base text-amber-400">edit</span>
                  <span>Edit Event</span>
                </Link>
              )}
              
              {event.status === 'open' && (
                <Link
                  href={`/events/${event.id}/scanner`}
                  className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-5 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active-scale gap-2"
                >
                  <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                  <span>Open Scanner</span>
                </Link>
              )}
              
              <div className="hidden sm:block flex-1"></div>

              {!isScanner && (
                <DeleteEventButton eventId={event.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      <TeamManagement 
        eventId={event.id}
        initialTeam={teamRecords as TeamMember[]}
        currentUserRole={event.adminRole as 'owner' | 'editor' | 'scanner'}
        currentAdminId={adminId}
      />
    </div>
  );
}
