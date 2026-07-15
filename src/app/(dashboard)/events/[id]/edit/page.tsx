import { getEventById } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import EditEventForm from '@/components/events/EditEventForm';

export default async function EditEventPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const adminId = await getAdminSessionId();
  if (!adminId) redirect('/login');

  const event = await getEventById(id, adminId).catch((err) => {
    if (err instanceof Error && err.message === 'Unauthorized') redirect('/events');
    notFound();
  });

  if (!event) notFound();

  // Only owners and editors can edit
  if (event.adminRole === 'scanner') {
    redirect(`/events/${id}/settings`);
  }

  return (
    <div className="max-w-3xl mx-auto p-container-margin md:p-section-padding">
      <div className="mb-6">
        <Link href="/events/all" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest/50 border border-outline-variant/30 text-sm font-label-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:border-primary/30 transition-all active-scale">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to All Events
        </Link>
      </div>

      <EditEventForm event={event} />
    </div>
  );
}
