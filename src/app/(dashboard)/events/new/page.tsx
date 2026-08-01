'use client';

import { useActionState, useEffect, startTransition } from 'react';
import { createEventAction } from '@/actions/events';
import { Calendar, MapPin, Users, Clock, Map } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewEventPage() {
  const [state, formAction, isPending] = useActionState(createEventAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push('/events');
    }
  }, [state, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dateStr = formData.get('date') as string;
    if (dateStr) formData.set('date', new Date(dateStr).toISOString());
    
    const closesAtStr = formData.get('closesAt') as string;
    if (closesAtStr) formData.set('closesAt', new Date(closesAtStr).toISOString());
    
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 fade-in-stagger">
      <div className="mb-6">
        <Link 
          href="/events/all" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 hover:border-amber-500/30 transition-all active-scale"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to All Events</span>
        </Link>
      </div>

      <div className="claude-card p-6 sm:p-10 rounded-3xl relative overflow-hidden text-slate-100 border border-white/10 bg-slate-950/95 md:bg-slate-950/70 md:backdrop-blur-xl shadow-2xl">
        {/* Decorative ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10">
          <div className="mb-8 border-b border-white/10 pb-6">
            <h3 className="text-2xl font-bold text-white tracking-tight gradient-text">Create New Event</h3>
            <p className="mt-2 text-xs text-slate-400 max-w-2xl font-sans leading-relaxed">
              Fill out the operational details below to deploy a new event node. It will be saved as a draft initially.
            </p>
          </div>
          
          {state?.error?.form && (
            <div className="mb-6 bg-red-950/60 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 text-red-300 text-xs font-mono">
              <span className="material-symbols-outlined shrink-0 text-red-400">error</span>
              <p className="font-medium">{state.error.form[0]}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                  Event Title <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">title</span>
                  </div>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                    placeholder="e.g. Annual Tech Conference 2026"
                  />
                </div>
                {state?.error?.title && <p className="mt-2 text-xs font-mono text-red-400">{state.error.title[0]}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                  Description <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">notes</span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                    placeholder="Event details, agenda, and attendee guidelines..."
                  />
                </div>
                {state?.error?.description && <p className="mt-2 text-xs font-mono text-red-400">{state.error.description[0]}</p>}
              </div>

              {/* Date, Time, Capacity Row */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                
                {/* Date & Time */}
                <div className="flex flex-col h-full">
                  <label htmlFor="date" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Start Date & Time <span className="text-amber-400">*</span>
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <input
                      type="datetime-local"
                      name="date"
                      id="date"
                      required
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono [color-scheme:dark]"
                    />
                  </div>
                  {state?.error?.date && <p className="mt-2 text-xs font-mono text-red-400">{state.error.date[0]}</p>}
                </div>

                {/* Auto Close */}
                <div className="flex flex-col h-full">
                  <label htmlFor="closesAt" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5" title="Event closes automatically after this time">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Auto-Close Time <span className="text-amber-400">*</span>
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <input
                      type="datetime-local"
                      name="closesAt"
                      id="closesAt"
                      required
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono [color-scheme:dark]"
                    />
                  </div>
                  {state?.error?.closesAt && <p className="mt-2 text-xs font-mono text-red-400">{state.error.closesAt[0]}</p>}
                </div>

                {/* Capacity */}
                <div className="flex flex-col h-full sm:col-span-2 lg:col-span-1">
                  <label htmlFor="maxAttendees" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" /> Max Capacity
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <input
                      type="number"
                      name="maxAttendees"
                      id="maxAttendees"
                      min="1"
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                      placeholder="e.g. 500 (Optional)"
                    />
                  </div>
                  {state?.error?.maxAttendees && <p className="mt-2 text-xs font-mono text-red-400">{state.error.maxAttendees[0]}</p>}
                </div>
              </div>

              {/* Location & Maps */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col h-full">
                  <label htmlFor="location" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location Venue <span className="text-amber-400">*</span>
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="location"
                      id="location"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                      placeholder="e.g. Main Hall, Tech Center"
                    />
                  </div>
                  {state?.error?.location && <p className="mt-2 text-xs font-mono text-red-400">{state.error.location[0]}</p>}
                </div>

                <div className="flex flex-col h-full">
                  <label htmlFor="mapLink" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5 text-amber-400" /> Google Maps URL <span className="text-amber-400">*</span>
                    </span>
                  </label>
                  <div className="mt-auto relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Map className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      name="mapLink"
                      id="mapLink"
                      required
                      className="w-full pl-11 pr-24 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                      placeholder="https://maps.app.goo.gl/..."
                    />
                    <a 
                      href="https://maps.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-[11px] font-mono transition-all flex items-center gap-1 shrink-0 active-scale shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                      title="Open Google Maps to search location"
                    >
                      <span>Find</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  </div>
                  {state?.error?.mapLink && <p className="mt-2 text-xs font-mono text-red-400">{state.error.mapLink[0]}</p>}
                </div>
              </div>

            </div>

            <div className="pt-8 mt-8 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex justify-center items-center py-3.5 px-8 text-xs font-bold font-sans rounded-xl text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] active-scale disabled:opacity-50 disabled:cursor-not-allowed gap-2"
              >
                {isPending ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    <span>Creating Event...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">add_task</span>
                    <span>Create Event</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
