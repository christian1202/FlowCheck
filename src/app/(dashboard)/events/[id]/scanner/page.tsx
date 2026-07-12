import { getEventById } from '@/data/events';
import { notFound, redirect } from 'next/navigation';
import QRScanner from '@/components/scanner/QRScanner';
import Link from 'next/link';
import { ArrowLeft, Scan } from 'lucide-react';
import { getAdminSessionId } from '@/lib/auth';

export default async function ScannerPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let event;
  try {
    event = await getEventById(id, adminId);
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      redirect('/events');
    }
    notFound();
  }

  if (event.status === 'draft' || event.status === 'archived') {
    return (
      <div className="max-w-md mx-auto text-center mt-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800">Scanner Disabled</h2>
          <p className="mt-2 text-sm text-yellow-700">
            Scanning is only available for open or recently closed events. 
            This event is currently set to <strong>{event.status}</strong>.
          </p>
          <div className="mt-6">
            <Link href={`/events/${event.id}/settings`} className="text-blue-600 hover:underline text-sm font-medium">
              Go to Event Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/events/${event.id}/settings`} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Event Settings
        </Link>
        <div className="flex items-center text-gray-500 text-sm">
          <Scan className="mr-1.5 h-4 w-4" />
          Live Scanner
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Entrance Scanner</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {event.title} — {new Date(event.date).toLocaleDateString()}
          </p>
        </div>
        
        <div className="p-6">
          <QRScanner eventId={event.id} />
        </div>
      </div>
    </div>
  );
}
