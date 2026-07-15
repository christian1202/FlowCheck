import Link from 'next/link';
import { getEventsPaginated } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EventsList from '@/components/events/EventsList';

export default async function AllEventsPage() {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let initialEvents: any[] = [];
  let error = null;
  
  try {
    initialEvents = await getEventsPaginated(adminId, 1, 20);
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="p-container-margin md:p-section-padding flex-1 fade-in-stagger w-full max-w-7xl mx-auto">
      {/* Hero Greeting */}
      <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
            All Events
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            View and manage all your past, present, and future events.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center px-6 py-3 bg-primary text-on-primary font-label-sm rounded-lg hover:bg-tertiary-container transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          New Event
        </Link>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 font-body-md text-sm">
          Could not load events: {error}
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        {!error && <EventsList initialEvents={initialEvents} />}
      </div>
    </div>
  );
}
