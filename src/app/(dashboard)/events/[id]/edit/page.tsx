import { Suspense } from 'react';
import { connection } from 'next/server';
import { getEventById } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import EditEventForm from '@/components/events/EditEventForm';
import PrefetchLink from '@/components/ui/PrefetchLink';
import { warmAllEvents } from '@/actions/prefetch';

async function EditEventContent({ id, adminId }: { id: string; adminId: string }) {
  const event = await getEventById(id, adminId).catch((err) => {
    if (err instanceof Error && err.message === 'Unauthorized') redirect('/events');
    notFound();
  });

  if (!event) notFound();

  // Only owners and editors can edit
  if (event.adminRole === 'scanner') {
    redirect(`/events/${id}/settings`);
  }

  return <EditEventForm event={event} />;
}

export default async function EditEventPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  await connection();
  const { id } = await params;
  const adminId = await getAdminSessionId();
  if (!adminId) redirect('/login');

  return (
    <div className="max-w-3xl mx-auto p-container-margin md:p-section-padding">
      <div className="mb-6">
        <PrefetchLink href="/events/all" warm={warmAllEvents} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest/50 border border-outline-variant/30 text-sm font-label-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:border-primary/30 transition-colors transition-transform transform-gpu active-scale">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to All Events
        </PrefetchLink>
      </div>

      <Suspense fallback={
        <div className="glass-panel p-8 rounded-3xl animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-1/3"></div>
          <div className="h-12 bg-slate-800 rounded w-full"></div>
          <div className="h-12 bg-slate-800 rounded w-full"></div>
        </div>
      }>
        <EditEventContent id={id} adminId={adminId} />
      </Suspense>
    </div>
  );
}

