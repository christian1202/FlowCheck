import { getEventById } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { publishEventAction } from '@/actions/events';
import Link from 'next/link';
import { db } from '@/lib/db';
import { eventAdmins, admins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import TeamManagement, { TeamMember } from '@/components/events/TeamManagement';
import CopyLinkButton from '@/components/events/CopyLinkButton';

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
    db.select({
      adminId: eventAdmins.adminId,
      role: eventAdmins.role,
      email: admins.email,
      fullName: admins.fullName,
    })
    .from(eventAdmins)
    .innerJoin(admins, eq(eventAdmins.adminId, admins.id))
    .where(eq(eventAdmins.eventId, id))
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

  return (
    <div className="p-container-margin md:p-section-padding flex-1 fade-in-stagger w-full max-w-4xl mx-auto space-y-6">
      <div className="mb-2">
        <Link href="/events" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
          Back to Events
        </Link>
      </div>

      <div className="bg-surface-container-lowest shadow-sm sm:rounded-xl border border-surface-container-high overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start border-b border-surface-container-highest">
          <div>
            <h3 className="text-lg leading-6 font-headline-md font-bold text-primary">Event Settings</h3>
            <p className="mt-1 max-w-2xl text-sm font-body-sm text-on-surface-variant">
              Manage details and publication status for {event.title}.
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-xs font-bold uppercase tracking-wider ${
            event.status === 'draft' ? 'bg-surface-container-highest text-on-surface' :
            event.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-error/10 text-error'
          }`}>
            {event.status}
          </span>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-on-surface-variant">Title</dt>
              <dd className="mt-1 text-sm text-on-surface font-bold">{event.title}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-on-surface-variant">Date</dt>
              <dd className="mt-1 text-sm text-on-surface">{new Date(event.date).toLocaleString()}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-on-surface-variant">Location</dt>
              <dd className="mt-1 text-sm text-on-surface">{event.location || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-on-surface-variant">Capacity</dt>
              <dd className="mt-1 text-sm text-on-surface">{event.maxAttendees || 'Unlimited'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-on-surface-variant">Description</dt>
              <dd className="mt-1 text-sm text-on-surface">{event.description || 'No description provided.'}</dd>
            </div>
          </dl>
          
          <div className="border-t border-surface-container-highest pt-6 flex flex-wrap gap-4">
            {event.status === 'draft' && (
              <form action={publishAction}>
                <button
                  type="submit"
                  className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-tertiary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <span className="material-symbols-outlined mr-2 text-[20px]">public</span>
                  Publish Event
                </button>
              </form>
            )}
            
            {event.status === 'open' && (
              <Link
                href={`/events/${event.id}/scanner`}
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
              >
                <span className="material-symbols-outlined mr-2 text-[20px]">qr_code_scanner</span>
                Open Scanner
              </Link>
            )}
            
            {event.status === 'open' && (
              <div className="w-full mt-2">
                <CopyLinkButton slug={event.slug} />
              </div>
            )}
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

