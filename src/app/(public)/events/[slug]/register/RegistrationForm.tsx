'use client';

import { useActionState, useState } from 'react';
import { submitRegistrationAction } from '@/actions/registration';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function RegistrationForm({ eventId }: { eventId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [queuedEmail, setQueuedEmail] = useState(false);

  // We bind the eventId to the server action
  const submitWithId = submitRegistrationAction.bind(null, eventId);
  const [state, formAction] = useActionState(submitWithId, null);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    const result = await submitWithId(formData);
    setIsPending(false);
    
    if (result?.success) {
      setSuccess(true);
      setQueuedEmail(!!result.queuedEmail);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h3 className="mt-4 text-2xl font-bold text-gray-900">Registration Successful!</h3>
        <div className="mt-4 text-gray-600">
          <p>You have successfully registered for the event.</p>
          {queuedEmail ? (
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-200">
              <p className="font-semibold">Note about your ticket:</p>
              <p className="mt-1">
                Due to high volume today, your QR code ticket will be emailed to you later. 
                Don't worry, your spot is secured!
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm">
              We've sent your QR code ticket to your email. Please check your inbox (and spam folder) and present it at the entrance.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={(e) => {
      // Prevent default to manage pending state manually for better UX, or let React 19 handle it.
      // We will let React 19 handle the formAction directly.
    }} className="space-y-6">
      
      {state?.error?.form && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{state.error.form[0]}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
        <div className="mt-1">
          <input type="text" name="name" id="name" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="Juan dela Cruz" />
        </div>
        {state?.error?.name && <p className="mt-1 text-sm text-red-600">{state.error.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
        <div className="mt-1">
          <input type="email" name="email" id="email" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="juan@example.com" />
        </div>
        {state?.error?.email && <p className="mt-1 text-sm text-red-600">{state.error.email[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="local" className="block text-sm font-medium text-gray-700">Local <span className="text-red-500">*</span></label>
          <div className="mt-1">
            <input type="text" name="local" id="local" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="e.g. Mabolo" />
          </div>
          {state?.error?.local && <p className="mt-1 text-sm text-red-600">{state.error.local[0]}</p>}
        </div>

        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700">District <span className="text-red-500">*</span></label>
          <div className="mt-1">
            <input type="text" name="district" id="district" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="e.g. North" />
          </div>
          {state?.error?.district && <p className="mt-1 text-sm text-red-600">{state.error.district[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="zone" className="block text-sm font-medium text-gray-700">Zone <span className="text-red-500">*</span></label>
          <div className="mt-1">
            <input type="text" name="zone" id="zone" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="e.g. 1" />
          </div>
          {state?.error?.zone && <p className="mt-1 text-sm text-red-600">{state.error.zone[0]}</p>}
        </div>

        <div>
          <label htmlFor="duty" className="block text-sm font-medium text-gray-700">Duty (Tungkulin) <span className="text-red-500">*</span></label>
          <div className="mt-1">
            <input type="text" name="duty" id="duty" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="e.g. Volunteer" />
          </div>
          {state?.error?.duty && <p className="mt-1 text-sm text-red-600">{state.error.duty[0]}</p>}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={(e) => {
            // We use a manual handler because useActionState redirect/success state handling can be tricky without a full page reload
            const form = e.currentTarget.closest('form');
            if (form) {
              const formData = new FormData(form);
              if (form.checkValidity()) {
                handleSubmit(formData);
              } else {
                form.reportValidity();
              }
            }
          }}
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Registering...' : 'Register Now'}
        </button>
      </div>
    </form>
  );
}
