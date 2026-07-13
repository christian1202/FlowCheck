import Link from 'next/link';
import { getEventsForAdmin } from '@/data/events';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ScannerSelectPage() {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }
  
  let events: any[] = [];
  let error = null;
  
  try {
    const allEvents = await getEventsForAdmin(adminId);
    // Scanners usually only need to see open events
    events = allEvents.filter((e: any) => e.status === 'open');
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="p-container-margin md:p-section-padding flex-1 fade-in-stagger w-full max-w-7xl mx-auto">
      {/* Hero Greeting */}
      <div className="mb-10">
        <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
          Scanner Access
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Select an active event to start scanning attendee QR codes.
        </p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 font-body-md text-sm">
          Could not load events: {error}
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        <div className="space-y-6">
          {events.length === 0 && !error ? (
            <div className="text-center border-2 border-dashed border-outline-variant rounded-xl p-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">qr_code_scanner</span>
              <h3 className="font-label-sm font-bold text-primary">No active events</h3>
              <p className="mt-1 font-body-md text-on-surface-variant mb-6">There are no open events available for scanning at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}/scanner`} className="block group">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-surface-container-high overflow-hidden flex flex-col sm:flex-row h-full border-l-4 border-l-primary">
                    <div className="p-6 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-headline-md text-headline-md text-primary font-bold group-hover:underline decoration-2 underline-offset-4">{event.title}</h4>
                          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors transform group-hover:translate-x-1">qr_code_scanner</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">location_on</span>
                          {event.location || 'No location set'} • {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-auto">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-label-xs font-bold uppercase tracking-wider">
                          Open Scanner
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
