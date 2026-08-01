import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/data/events';
import RegistrationForm from './RegistrationForm';
import Image from 'next/image';

export const revalidate = 60;

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
      <div className="min-h-screen bg-ambient-mesh text-slate-100 flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="claude-card rounded-3xl p-8 text-center max-w-md border border-red-500/30 bg-red-950/20 shadow-2xl relative z-10 fade-in-stagger">
          <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-4 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <span className="material-symbols-outlined text-3xl">event_busy</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Registration Closed</h2>
          <p className="text-xs text-slate-400 font-mono">
            This event stream is no longer accepting new attendee registrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ambient-mesh text-slate-100 font-sans antialiased min-h-screen flex flex-col items-center justify-center py-10 px-4 md:px-8 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Header */}
      <header className="mb-6 flex flex-col items-center gap-2 relative z-10 fade-in-stagger w-full max-w-2xl text-center">
        <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-1 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <Image src="/images/flowchecklogo-final-bg-white-big.png" alt="FlowCheck" width={40} height={40} className="h-8 w-8 object-contain" priority />
        </div>
        <h1 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">FlowCheck Pass Portal</h1>
      </header>
      
      {/* Premium Event Details Card */}
      <div className="w-full max-w-2xl claude-card rounded-3xl shadow-2xl p-6 md:p-8 mb-6 relative z-10 fade-in-stagger border border-white/10 bg-slate-950/95 md:bg-slate-950/70 md:backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono uppercase tracking-widest shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Registration Open</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Verified Event Node</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-5 gradient-text">
          {event.title}
        </h2>
        
        {/* Info Micro-Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          
          {/* Date Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 md:hover:border-amber-500/30 transition-colors duration-150 transform-gpu">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Date & Time</span>
              <span className="text-xs font-semibold text-slate-200 truncate">
                {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Location Card */}
          {event.location && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 md:hover:border-amber-500/30 transition-colors duration-150 transform-gpu">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">location_on</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Venue Location</span>
                <span className="text-xs font-semibold text-slate-200 truncate">{event.location}</span>
              </div>
              {event.mapLink && (
                <a 
                  href={event.mapLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 md:hover:bg-amber-500/20 transition-colors duration-150 transform-gpu text-xs font-mono flex items-center gap-1.5 shrink-0 active-scale shadow-[0_0_10px_rgba(245,158,11,0.15)]" 
                  title="View on Google Maps"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  <span className="hidden xs:inline">Map</span>
                </a>
              )}
            </div>
          )}

        </div>
        
        {/* Event Description Container */}
        {event.description && (
          <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-amber-400">info</span>
              About This Event
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {event.description}
            </p>
          </div>
        )}
      </div>
      
      {/* Registration Form Card */}
      <div className="w-full max-w-2xl relative z-10 fade-in-stagger" style={{ animationDelay: '0.08s' }}>
        <RegistrationForm eventId={event.id} eventTitle={event.title} />
      </div>

      <footer className="mt-8 text-center relative z-10 fade-in-stagger opacity-60">
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">© 2026 FlowCheck Platform. Encrypted Telemetry & Ticket Node.</p>
      </footer>
    </div>
  );
}
