'use client';

import { useActionState, useEffect, startTransition } from 'react';
import { createEventAction } from '@/actions/events';
import { Calendar, MapPin, Users, ArrowLeft, Clock, Map } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/events" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Event</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Fill out the details below to create a new event. It will be saved as a draft.</p>
          </div>
          
          {state?.error?.form && (
            <div className="mt-4 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{state.error.form[0]}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Event Title <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="e.g. Annual Convention 2026"
                />
              </div>
              {state?.error?.title && <p className="mt-1 text-sm text-red-600">{state.error.title[0]}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                  placeholder="Optional details about the event..."
                />
              </div>
              {state?.error?.description && <p className="mt-1 text-sm text-red-600">{state.error.description[0]}</p>}
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                    Date & Time <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    name="date"
                    id="date"
                    required
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                  />
                </div>
                {state?.error?.date && <p className="mt-1 text-sm text-red-600">{state.error.date[0]}</p>}
              </div>

              <div>
                <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                    Capacity (Optional)
                  </span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="maxAttendees"
                    id="maxAttendees"
                    min="1"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                    placeholder="e.g. 500"
                  />
                </div>
                {state?.error?.maxAttendees && <p className="mt-1 text-sm text-red-600">{state.error.maxAttendees[0]}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="closesAt" className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                    Auto-Close Time (Optional)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mb-1">If set, the event will automatically close and block scanners after this time.</p>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    name="closesAt"
                    id="closesAt"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                  />
                </div>
                {state?.error?.closesAt && <p className="mt-1 text-sm text-red-600">{state.error.closesAt[0]}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center">
                  <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                  Location (Venue)
                </span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="location"
                  id="location"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                  placeholder="e.g. Main Hall"
                />
              </div>
              {state?.error?.location && <p className="mt-1 text-sm text-red-600">{state.error.location[0]}</p>}
            </div>

            <div>
              <label htmlFor="mapLink" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Map className="mr-1.5 h-4 w-4 text-gray-400" />
                    Google Maps Link
                  </span>
                  <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-500 flex items-center" title="Open Google Maps to find the location">
                    <span className="material-symbols-outlined text-[16px] mr-1">open_in_new</span>
                    Find in Maps
                  </a>
                </span>
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  name="mapLink"
                  id="mapLink"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
              {state?.error?.mapLink && <p className="mt-1 text-sm text-red-600">{state.error.mapLink[0]}</p>}
            </div>

            <div className="pt-5 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
