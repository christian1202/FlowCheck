'use client';

import { useState, useEffect } from 'react';
import { submitRegistrationAction } from '@/actions/registration';
import QRCode from 'qrcode';
import SystemInfoModal from '@/components/layout/SystemInfoModal';

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
      // Go back to step where error occurred if possible
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
    <main className="w-full glass-panel rounded-3xl shadow-xl p-6 md:p-10 relative">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <SystemInfoModal 
          iconOnly 
          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors active-scale flex items-center justify-center border border-outline-variant/30 bg-surface/50 shadow-sm" 
        />
      </div>

      {/* Progress Stepper */}
      <nav aria-label="Progress" className="mb-10 w-full relative z-10 pt-4 md:pt-0">
        <ol className="flex items-start w-full" role="list">
          {/* Step 1 Indicator */}
          <li className="relative flex-1 flex flex-col items-center group">
            <div className="absolute top-4 left-1/2 w-full h-[2px] z-0" aria-hidden="true">
              <div className={`h-full w-full ${step >= 2 ? 'bg-primary' : 'bg-surface-variant'}`} />
            </div>
            <button type="button" onClick={() => step < 3 && goToStep(1)} disabled={step >= 3} className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${step >= 1 ? 'bg-primary text-on-primary shadow-md' : 'bg-surface text-on-surface-variant border border-outline-variant'} ${step < 3 && 'hover:scale-110'}`}>
              <span className="font-label-sm font-semibold">1</span>
            </button>
            <span className={`mt-3 font-label-xs text-center ${step >= 1 ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}>Basic Info</span>
          </li>
          
          {/* Step 2 Indicator */}
          <li className="relative flex-1 flex flex-col items-center group">
            <div className="absolute top-4 left-1/2 w-full h-[2px] z-0" aria-hidden="true">
              <div className={`h-full w-full transition-colors duration-300 ${step >= 3 ? 'bg-primary' : 'bg-surface-variant'}`} />
            </div>
            <button type="button" onClick={() => step < 3 && goToStep(2)} disabled={step >= 3} className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${step >= 2 ? 'bg-primary text-on-primary shadow-md' : 'bg-surface text-on-surface-variant border border-outline-variant'} ${step < 3 && 'hover:scale-110'}`}>
              <span className="font-label-sm font-semibold">2</span>
            </button>
            <span className={`mt-3 font-label-xs text-center ${step >= 2 ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}>Group Info</span>
          </li>

          {/* Step 3 Indicator */}
          <li className="relative flex-1 flex flex-col items-center group">
            <button type="button" disabled className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${step >= 3 ? 'bg-primary text-on-primary shadow-md' : 'bg-surface text-on-surface-variant border border-outline-variant'}`}>
              <span className="font-label-sm font-semibold">3</span>
            </button>
            <span className={`mt-3 font-label-xs text-center ${step >= 3 ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}>Confirm</span>
          </li>
        </ol>
      </nav>

      {/* Form Steps Container */}
      <div className="relative min-h-[340px]">
        {errors.form && (
           <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-xl flex items-center gap-3 border border-red-200">
             <span className="material-symbols-outlined text-red-500">error</span>
             <p className="text-sm font-medium">{errors.form[0]}</p>
           </div>
        )}

        <form action={handleSubmit} className="w-full">
          {/* STEP 1: Personal Info */}
          <section className={`w-full transition-all duration-500 ease-out ${step === 1 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-4 invisible absolute'}`}>
            <h2 className="font-headline-md text-primary mb-6">Personal Information</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block font-label-sm text-on-surface font-semibold mb-2">Full Name</label>
                <input type="text" id="name" name="name" required className={`block w-full rounded-xl border ${errors.name ? 'border-red-400 ring-1 ring-red-400' : 'border-outline-variant'} bg-surface/50 py-3 px-4 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md placeholder:text-on-surface-variant/70`} placeholder="Juan dela Cruz" />
                {errors.name && <p className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[14px]">error</span>{errors.name[0]}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block font-label-sm text-on-surface font-semibold mb-2">Email Address</label>
                <input type="email" id="email" name="email" required className={`block w-full rounded-xl border ${errors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-outline-variant'} bg-surface/50 py-3 px-4 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md placeholder:text-on-surface-variant/70`} placeholder="juan@example.com" />
                {errors.email && <p className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[14px]">error</span>{errors.email[0]}</p>}
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button type="button" onClick={() => goToStep(4)} className="text-primary font-label-sm font-semibold hover:text-blue-700 transition-colors">
                  Forgot QR code?
                </button>
                <button type="button" onClick={() => goToStep(2)} className="px-6 py-3 bg-primary text-on-primary font-label-sm rounded-xl hover-lift active-scale shadow-md flex items-center gap-2 font-semibold">
                  Continue <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>

          {/* STEP 2: Group Info */}
          <section className={`w-full transition-all duration-500 ease-out ${step === 2 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-4 invisible absolute'}`}>
            <h2 className="font-headline-md text-primary mb-2">Group Information</h2>
            <p className="font-body-md text-on-surface-variant mb-6">Tell us which local and district you belong to.</p>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="local" className="block font-label-sm text-on-surface font-semibold mb-2">Local</label>
                  <input type="text" id="local" name="local" required className={`block w-full rounded-xl border ${errors.local ? 'border-red-400' : 'border-outline-variant'} bg-surface/50 py-3 px-4 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md`} placeholder="e.g. Mabolo" />
                  {errors.local && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.local[0]}</p>}
                </div>
                
                <div>
                  <label htmlFor="district" className="block font-label-sm text-on-surface font-semibold mb-2">District</label>
                  <input type="text" id="district" name="district" required className={`block w-full rounded-xl border ${errors.district ? 'border-red-400' : 'border-outline-variant'} bg-surface/50 py-3 px-4 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md`} placeholder="e.g. North" />
                  {errors.district && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.district[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="zone" className="block font-label-sm text-on-surface font-semibold mb-2">Zone</label>
                  <input type="text" id="zone" name="zone" required className={`block w-full rounded-xl border ${errors.zone ? 'border-red-400' : 'border-outline-variant'} bg-surface/50 py-3 px-4 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md`} placeholder="e.g. 1" />
                  {errors.zone && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.zone[0]}</p>}
                </div>
                
                <div>
                  <label htmlFor="duty" className="block font-label-sm text-on-surface font-semibold mb-2">Duty (Tungkulin)</label>
                  <input type="text" id="duty" name="duty" required className={`block w-full rounded-xl border ${errors.duty ? 'border-red-400' : 'border-outline-variant'} bg-surface/50 py-3 px-4 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md`} placeholder="e.g. Choir" />
                  {errors.duty && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.duty[0]}</p>}
                </div>
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button type="button" onClick={() => goToStep(1)} className="px-4 py-2 rounded-xl text-on-surface-variant font-label-sm hover:bg-surface-variant/50 transition-colors flex items-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
                </button>
                <button type="submit" disabled={isPending} className="px-6 py-3 bg-primary text-on-primary font-label-sm rounded-xl hover-lift active-scale shadow-md flex items-center gap-2 font-semibold disabled:opacity-50 disabled:hover:transform-none disabled:hover:box-shadow-none">
                  {isPending ? 'Submitting...' : 'Register'} <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </button>
              </div>
            </div>
          </section>
        </form>

        {/* STEP 3: Confirmation */}
        <section className={`w-full text-center transition-all duration-500 ease-out ${step === 3 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-4 invisible absolute'}`}>
          <div className="bg-green-50/50 border border-green-100 rounded-3xl p-8 max-w-sm mx-auto shadow-sm mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
            </div>
            <h2 className="font-headline-md text-green-800 font-bold mb-2">
              Registration Successful
            </h2>
            <p className="font-body-sm text-green-700/80 mb-6 font-medium">
              Please save this QR Code. You will need it for entry.
            </p>
            {qrCodeDataUrl ? (
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-100">
                  <img src={qrCodeDataUrl} alt="Your Ticket QR Code" className="w-48 h-48" />
                </div>
                <a 
                  href={qrCodeDataUrl} 
                  download="flowcheck-ticket.png" 
                  className="px-6 py-3 bg-green-600 text-white font-label-sm rounded-xl hover-lift active-scale shadow-md flex items-center justify-center gap-2 font-semibold"
                >
                  <span className="material-symbols-outlined">download</span> Download Ticket
                </a>
              </div>
            ) : (
              <div className="animate-pulse w-48 h-48 bg-surface-variant rounded-2xl mx-auto mb-4"></div>
            )}
          </div>
          
          <div className="flex justify-center">
             <button type="button" onClick={() => window.location.reload()} className="px-6 py-3 bg-surface border border-outline-variant text-on-surface font-label-sm rounded-xl active-scale hover:bg-surface-variant/50 transition-colors shadow-sm flex items-center justify-center gap-2 font-semibold">
                 Register Another Person
             </button>
          </div>
        </section>

        {/* STEP 4: Lookup Ticket */}
        <section className={`w-full transition-all duration-500 ease-out ${step === 4 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-4 invisible absolute'}`}>
          <h2 className="font-headline-md text-primary mb-2">Lookup Ticket</h2>
          <p className="font-body-md text-on-surface-variant mb-6">Enter the email address you used to register to retrieve your QR code.</p>
          
          <div className="space-y-5">
            {lookupError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center gap-3 border border-red-200">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm font-medium">{lookupError}</p>
              </div>
            )}
            <div>
              <label htmlFor="lookupEmail" className="block font-label-sm text-on-surface font-semibold mb-2">Email Address</label>
              <input 
                type="email" 
                id="lookupEmail" 
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className={`block w-full rounded-xl border border-outline-variant bg-surface/50 py-3 px-4 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md placeholder:text-on-surface-variant/70`} 
                placeholder="juan@example.com" 
              />
            </div>

            <div className="pt-6 flex justify-between items-center">
              <button type="button" onClick={() => goToStep(1)} className="px-4 py-2 rounded-xl text-on-surface-variant font-label-sm hover:bg-surface-variant/50 transition-colors flex items-center gap-2 font-semibold">
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
                className="px-6 py-3 bg-primary text-on-primary font-label-sm rounded-xl hover-lift active-scale shadow-md flex items-center gap-2 font-semibold disabled:opacity-50 disabled:hover:transform-none disabled:hover:box-shadow-none"
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
