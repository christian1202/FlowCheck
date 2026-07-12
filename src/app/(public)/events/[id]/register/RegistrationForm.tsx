'use client';

import { useState } from 'react';
import { submitRegistrationAction } from '@/actions/registration';
import { CheckCircle, AlertCircle } from 'lucide-react';

type FormErrors = {
  form?: string[];
  name?: string[];
  email?: string[];
  local?: string[];
  district?: string[];
  zone?: string[];
  duty?: string[];
};

export default function RegistrationForm({ eventId }: { eventId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [queuedEmail, setQueuedEmail] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    setErrors({});
    
    const result = await submitRegistrationAction(eventId, formData);
    setIsPending(false);
    
    if (result?.success) {
      setSuccess(true);
      setQueuedEmail(!!result.queuedEmail);
    } else if (result?.error) {
      setErrors(result.error);
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
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit(formData);
    }} className="space-y-6">
      
      {errors.form && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{errors.form[0]}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
        <div className="mt-1">
          <input type="text" name="name" id="name" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="Juan dela Cruz" />
        </div>
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
        <div className="mt-1">
          <input type="email" name="email" id="email" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="juan@example.com" />
        </div>
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="local" className="block text-sm font-medium text-gray-700">Local <span className="text-red-500">*</span></label>
          <div className="mt-1">
            <input type="text" name="local" id="local" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="e.g. Mabolo" />
          </div>
          {errors.local && <p className="mt-1 text-sm text-red-600">{errors.local[0]}</p>}
        </div>

        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700">District <span className="text-red-500">*</span></label>
          <div className="mt-1">
            <input type="text" name="district" id="district" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="e.g. North" />
          </div>
          {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="zone" className="block text-sm font-medium text-gray-700">Zone <span className="text-red-500">*</span></label>
          <div className="mt-1">
            <input type="text" name="zone" id="zone" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="e.g. 1" />
          </div>
          {errors.zone && <p className="mt-1 text-sm text-red-600">{errors.zone[0]}</p>}
        </div>

        <div>
          <label htmlFor="duty" className="block text-sm font-medium text-gray-700">Duty (Tungkulin) <span className="text-red-500">*</span></label>
          <div className="mt-1">
            <input type="text" name="duty" id="duty" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" placeholder="e.g. Volunteer" />
          </div>
          {errors.duty && <p className="mt-1 text-sm text-red-600">{errors.duty[0]}</p>}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Registering...' : 'Register Now'}
        </button>
      </div>
    </form>
  );
}
