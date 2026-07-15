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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-section-padding px-gutter">
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-10 text-center max-w-md">
          <span className="material-symbols-outlined text-primary text-5xl mb-4">event_busy</span>
          <h2 className="text-display-lg-mobile font-display-lg-mobile text-primary mb-2">Registration Closed</h2>
          <p className="font-body-md text-on-surface-variant">
            This event is currently not accepting registrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col items-center justify-center py-section-padding px-gutter">
      {/* Minimal Header for Transactional Flow */}
      <header className="mb-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "32px" }}>qr_code_scanner</span>
          <h1 className="font-headline-md text-headline-md text-primary tracking-tight">FlowCheck</h1>
        </div>
      </header>
      
      {/* Event Details Card */}
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-sm p-6 md:px-10 mb-6 border border-surface-container-highest">
        <h2 className="text-2xl font-display-md text-on-surface font-bold mb-2">{event.title}</h2>
        
        <div className="flex flex-col sm:flex-row sm:gap-6 gap-3 mb-4 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>
        
        {event.description && (
          <p className="text-on-surface-variant text-sm mt-4 border-t border-surface-container-highest pt-4">
            {event.description}
          </p>
        )}
      </div>
      
      {/* Main Registration Card Container */}
      <RegistrationForm eventId={event.id} />

      {/* Simplified Footer */}
      <footer className="mt-12 text-center">
        <p className="font-label-xs text-label-xs text-on-surface-variant opacity-70">© 2024 FlowCheck. Secure Encrypted Registration.</p>
      </footer>
    </div>
  );
}
