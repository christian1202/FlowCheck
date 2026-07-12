import Link from 'next/link';
import { getEventsForAdmin } from '@/data/events';
import { CalendarPlus, MapPin, Users, Activity } from 'lucide-react';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function EventsPage() {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  // Try to fetch events, but since DB is empty and no migrations ran, this will crash.
  // We'll wrap in try-catch to allow the UI to render for now.
  let events: any[] = [];
  let error = null;
  
  try {
    events = await getEventsForAdmin(adminId);
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Events</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track attendance for your events.</p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <CalendarPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Create Event
        </Link>
      </div>

      {error ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Could not load events: {error}
                <br />
                <span className="font-semibold">Note:</span> Ensure you have run database migrations.
              </p>
            </div>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-12">
          <CalendarPlus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
          <div className="mt-6">
            <Link
              href="/events/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <CalendarPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Event
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex flex-col space-y-3 hover:border-blue-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <Link href={`/events/${event.id}/settings`} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-lg font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-sm text-gray-500 truncate">{new Date(event.date).toLocaleDateString()}</p>
                  </Link>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${event.status === 'open' ? 'bg-green-100 text-green-800' : 
                    event.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {event.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{event.location || 'No location'}</span>
                </div>
                <div className="flex items-center">
                  <Users className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  <span>{event.maxAttendees ? `Max ${event.maxAttendees}` : 'Unlimited'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
