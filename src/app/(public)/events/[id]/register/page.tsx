import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/data/events';
import RegistrationForm from './RegistrationForm';

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventBySlug(id);

  if (!event) {
    notFound();
  }

  const isClosed = event.closesAt && new Date() > new Date(event.closesAt);

  if (event.status !== 'open' || isClosed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="glass-panel rounded-3xl shadow-xl p-10 text-center max-w-md relative z-10 fade-in-stagger">
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-red-500 text-4xl">event_busy</span>
          </div>
          <h2 className="text-2xl font-display-lg-mobile text-primary mb-3">Registration Closed</h2>
          <p className="font-body-md text-on-surface-variant">
            This event is currently not accepting registrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col items-center justify-center py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Minimal Header for Transactional Flow */}
      <header className="mb-8 flex flex-col items-center gap-3 relative z-10 fade-in-stagger w-full max-w-2xl">
        <div className="mx-auto w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
        </div>
        <h1 className="font-headline-md text-xl text-primary tracking-tight">FlowCheck Registration</h1>
      </header>
      
      {/* Event Details Card */}
      <div className="w-full max-w-2xl glass-panel rounded-3xl shadow-sm p-6 md:p-8 mb-6 relative z-10 fade-in-stagger">
        <h2 className="text-2xl md:text-3xl font-display-md text-primary font-bold mb-4">{event.title}</h2>
        
        <div className="flex flex-col sm:flex-row sm:gap-6 gap-3 mb-6 text-sm text-on-surface-variant">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            </div>
            <span className="font-medium">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
              </div>
              <span className="font-medium">{event.location}</span>
              {event.mapLink && (
                <a 
                  href={event.mapLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:text-blue-500 flex items-center ml-2 p-1 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors" 
                  title="View on Google Maps"
                >
                  <span className="material-symbols-outlined text-[16px]">map</span>
                </a>
              )}
            </div>
          )}
        </div>
        
        {event.description && (
          <p className="text-on-surface-variant text-sm mt-4 border-t border-outline-variant/30 pt-6">
            {event.description}
          </p>
        )}
      </div>
      
      {/* Main Registration Card Container */}
      <div className="w-full max-w-2xl relative z-10 fade-in-stagger" style={{ animationDelay: '0.1s' }}>
        <RegistrationForm eventId={event.id} />
      </div>

      {/* Simplified Footer */}
      <footer className="mt-12 text-center relative z-10 fade-in-stagger" style={{ animationDelay: '0.2s' }}>
        <p className="font-label-xs text-on-surface-variant opacity-70">© 2024 FlowCheck. Secure Encrypted Registration.</p>
      </footer>
    </div>
  );
}
