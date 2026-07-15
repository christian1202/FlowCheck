import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getEventsPaginated } from '@/data/events';
import EventsList from '@/components/events/EventsList';

export default async function ScannerSelectPage() {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let initialEvents: any[] = [];
  let error = null;
  
  try {
    // Fetch initial page of events (first 20)
    initialEvents = await getEventsPaginated(adminId, 1, 20);
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="p-container-margin md:p-section-padding flex-1 fade-in-stagger w-full max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Hero Greeting */}
      <div className="mb-6">
        <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
          Scanner Access
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Select an event to start scanning attendee QR codes.
        </p>
      </div>

      {error ? (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 font-body-md text-sm">
          Could not load events: {error}
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <EventsList initialEvents={initialEvents} linkSuffix="/scanner" />
        </div>
      )}
    </div>
  );
}
