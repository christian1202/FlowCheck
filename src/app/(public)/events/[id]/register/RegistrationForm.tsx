'use client';

import { useState, useRef, useTransition, useCallback, useEffect, memo } from 'react';
import { submitRegistrationAction, lookupAttendeeAction } from '@/actions/registration';
import SystemInfoModal from '@/components/layout/SystemInfoModal';
import Image from 'next/image';
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

const ForgotQrButton = memo(function ForgotQrButton({
  onForgot,
  disabled
}: {
  onForgot: () => void;
  disabled?: boolean;
}) {
  const [active, setActive] = useState(false);

  const handleClick = useCallback(() => {
    setActive(true);
    setTimeout(() => setActive(false), 200);
    onForgot();
  }, [onForgot]);

  return (
    <button 
      type="button" 
      onClick={handleClick}
      disabled={disabled}
      className={`text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors duration-75 touch-manipulation select-none disabled:opacity-50 ${active ? 'opacity-70 scale-95' : ''}`}
    >
      Forgot QR ticket code?
    </button>
  );
});

const LookupSubmitButton = memo(function LookupSubmitButton({
  isLookingUp,
  disabled
}: {
  isLookingUp: boolean;
  disabled?: boolean;
}) {
  return (
    <button 
      type="submit" 
      disabled={isLookingUp || disabled} 
      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 md:hover:from-amber-400 md:hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors duration-75 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 disabled:opacity-50 active-scale touch-manipulation select-none"
    >
      {isLookingUp ? 'Searching...' : 'Lookup Ticket'} <span className="material-symbols-outlined text-base pointer-events-none">search</span>
    </button>
  );
});

