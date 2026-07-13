'use client';

import { useState, useEffect } from 'react';
import { submitRegistrationAction } from '@/actions/registration';
import QRCode from 'qrcode';

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
  const [scanToken, setScanToken] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // We need to keep track of form data across steps manually or just use a single form and hide/show sections.
  // Hiding/showing sections inside one form is easier for FormData collection.

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    setErrors({});
    
    const result = await submitRegistrationAction(eventId, formData);
    setIsPending(false);
    
    if (result?.success && result.scanToken) {
      setScanToken(result.scanToken);
      try {
        const url = await QRCode.toDataURL(result.scanToken, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
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
      <nav aria-label="Progress" className="mb-10 w-full">
        <ol className="flex items-start w-full" role="list">
          {/* Step 1 Indicator */}
          <li className="relative flex-1 flex flex-col items-center group">
            <div className="absolute top-4 left-1/2 w-full h-[2px] z-0" aria-hidden="true">
              <div className={`h-full w-full ${step >= 2 ? 'bg-primary' : 'bg-surface-variant'}`} />
            </div>
            <button type="button" onClick={() => step < 3 && goToStep(1)} disabled={step >= 3} className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${step >= 1 ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container-highest border-2 border-surface-variant text-on-surface-variant'}`}>
              <span className="font-label-sm text-label-sm">1</span>
            </button>
            <span className={`mt-3 font-label-xs text-label-xs text-center ${step >= 1 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Basic Info</span>
          </li>
          
          {/* Step 2 Indicator */}
          <li className="relative flex-1 flex flex-col items-center group">
            <div className="absolute top-4 left-1/2 w-full h-[2px] z-0" aria-hidden="true">
              <div className={`h-full w-full transition-colors duration-300 ${step >= 3 ? 'bg-primary' : 'bg-surface-variant'}`} />
            </div>
            <button type="button" onClick={() => step < 3 && goToStep(2)} disabled={step >= 3} className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 border-2 ${step >= 2 ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container-lowest border-surface-variant text-on-surface-variant'}`}>
              <span className="font-label-sm text-label-sm">2</span>
            </button>
            <span className={`mt-3 font-label-xs text-label-xs text-center ${step >= 2 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Group Info</span>
          </li>

          {/* Step 3 Indicator */}
          <li className="relative flex-1 flex flex-col items-center group">
            <button type="button" disabled className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 border-2 ${step >= 3 ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container-lowest border-surface-variant text-on-surface-variant'}`}>
              <span className="font-label-sm text-label-sm">3</span>
            </button>
            <span className={`mt-3 font-label-xs text-label-xs text-center ${step >= 3 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Confirm</span>
          </li>
        </ol>
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

              <div className="pt-4 flex justify-between items-center">
                <button type="button" onClick={() => goToStep(4)} className="text-primary font-label-sm hover:underline flex items-center gap-1">
                  Forgot your QR code?
                </button>
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
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 max-w-sm mx-auto shadow-sm mb-8 mt-4">
            <h2 className="font-headline-md text-headline-sm text-on-surface font-bold mb-3">
              Registration Successful
            </h2>
            <p className="font-body-sm text-body-md text-on-surface-variant mb-6">
              Please save this QR Code. You will need it for entry.
            </p>
            {qrCodeDataUrl ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-white rounded-xl shadow-inner border border-surface-container-highest">
                  <img src={qrCodeDataUrl} alt="Your Ticket QR Code" className="w-48 h-48" />
                </div>
                <a 
                  href={qrCodeDataUrl} 
                  download="flowcheck-ticket.png" 
                  className="h-touch-target px-6 bg-primary text-on-primary font-label-sm rounded-lg hover:bg-tertiary-container transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">download</span> Download Ticket
                </a>
              </div>
            ) : (
              <div className="animate-pulse w-48 h-48 bg-surface-variant rounded-xl mx-auto mb-4"></div>
            )}
          </div>
          
          <div className="flex justify-center">
             <button type="button" onClick={() => window.location.reload()} className="h-touch-target px-8 bg-surface-container-highest border border-outline-variant text-on-surface font-label-sm text-label-sm rounded-lg hover:bg-surface-variant transition-colors shadow-sm flex items-center justify-center gap-2">
                 Register Another Person
             </button>
          </div>
        </section>

        {/* STEP 4: Lookup Ticket */}
        <section className={`w-full transition-all duration-300 ${step === 4 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-2 invisible absolute'}`}>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Lookup Ticket</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">Enter the email address you used to register to retrieve your QR code.</p>
          
          <div className="space-y-6">
            {lookupError && (
              <div className="bg-error-container text-on-error-container p-4 rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <p className="text-sm">{lookupError}</p>
              </div>
            )}
            <div>
              <label htmlFor="lookupEmail" className="block font-label-sm text-label-sm text-on-surface mb-2">Email Address</label>
              <input 
                type="email" 
                id="lookupEmail" 
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className={`w-full h-touch-target px-4 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all`} 
                placeholder="juan@example.com" 
              />
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button type="button" onClick={() => goToStep(1)} className="h-touch-target px-6 text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
              </button>
              <button 
                type="button" 
                onClick={async () => {
                  if (!lookupEmail) return setLookupError('Please enter an email address');
                  setIsLookingUp(true);
                  setLookupError('');
                  const { lookupAttendeeAction } = await import('@/actions/registration');
                  const result = await lookupAttendeeAction(eventId, lookupEmail);
                  setIsLookingUp(false);
                  
                  if (result.success && result.scanToken) {
                    setScanToken(result.scanToken);
                    try {
                      const url = await QRCode.toDataURL(result.scanToken, {
                        errorCorrectionLevel: 'H',
                        margin: 2,
                        width: 300,
                        color: { dark: '#000000', light: '#ffffff' }
                      });
                      setQrCodeDataUrl(url);
                    } catch (err) {
                      console.error('Failed to generate QR code', err);
                    }
                    setStep(3); // Jump to success step to show QR
                  } else {
                    setLookupError(result.error || 'Registration not found');
                  }
                }} 
                disabled={isLookingUp} 
                className="h-touch-target px-8 bg-primary text-on-primary font-label-sm text-label-sm rounded-lg hover:bg-tertiary-container transition-colors shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLookingUp ? 'Looking up...' : 'Lookup Ticket'} <span className="material-symbols-outlined text-[18px]">search</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
