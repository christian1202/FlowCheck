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
        <Link href={`/events/${id}/settings`} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Event Settings
        </Link>
      </div>

      <EditEventForm event={event} />
    </div>
  );
}