export default function RegistrationForm({ 
  eventId, 
  eventTitle 
}: { 
  eventId: string; 
  eventTitle?: string;
}) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isStepPending, startStepTransition] = useTransition();
  const [, setScanToken] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showFullscreenQr, setShowFullscreenQr] = useState(false);
  
  const lookupEmailRef = useRef<HTMLInputElement>(null);
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);
  const lookupCache = useRef<Record<string, string>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullscreenQr) {
        setShowFullscreenQr(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenQr]);

  // Non-blocking async QR code generator to yield main thread paint first
  const generateQrDataUrl = useCallback((token: string) => {
    setTimeout(async () => {
      try {
        const url = await QRCode.toDataURL(token, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 400,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    }, 0);
  }, []);

  const resetForm = useCallback(() => {
    if (formRef.current) {
      formRef.current.reset();
    }
    setScanToken(null);
    setQrCodeDataUrl(null);
    setShowFullscreenQr(false);
    if (lookupEmailRef.current) {
      lookupEmailRef.current.value = '';
    }
    setLookupError('');
    setErrors({});
    setStep(1);
  }, []);

  const handleFormChange = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.name) {
      setErrors((prev) => {
        if (!prev.form && !prev[target.name as keyof FormErrors]) return prev;
        const updated = { ...prev };
        delete updated[target.name as keyof FormErrors];
        delete updated.form;
        return updated;
      });
    }
  }, []);

  const handleSubmit = (formData: FormData) => {
    setErrors({});
    setTimeout(() => {
      startTransition(async () => {
        const result = await submitRegistrationAction(eventId, formData);
        
        if (result?.success && result.scanToken) {
          setScanToken(result.scanToken);
          setStep(3);
          generateQrDataUrl(result.scanToken);
        } else if (result?.error) {
          setErrors(result.error);
          if (
            ('name' in result.error && result.error.name) ||
            ('email' in result.error && result.error.email) ||
            ('form' in result.error && result.error.form)
          ) {
            setStep(1);
          }
        }
      });
    }, 0);
  };

  const goToStep = useCallback((s: number) => {
    setErrors({});
    startStepTransition(() => {
      setStep(s);
    });
    if (s === 4) {
      setTimeout(() => {
        if (lookupEmailRef.current && !lookupEmailRef.current.value) {
          const step1Email = (formRef.current?.elements.namedItem('email') as HTMLInputElement)?.value;
          if (step1Email) {
            lookupEmailRef.current.value = step1Email;
          }
        }
        lookupEmailRef.current?.focus();
      }, 30);
    }
  }, [startStepTransition]);

  const handleLookupSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const inputVal = lookupEmailRef.current?.value.trim() || '';
    if (!inputVal) {
      setLookupError('Please enter an email address');
      return;
    }
    
    const emailKey = inputVal.toLowerCase();

    // 1. Synchronously set state for immediate visual response (< 16ms INP)
    setLookupError('');
    setIsLookingUp(true);
    
    // Check local cache
    if (lookupCache.current[emailKey]) {
      const cachedToken = lookupCache.current[emailKey];
      setScanToken(cachedToken);
      setIsLookingUp(false);
      setStep(3);
      generateQrDataUrl(cachedToken);
      return;
    }
    
    // 2. Yield to browser paint before initiating async Server Action request
    setTimeout(() => {
      startTransition(async () => {
        const result = await lookupAttendeeAction(eventId, inputVal);
        setIsLookingUp(false);
        
        if (result.success && result.scanToken) {
          lookupCache.current[emailKey] = result.scanToken;
          setScanToken(result.scanToken);
          setStep(3);
          generateQrDataUrl(result.scanToken);
        } else {
          setLookupError(result.error || 'Registration not found');
        }
      });
    }, 0);
  };

  return (
    <main className="w-full claude-card rounded-3xl shadow-2xl p-6 md:p-10 relative border border-white/10 text-slate-100">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <SystemInfoModal 
          iconOnly 
          className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors duration-75 active-scale flex items-center justify-center border border-white/10 bg-slate-950/60 touch-manipulation select-none" 
        />
      </div>

      {/* Progress Stepper */}
      <nav aria-label="Progress" className="mb-10 w-full relative z-10 pt-4 md:pt-0">
        <ol className="flex items-start w-full" role="list">
          {/* Step 1 */}
          <li className="relative flex-1 flex flex-col items-center group">
            <div className="absolute top-4 left-1/2 w-full h-[2px] z-0" aria-hidden="true">
              <div className={`h-full w-full ${step >= 2 ? 'bg-amber-500' : 'bg-white/10'}`} />
            </div>
            <button 
              type="button" 
              onClick={() => step < 3 && !isStepPending && goToStep(1)} 
              disabled={step >= 3 || isStepPending} 
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-75 touch-manipulation select-none ${step >= 1 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-white/10'} ${step < 3 ? 'hover:scale-110' : ''} ${isStepPending ? 'opacity-60' : ''}`}
            >
              <span className="text-xs font-mono">1</span>
            </button>
            <span className={`mt-2.5 text-[11px] font-mono text-center uppercase tracking-wider ${step >= 1 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>Basic Info</span>
          </li>
          
          {/* Step 2 */}
          <li className="relative flex-1 flex flex-col items-center group">
            <div className="absolute top-4 left-1/2 w-full h-[2px] z-0" aria-hidden="true">
              <div className={`h-full w-full transition-colors duration-75 ${step >= 3 ? 'bg-amber-500' : 'bg-white/10'}`} />
            </div>
            <button 
              type="button" 
              onClick={() => step < 3 && !isStepPending && goToStep(2)} 
              disabled={step >= 3 || isStepPending} 
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-75 touch-manipulation select-none ${step >= 2 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-white/10'} ${step < 3 ? 'hover:scale-110' : ''} ${isStepPending ? 'opacity-60' : ''}`}
            >
              <span className="text-xs font-mono">2</span>
            </button>
            <span className={`mt-2.5 text-[11px] font-mono text-center uppercase tracking-wider ${step >= 2 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>Group Info</span>
          </li>

          {/* Step 3 */}
          <li className="relative flex-1 flex flex-col items-center group">
            <button type="button" disabled className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-75 touch-manipulation select-none ${step >= 3 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-white/10'}`}>
              <span className="text-xs font-mono">3</span>
            </button>
            <span className={`mt-2.5 text-[11px] font-mono text-center uppercase tracking-wider ${step >= 3 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>Confirm</span>
          </li>
        </ol>
      </nav>

      {/* Form Container */}
      <div className="relative min-h-[320px]">
        {errors.form && (step === 1 || step === 2) && (
           <div className="mb-6 bg-red-950/60 text-red-300 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-red-500/30 text-xs font-mono">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-red-400 pointer-events-none">error</span>
               <p>{errors.form[0]}</p>
             </div>
             <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
               {errors.form[0].toLowerCase().includes('already registered') && (
                 <button 
                   type="button" 
                   onClick={() => goToStep(4)} 
                   disabled={isStepPending}
                   className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors duration-75 shrink-0 active-scale touch-manipulation select-none disabled:opacity-50"
                 >
                   Retrieve Ticket
                 </button>
               )}
               <button
                 type="button"
                 onClick={() => setErrors((prev) => ({ ...prev, form: undefined }))}
                 className="p-1 text-red-400 hover:text-red-200 transition-colors rounded-lg flex items-center justify-center active-scale touch-manipulation select-none"
                 aria-label="Dismiss error"
               >
                 <span className="material-symbols-outlined text-base pointer-events-none">close</span>
               </button>
             </div>
           </div>
        )}

        <form ref={formRef} action={handleSubmit} onChange={handleFormChange} className="w-full">
          {/* STEP 1 */}
          <section className={`w-full ${step === 1 ? 'block' : 'hidden'}`} style={{ contentVisibility: step === 1 ? 'visible' : 'auto' }}>
            <h2 className="text-lg font-bold text-white mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                <input type="text" id="name" name="name" required className={`block w-full rounded-xl border ${errors.name ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors duration-75 font-sans`} placeholder="Juan dela Cruz" />
                {errors.name && <p className="mt-1 text-[11px] font-mono text-red-400 flex items-center gap-1">{errors.name[0]}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
                <input type="email" id="email" name="email" required className={`block w-full rounded-xl border ${errors.email ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors duration-75 font-mono`} placeholder="juan@example.com" />
                {errors.email && <p className="mt-1 text-[11px] font-mono text-red-400 flex items-center gap-1">{errors.email[0]}</p>}
              </div>

              <div className="pt-6 flex justify-between items-center">
                <ForgotQrButton 
                  onForgot={() => goToStep(4)} 
                  disabled={isStepPending} 
                />
                <button 
                  type="button" 
                  onClick={() => goToStep(2)} 
                  disabled={isStepPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 md:hover:from-amber-400 md:hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors duration-75 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 active-scale touch-manipulation select-none disabled:opacity-50"
                >
                  <span>Continue</span> <span className="material-symbols-outlined text-base pointer-events-none">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>

          {/* STEP 2 */}
          <section className={`w-full ${step === 2 ? 'block' : 'hidden'}`}>
            <h2 className="text-lg font-bold text-white mb-1">Group Information</h2>
            <p className="text-xs text-slate-400 mb-4">Provide details regarding your assigned local and duty unit.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="local" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Local</label>
                  <input type="text" id="local" name="local" required className={`block w-full rounded-xl border ${errors.local ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors duration-75 font-sans`} placeholder="e.g. Mabolo" />
                  {errors.local && <p className="mt-1 text-[11px] font-mono text-red-400 flex items-center gap-1">{errors.local[0]}</p>}
                </div>
                
                <div>
                  <label htmlFor="district" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">District</label>
                  <input type="text" id="district" name="district" required className={`block w-full rounded-xl border ${errors.district ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors duration-75 font-sans`} placeholder="e.g. North" />
                  {errors.district && <p className="mt-1 text-[11px] font-mono text-red-400 flex items-center gap-1">{errors.district[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="zone" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Zone</label>
                  <input type="text" id="zone" name="zone" required className={`block w-full rounded-xl border ${errors.zone ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors duration-75 font-mono`} placeholder="e.g. 1" />
                  {errors.zone && <p className="mt-1 text-[11px] font-mono text-red-400 flex items-center gap-1">{errors.zone[0]}</p>}
                </div>
                
                <div>
                  <label htmlFor="duty" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Duty (Tungkulin)</label>
                  <input type="text" id="duty" name="duty" required className={`block w-full rounded-xl border ${errors.duty ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors duration-75 font-sans`} placeholder="e.g. Choir" />
                  {errors.duty && <p className="mt-1 text-[11px] font-mono text-red-400 flex items-center gap-1">{errors.duty[0]}</p>}
                </div>
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button 
                  type="button" 
                  onClick={() => goToStep(1)} 
                  disabled={isStepPending}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-white/10 transition-colors duration-75 flex items-center gap-1.5 text-xs font-mono touch-manipulation select-none disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base pointer-events-none">arrow_back</span> Back
                </button>
                <button 
                  type="submit" 
                  disabled={isPending} 
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 md:hover:from-amber-400 md:hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors duration-75 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 disabled:opacity-50 active-scale touch-manipulation select-none"
                >
                  {isPending ? 'Submitting...' : 'Complete Registration'} <span className="material-symbols-outlined text-base pointer-events-none">check_circle</span>
                </button>
              </div>
            </div>
          </section>
        </form>

        {/* STEP 3 */}
        <section className={`w-full text-center ${step === 3 ? 'block' : 'hidden'}`}>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-sm mx-auto shadow-2xl mb-6 relative overflow-hidden text-slate-900">
            <div className="mx-auto w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mb-3 text-emerald-600 shadow-sm">
              <span className="material-symbols-outlined text-2xl font-bold pointer-events-none">check</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 tracking-tight">
              Registration Successful
            </h2>
            {eventTitle && (
              <div className="my-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold font-mono truncate max-w-full">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span className="truncate">{eventTitle}</span>
              </div>
            )}
            <p className="text-xs text-slate-600 mb-5 font-sans">
              Please save this QR Code. You will need it for entry.
            </p>
            {qrCodeDataUrl ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFullscreenQr(true)}
                  className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 hover:border-amber-500/50 hover:shadow-lg transition-all duration-150 transform-gpu relative group cursor-pointer"
                  title="Click to expand QR Code full screen"
                >
                  <Image src={qrCodeDataUrl} alt="Your Ticket QR Code" width={224} height={224} className="w-52 h-52 sm:w-56 sm:h-56" unoptimized />
                  <div className="absolute inset-0 bg-slate-950/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono font-bold gap-1 bg-slate-950/40 backdrop-blur-[2px]">
                    <span className="material-symbols-outlined text-lg">fullscreen</span> Tap to Expand
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2 w-full mt-1">
                  <button
                    type="button"
                    onClick={() => setShowFullscreenQr(true)}
                    className="py-3 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 active-scale touch-manipulation select-none"
                  >
                    <span className="material-symbols-outlined text-lg pointer-events-none">fullscreen</span> Full Screen
                  </button>
                  <a 
                    href={qrCodeDataUrl} 
                    download="flowcheck-ticket.png" 
                    className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 active-scale touch-manipulation select-none"
                  >
                    <span className="material-symbols-outlined text-lg pointer-events-none">download</span> Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="animate-pulse w-56 h-56 bg-slate-100 rounded-2xl mx-auto mb-4 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-mono">
                Generating Ticket QR...
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center">
              <button 
                type="button" 
                onClick={resetForm} 
                onPointerDown={(e) => { e.preventDefault(); resetForm(); }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors duration-75 active-scale touch-manipulation select-none"
              >
                Register Another Person
              </button>
            </div>
          </div>
        </section>

        {/* STEP 4: FORGOT QR CODE / LOOKUP TICKET */}
        <section className={`w-full ${step === 4 ? 'block' : 'hidden'}`} style={{ contentVisibility: step === 4 ? 'visible' : 'auto' }}>
          <h2 className="text-lg font-bold text-white mb-1">Lookup Ticket</h2>
          <p className="text-xs text-slate-400 mb-4">Enter your registered email address to retrieve your QR entry ticket.</p>
          
          <form onSubmit={handleLookupSubmit} className="space-y-4">
            {lookupError && (
              <div className="bg-red-950/60 text-red-300 p-4 rounded-2xl flex items-center gap-3 border border-red-500/30 text-xs font-mono">
                <span className="material-symbols-outlined text-red-400 pointer-events-none">error</span>
                <p>{lookupError}</p>
              </div>
            )}
            <div>
              <label htmlFor="lookupEmail" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
              <input 
                type="email" 
                id="lookupEmail" 
                ref={lookupEmailRef}
                defaultValue=""
                required
                onChange={() => setLookupError('')}
                className="block w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono transition-colors duration-75" 
                placeholder="juan@example.com" 
              />
            </div>

            <div className="pt-6 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => goToStep(1)} 
                disabled={isStepPending}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-white/10 transition-colors duration-75 flex items-center gap-1.5 text-xs font-mono touch-manipulation select-none disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base pointer-events-none">arrow_back</span> Back
              </button>
              <LookupSubmitButton 
                isLookingUp={isLookingUp} 
                disabled={isStepPending} 
              />
            </div>
          </form>
        </section>
      </div>

      {/* Fullscreen QR Code Modal Overlay */}
      {showFullscreenQr && qrCodeDataUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setShowFullscreenQr(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 flex flex-col items-center text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowFullscreenQr(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              aria-label="Close full screen view"
            >
              <span className="material-symbols-outlined text-xl pointer-events-none">close</span>
            </button>

            <div className="w-10 h-10 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center mb-3 text-amber-600 shadow-sm">
              <span className="material-symbols-outlined text-xl pointer-events-none">qr_code_2</span>
            </div>

            {eventTitle && (
              <div className="mb-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-mono font-bold uppercase tracking-wider truncate max-w-full">
                {eventTitle}
              </div>
            )}

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              Official Event Pass
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              Present this QR code to the scanner for rapid entry
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
              <Image 
                src={qrCodeDataUrl} 
                alt="Full Screen Ticket QR Code" 
                width={320} 
                height={320} 
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain" 
                unoptimized 
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFullscreenQr(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 active-scale"
            >
              <span className="material-symbols-outlined text-lg pointer-events-none">close</span> Close Fullscreen
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

