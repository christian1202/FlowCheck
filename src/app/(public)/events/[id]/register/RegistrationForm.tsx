'use client';

import { useState } from 'react';
import { submitRegistrationAction } from '@/actions/registration';

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
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [queuedEmail, setQueuedEmail] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // We need to keep track of form data across steps manually or just use a single form and hide/show sections.
  // Hiding/showing sections inside one form is easier for FormData collection.

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    setErrors({});
    
    const result = await submitRegistrationAction(eventId, formData);
    setIsPending(false);
    
    if (result?.success) {
      setQueuedEmail(!!result.queuedEmail);
      setStep(3); // Success step
    } else if (result?.error) {
      setErrors(result.error);
      // Go back to step where error occurred if possible, for now just stay or go back to step 1
      if (('local' in result.error && result.error.local) || 
          ('district' in result.error && result.error.district) || 
          ('zone' in result.error && result.error.zone) || 
          ('duty' in result.error && result.error.duty)) {
        setStep(2);
      } else {
        setStep(1);
      }
    }
  };

  const goToStep = (s: number) => {
    setStep(s);
  };

  return (
    <main className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-md p-6 md:p-10 relative">
      {/* Progress Stepper */}
      <nav aria-label="Progress" className="mb-10">
        <ol className="flex items-center" role="list">
          {/* Step 1 Indicator */}
          <li className="relative pr-8 sm:pr-20" id="indicator-step-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className={`h-0.5 w-full ${step >= 1 ? 'bg-primary' : 'bg-surface-variant'}`} />
            </div>
            <button type="button" onClick={() => step < 3 && goToStep(1)} disabled={step === 3} className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${step >= 1 ? 'bg-primary border-primary text-on-primary' : 'bg-surface-variant border-2 border-surface-variant text-on-surface-variant'}`}>
              <span className="font-label-sm text-label-sm">1</span>
            </button>
          </li>
          
          {/* Step 2 Indicator */}
          <li className="relative pr-8 sm:pr-20" id="indicator-step-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className={`h-0.5 w-full transition-colors duration-300 ${step >= 2 ? 'bg-primary' : 'bg-surface-variant'}`} />
            </div>
            <button type="button" onClick={() => step < 3 && goToStep(2)} disabled={step === 3} className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 border-2 ${step >= 2 ? 'bg-primary border-primary text-on-primary' : 'bg-surface-variant border-surface-variant text-on-surface-variant'}`}>
              <span className="font-label-sm text-label-sm">2</span>
            </button>
          </li>

          {/* Step 3 Indicator */}
          <li className="relative" id="indicator-step-3">
            <button type="button" disabled className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 border-2 ${step >= 3 ? 'bg-primary border-primary text-on-primary' : 'bg-surface-variant border-surface-variant text-on-surface-variant'}`}>
              <span className="font-label-sm text-label-sm">3</span>
            </button>
          </li>
        </ol>
        <div className="flex justify-between mt-2 max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
          <span className={`font-label-xs text-label-xs ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>Basic Info</span>
          <span className={`font-label-xs text-label-xs ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>Group Info</span>
          <span className={`font-label-xs text-label-xs ${step >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>Confirm</span>
        </div>
      </nav>

      {/* Form Steps Container */}
      <div className="relative min-h-[300px]">
        {errors.form && (
           <div className="mb-4 bg-error-container text-on-error-container p-4 rounded-lg flex items-center gap-2">
             <span className="material-symbols-outlined">error</span>
             <p className="text-sm">{errors.form[0]}</p>
           </div>
        )}

        <form action={handleSubmit} className="w-full">
          {/* STEP 1: Personal Info */}
          <section className={`w-full transition-all duration-300 ${step === 1 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-2 invisible absolute'}`}>
            <h2 className="font-headline-md text-headline-md text-primary mb-6">Personal Information</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block font-label-sm text-label-sm text-on-surface mb-2">Full Name</label>
                <input type="text" id="name" name="name" required className={`w-full h-touch-target px-4 bg-surface-bright border ${errors.name ? 'border-error ring-error' : 'border-outline-variant'} rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all`} placeholder="Juan dela Cruz" />
                {errors.name && <p className="mt-2 font-label-xs text-label-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">error</span>{errors.name[0]}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block font-label-sm text-label-sm text-on-surface mb-2">Email Address</label>
                <input type="email" id="email" name="email" required className={`w-full h-touch-target px-4 bg-surface-bright border ${errors.email ? 'border-error ring-error' : 'border-outline-variant'} rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all`} placeholder="juan@example.com" />
                {errors.email && <p className="mt-2 font-label-xs text-label-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">error</span>{errors.email[0]}</p>}
              </div>

              <div className="pt-4 flex justify-end">
                <button type="button" onClick={() => goToStep(2)} className="h-touch-target px-8 bg-primary text-on-primary font-label-sm text-label-sm rounded-lg hover:bg-tertiary-container transition-colors shadow-sm hover:shadow-md flex items-center gap-2">
                  Continue <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>

          {/* STEP 2: Group Info */}
          <section className={`w-full transition-all duration-300 ${step === 2 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-2 invisible absolute'}`}>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Group Information</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">Tell us which local and district you belong to.</p>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="local" className="block font-label-sm text-label-sm text-on-surface mb-2">Local</label>
                  <input type="text" id="local" name="local" required className={`w-full h-touch-target px-4 bg-surface-bright border ${errors.local ? 'border-error' : 'border-outline-variant'} rounded-lg font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all`} placeholder="e.g. Mabolo" />
                  {errors.local && <p className="mt-1 font-label-xs text-error">{errors.local[0]}</p>}
                </div>
                
                <div>
                  <label htmlFor="district" className="block font-label-sm text-label-sm text-on-surface mb-2">District</label>
                  <input type="text" id="district" name="district" required className={`w-full h-touch-target px-4 bg-surface-bright border ${errors.district ? 'border-error' : 'border-outline-variant'} rounded-lg font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all`} placeholder="e.g. North" />
                  {errors.district && <p className="mt-1 font-label-xs text-error">{errors.district[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="zone" className="block font-label-sm text-label-sm text-on-surface mb-2">Zone</label>
                  <input type="text" id="zone" name="zone" required className={`w-full h-touch-target px-4 bg-surface-bright border ${errors.zone ? 'border-error' : 'border-outline-variant'} rounded-lg font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all`} placeholder="e.g. 1" />
                  {errors.zone && <p className="mt-1 font-label-xs text-error">{errors.zone[0]}</p>}
                </div>
                
                <div>
                  <label htmlFor="duty" className="block font-label-sm text-label-sm text-on-surface mb-2">Duty (Tungkulin)</label>
                  <input type="text" id="duty" name="duty" required className={`w-full h-touch-target px-4 bg-surface-bright border ${errors.duty ? 'border-error' : 'border-outline-variant'} rounded-lg font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all`} placeholder="e.g. Volunteer" />
                  {errors.duty && <p className="mt-1 font-label-xs text-error">{errors.duty[0]}</p>}
                </div>
              </div>

              <div className="pt-8 flex justify-between items-center">
                <button type="button" onClick={() => goToStep(1)} className="h-touch-target px-6 text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
                </button>
                <button type="submit" disabled={isPending} className="h-touch-target px-8 bg-primary text-on-primary font-label-sm text-label-sm rounded-lg hover:bg-tertiary-container transition-colors shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isPending ? 'Submitting...' : 'Register'} <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </button>
              </div>
            </div>
          </section>
        </form>

        {/* STEP 3: Confirmation */}
        <section className={`w-full text-center transition-all duration-300 ${step === 3 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-2 invisible absolute'}`}>
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "32px" }}>check_circle</span>
            </div>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Registration Complete!</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-md mx-auto">
            {queuedEmail 
              ? "Due to high volume today, your QR code ticket will be emailed to you later. Don't worry, your spot is secured!"
              : "We've sent your QR code ticket to your email. Please check your inbox and present it at the entrance."
            }
          </p>
          
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 inline-block shadow-sm mb-8">
            <div className="w-48 h-48 bg-surface-variant relative mx-auto flex items-center justify-center rounded-lg">
               <span className="material-symbols-outlined text-on-surface-variant text-5xl">qr_code_2</span>
            </div>
            <div className="mt-4 font-label-sm text-label-sm text-on-surface tracking-widest uppercase">
                Check Email
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <button type="button" onClick={() => window.location.reload()} className="h-touch-target px-8 bg-surface-container-lowest border border-outline-variant text-primary font-label-sm text-label-sm rounded-lg hover:bg-surface-container-high transition-colors shadow-sm flex items-center justify-center gap-2">
                 Register Another Person
             </button>
          </div>
        </section>
      </div>
    </main>
  );
}
