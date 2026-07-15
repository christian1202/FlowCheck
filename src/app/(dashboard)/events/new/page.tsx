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
    <div className="max-w-4xl mx-auto p-container-margin md:p-section-padding fade-in-stagger">
      <div className="mb-6">
        <Link href="/events/all" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest/50 border border-outline-variant/30 text-sm font-label-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:border-primary/30 transition-all active-scale">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to All Events
        </Link>
      </div>

      <div className="glass-panel p-6 sm:p-10 rounded-3xl relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="mb-8 border-b border-outline-variant/30 pb-6">
            <h3 className="text-2xl font-display-md font-bold text-primary tracking-tight">Create New Event</h3>
            <p className="mt-2 text-sm font-body-md text-on-surface-variant max-w-2xl">
              Fill out the details below to create a new event. It will be saved as a draft initially.
            </p>
          </div>
          
          {state?.error?.form && (
            <div className="mb-6 bg-error/10 border border-error/20 p-4 rounded-2xl flex items-start gap-3 text-error">
              <span className="material-symbols-outlined shrink-0">error</span>
              <p className="text-sm font-medium">{state.error.form[0]}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
                  Event Title <span className="text-error">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined">title</span>
                  </div>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-highest/30 border border-outline-variant/50 rounded-xl text-on-surface font-body-md focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    placeholder="e.g. Annual Tech Conference 2026"
                  />
                </div>
                {state?.error?.title && <p className="mt-2 text-xs font-semibold text-error">{state.error.title[0]}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
                  Description <span className="text-error">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined">notes</span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-highest/30 border border-outline-variant/50 rounded-xl text-on-surface font-body-md focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    placeholder="Event details and agenda..."
                  />
                </div>
                {state?.error?.description && <p className="mt-2 text-xs font-semibold text-error">{state.error.description[0]}</p>}
              </div>

              {/* Date, Time, Capacity Row */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Date & Time */}
                <div className="sm:col-span-1 lg:col-span-1 flex flex-col h-full">
                  <label htmlFor="date" className="block text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Date & Time <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <input
                      type="datetime-local"
                      name="date"
                      id="date"
                      required
                      className="w-full px-4 py-3 bg-surface-container-highest/30 border border-outline-variant/50 rounded-xl text-on-surface font-body-md focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                  </div>
                  {state?.error?.date && <p className="mt-2 text-xs font-semibold text-error">{state.error.date[0]}</p>}
                </div>

                {/* Auto Close */}
                <div className="sm:col-span-1 lg:col-span-1 flex flex-col h-full">
                  <label htmlFor="closesAt" className="block text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
                    <span className="flex items-center gap-1.5" title="Event closes automatically after this time">
                      <Clock className="w-4 h-4" /> Auto-Close Time <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <input
                      type="datetime-local"
                      name="closesAt"
                      id="closesAt"
                      required
                      className="w-full px-4 py-3 bg-surface-container-highest/30 border border-outline-variant/50 rounded-xl text-on-surface font-body-md focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                  </div>
                  {state?.error?.closesAt && <p className="mt-2 text-xs font-semibold text-error">{state.error.closesAt[0]}</p>}
                </div>

                {/* Capacity */}
                <div className="sm:col-span-2 lg:col-span-1 flex flex-col h-full">
                  <label htmlFor="maxAttendees" className="block text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Capacity
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <input
                      type="number"
                      name="maxAttendees"
                      id="maxAttendees"
                      min="1"
                      className="w-full px-4 py-3 bg-surface-container-highest/30 border border-outline-variant/50 rounded-xl text-on-surface font-body-md focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      placeholder="e.g. 500 (Optional)"
                    />
                  </div>
                  {state?.error?.maxAttendees && <p className="mt-2 text-xs font-semibold text-error">{state.error.maxAttendees[0]}</p>}
                </div>
              </div>

              {/* Location & Maps */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col h-full">
                  <label htmlFor="location" className="block text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Location Name <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <input
                      type="text"
                      name="location"
                      id="location"
                      required
                      className="w-full px-4 py-3 bg-surface-container-highest/30 border border-outline-variant/50 rounded-xl text-on-surface font-body-md focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      placeholder="e.g. Main Hall, Tech Center"
                    />
                  </div>
                  {state?.error?.location && <p className="mt-2 text-xs font-semibold text-error">{state.error.location[0]}</p>}
                </div>

                <div className="flex flex-col h-full">
                  <label htmlFor="mapLink" className="block text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Map className="w-4 h-4" /> Maps URL <span className="text-error">*</span>
                      </span>
                      <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:text-blue-500 flex items-center bg-blue-50 px-2 py-0.5 rounded-full" title="Open Google Maps to find the location">
                        Find <span className="material-symbols-outlined text-[12px] ml-0.5">open_in_new</span>
                      </a>
                    </span>
                  </label>
                  <div className="mt-auto relative">
                    <input
                      type="url"
                      name="mapLink"
                      id="mapLink"
                      required
                      className="w-full px-4 py-3 bg-surface-container-highest/30 border border-outline-variant/50 rounded-xl text-on-surface font-body-md focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                  {state?.error?.mapLink && <p className="mt-2 text-xs font-semibold text-error">{state.error.mapLink[0]}</p>}
                </div>
              </div>

            </div>

            <div className="pt-8 mt-8 border-t border-outline-variant/30 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex justify-center items-center py-3 px-8 shadow-sm text-sm font-label-sm font-bold rounded-xl text-white bg-primary hover:bg-tertiary-container focus:outline-none transition-all active-scale disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <span className="material-symbols-outlined mr-2 animate-spin">progress_activity</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">add_task</span>
                    Create Event
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
