'use client';

import { useActionState, useEffect, startTransition } from 'react';
import { updateEventAction } from '@/actions/events';
import { Calendar, MapPin, Users, Clock, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { EventRow } from '@/data/events';
import { useIsMounted } from '@/hooks/useIsMounted';

// Convert JS Date to YYYY-MM-DDTHH:mm format required by datetime-local input
const formatDateForInput = (dateStr: Date | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function EditEventForm({ event }: { event: EventRow }) {
  const [state, formAction, isPending] = useActionState(updateEventAction.bind(null, event.id), null);
  const router = useRouter();
  const mounted = useIsMounted();

  useEffect(() => {
    if (state?.success) {
      router.push(`/events/${event.id}/settings`);
    }
  }, [state, router, event.id]);

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
    <div className="claude-card p-6 sm:p-8 rounded-3xl relative overflow-hidden fade-in-stagger text-slate-100 border border-white/10 bg-slate-950/95 md:bg-slate-950/70 md:backdrop-blur-xl shadow-2xl">
      
      <div className="relative z-10">
        <div className="mb-6 border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white tracking-tight gradient-text">Edit Event Settings</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl font-sans">
            Update the operational configurations and metadata for <span className="font-semibold text-slate-200">{event.title}</span>.
          </p>
        </div>
        
        {state?.error?.form && (
          <div className="mb-6 bg-red-950/60 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 text-red-300 text-xs font-mono">
            <span className="material-symbols-outlined shrink-0 text-red-400">error</span>
            <p>{state.error.form[0]}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
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
                  defaultValue={event.title}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                  placeholder="e.g. Annual Tech Summit 2026"
                />
              </div>
              {state?.error?.title && <p className="mt-1 text-[11px] font-mono text-red-400">{state.error.title[0]}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                Description <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-lg">notes</span>
                </div>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  required
                  defaultValue={event.description || ''}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                  placeholder="Describe your event..."
                />
              </div>
            </div>

            {/* Date & ClosesAt Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Start Date & Time <span className="text-amber-400">*</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    name="date"
                    id="date"
                    required
                    defaultValue={mounted ? formatDateForInput(event.date) : ''}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="closesAt" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Registration Close Time
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    name="closesAt"
                    id="closesAt"
                    defaultValue={mounted ? formatDateForInput(event.closesAt) : ''}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Location & Map Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location Venue
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    defaultValue={event.location || ''}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                    placeholder="e.g. Grand Ballroom, Hilton"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mapLink" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Map className="w-3.5 h-3.5 text-amber-400" /> Google Maps URL
                  </span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Map className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    name="mapLink"
                    id="mapLink"
                    defaultValue={event.mapLink || ''}
                    className="w-full pl-11 pr-24 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                    placeholder="https://maps.google.com/..."
                  />
                  <a 
                    href={event.mapLink || 'https://maps.google.com'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-[11px] font-mono transition-all flex items-center gap-1 shrink-0 active-scale shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                    title="Open Google Maps to search location"
                  >
                    <span>Find</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Capacity & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxAttendees" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Max Capacity Limit
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    name="maxAttendees"
                    id="maxAttendees"
                    min={1}
                    defaultValue={event.maxAttendees || ''}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                    placeholder="Leave blank for unlimited"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  Event Stream Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    id="status"
                    defaultValue={event.status}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono appearance-none cursor-pointer pr-10"
                  >
                    <option value="open" className="bg-slate-900 text-white">Open / Live</option>
                    <option value="closed" className="bg-slate-900 text-white">Closed / Finished</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-base">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center gap-2 active-scale"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
