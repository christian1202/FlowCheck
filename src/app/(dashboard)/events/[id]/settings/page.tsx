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
  const publishAction = async (formData: FormData) => {
    'use server';
    await publishEventAction(id);
  };

  const isScanner = event.adminRole === 'scanner';
  const displayStatus = getEventDisplayStatus(event.status, event.closesAt);
  const statusClasses = getEventStatusStyles(displayStatus);

  return (
    <div className="p-container-margin md:p-section-padding flex-1 fade-in-stagger w-full max-w-5xl mx-auto space-y-8">
      <div className="mb-2">
        <Link href="/events/all" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest/50 border border-outline-variant/30 text-sm font-label-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:border-primary/30 transition-all active-scale">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to All Events
        </Link>
      </div>

      <div className="w-full glass-panel rounded-3xl shadow-sm p-6 md:p-8 relative z-10 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/30 pb-6 mb-6">
          <div>
            <h3 className="text-2xl leading-tight font-display-md font-bold text-primary tracking-tight">Event Settings</h3>
            <p className="mt-2 max-w-2xl text-sm font-body-md text-on-surface-variant">
              Manage details and publication status for <span className="font-semibold text-on-surface">{event.title}</span>.
            </p>
          </div>
          <span className={`inline-flex items-center px-4 py-1.5 rounded-full font-label-xs font-bold uppercase tracking-wider shadow-sm ${statusClasses}`}>
            {displayStatus}
          </span>
        </div>
        
        <div className="space-y-8">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 bg-surface-container-highest/30 p-6 rounded-2xl border border-outline-variant/30">
            <div className="sm:col-span-1">
              <dt className="text-xs font-label-sm uppercase tracking-wider text-on-surface-variant mb-1">Title</dt>
              <dd className="text-base text-on-surface font-semibold">{event.title}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-xs font-label-sm uppercase tracking-wider text-on-surface-variant mb-1">Date</dt>
              <dd className="text-base text-on-surface font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/70">calendar_month</span>
                <LocalTimeDisplay date={event.date} />
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-xs font-label-sm uppercase tracking-wider text-on-surface-variant mb-1">Location</dt>
              <dd className="text-base text-on-surface font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/70">location_on</span>
                {event.location || 'N/A'}
                {event.mapLink && (
                  <a 
                    href={event.mapLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" 
                    title="View on Google Maps"
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                  </a>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-xs font-label-sm uppercase tracking-wider text-on-surface-variant mb-1">Capacity</dt>
              <dd className="text-base text-on-surface font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/70">group</span>
                {event.maxAttendees || 'Unlimited'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-label-sm uppercase tracking-wider text-on-surface-variant mb-1">Description</dt>
              <dd className="text-base text-on-surface font-medium whitespace-pre-wrap">{event.description || 'No description provided.'}</dd>
            </div>
            {event.closesAt && (
              <div className="sm:col-span-2 border-t border-outline-variant/30 pt-4 mt-2">
                <dt className="text-xs font-label-sm uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span> Auto-Closes At
                </dt>
                <dd className="text-base text-on-surface font-medium"><LocalTimeDisplay date={event.closesAt} /></dd>
              </div>
            )}
          </dl>
          
          <div className="border-t border-outline-variant/30 pt-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center">
              {event.status === 'draft' && (
                <form action={publishAction} className="w-full sm:w-auto">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 shadow-sm text-sm font-label-sm font-bold rounded-xl text-white bg-primary hover:bg-tertiary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active-scale"
                  >
                    <span className="material-symbols-outlined mr-2 text-[20px]">public</span>
                    Publish Event
                  </button>
                </form>
              )}
              
              {event.status === 'open' && displayStatus !== 'Closed' && (
                <div className="w-full mt-3 sm:mt-0 sm:w-auto flex-1">
                  <CopyLinkButton slug={event.slug} />
                </div>
              )}
            </div>
            
            <div className="w-full mt-6 pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row gap-3">
              {!isScanner && (
                <Link
                  href={`/events/${event.id}/edit`}
                  className="w-full sm:w-[160px] inline-flex justify-center items-center py-2.5 px-5 border border-outline-variant/50 shadow-sm text-sm font-label-sm font-bold rounded-xl text-on-surface bg-surface hover:bg-surface-container-highest focus:outline-none transition-all active-scale"
                >
                  <span className="material-symbols-outlined mr-2 text-[20px]">edit</span>
                  Edit Event
                </Link>
              )}
              
              {event.status === 'open' && (
                <Link
                  href={`/events/${event.id}/scanner`}
                  className="w-full sm:w-[160px] inline-flex justify-center items-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-label-sm font-bold rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all active-scale"
                >
                  <span className="material-symbols-outlined mr-2 text-[20px]">qr_code_scanner</span>
                  Open Scanner
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
