'use client';

import { useState, useRef } from 'react';
import { submitRegistrationAction, lookupAttendeeAction } from '@/actions/registration';
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
  
  const lookupCache = useRef<Record<string, any>>({});

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
          color: { dark: '#0b0c10', light: '#ffffff' }
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
      setStep(3);
    } else if (result?.error) {
      setErrors(result.error);
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
    <main className="w-full claude-card rounded-3xl shadow-2xl p-6 md:p-10 relative border border-white/10 text-slate-100">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <SystemInfoModal 
          iconOnly 
          className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors active-scale flex items-center justify-center border border-white/10 bg-slate-950/60" 
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
            <button type="button" onClick={() => step < 3 && goToStep(1)} disabled={step >= 3} className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${step >= 1 ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-900 text-slate-400 border border-white/10'} ${step < 3 && 'hover:scale-110'}`}>
              <span className="text-xs font-mono">1</span>
            </button>
            <span className={`mt-2.5 text-[11px] font-mono text-center uppercase tracking-wider ${step >= 1 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>Basic Info</span>
          </li>
          
          {/* Step 2 */}
          <li className="relative flex-1 flex flex-col items-center group">
            <div className="absolute top-4 left-1/2 w-full h-[2px] z-0" aria-hidden="true">
              <div className={`h-full w-full transition-colors duration-300 ${step >= 3 ? 'bg-amber-500' : 'bg-white/10'}`} />
            </div>
            <button type="button" onClick={() => step < 3 && goToStep(2)} disabled={step >= 3} className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${step >= 2 ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-900 text-slate-400 border border-white/10'} ${step < 3 && 'hover:scale-110'}`}>
              <span className="text-xs font-mono">2</span>
            </button>
            <span className={`mt-2.5 text-[11px] font-mono text-center uppercase tracking-wider ${step >= 2 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>Group Info</span>
          </li>

          {/* Step 3 */}
          <li className="relative flex-1 flex flex-col items-center group">
            <button type="button" disabled className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${step >= 3 ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-900 text-slate-400 border border-white/10'}`}>
              <span className="text-xs font-mono">3</span>
            </button>
            <span className={`mt-2.5 text-[11px] font-mono text-center uppercase tracking-wider ${step >= 3 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>Confirm</span>
          </li>
        </ol>
      </nav>

      {/* Form Container */}
      <div className="relative min-h-[320px]">
        {errors.form && (
           <div className="mb-6 bg-red-950/60 text-red-300 p-4 rounded-2xl flex items-center gap-3 border border-red-500/30 text-xs font-mono">
             <span className="material-symbols-outlined text-red-400">error</span>
             <p>{errors.form[0]}</p>
           </div>
        )}

        <form action={handleSubmit} className="w-full">
          {/* STEP 1 */}
          <section className={`w-full transition-all duration-400 ease-out ${step === 1 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-4 invisible absolute'}`}>
            <h2 className="text-lg font-bold text-white mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                <input type="text" id="name" name="name" required className={`block w-full rounded-xl border ${errors.name ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all font-sans`} placeholder="Juan dela Cruz" />
                {errors.name && <p className="mt-1 text-[11px] font-mono text-red-400 flex items-center gap-1">{errors.name[0]}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
                <input type="email" id="email" name="email" required className={`block w-full rounded-xl border ${errors.email ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all font-mono`} placeholder="juan@example.com" />
                {errors.email && <p className="mt-1 text-[11px] font-mono text-red-400 flex items-center gap-1">{errors.email[0]}</p>}
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button type="button" onClick={() => goToStep(4)} className="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors">
                  Forgot QR ticket code?
                </button>
                <button type="button" onClick={() => goToStep(2)} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 active-scale">
                  <span>Continue</span> <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>

          {/* STEP 2 */}
          <section className={`w-full transition-all duration-400 ease-out ${step === 2 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-4 invisible absolute'}`}>
            <h2 className="text-lg font-bold text-white mb-1">Group Information</h2>
            <p className="text-xs text-slate-400 mb-4">Provide details regarding your assigned local and duty unit.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="local" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Local</label>
                  <input type="text" id="local" name="local" required className={`block w-full rounded-xl border ${errors.local ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-all font-sans`} placeholder="e.g. Mabolo" />
                </div>
                
                <div>
                  <label htmlFor="district" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">District</label>
                  <input type="text" id="district" name="district" required className={`block w-full rounded-xl border ${errors.district ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-all font-sans`} placeholder="e.g. North" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="zone" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Zone</label>
                  <input type="text" id="zone" name="zone" required className={`block w-full rounded-xl border ${errors.zone ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono`} placeholder="e.g. 1" />
                </div>
                
                <div>
                  <label htmlFor="duty" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Duty (Tungkulin)</label>
                  <input type="text" id="duty" name="duty" required className={`block w-full rounded-xl border ${errors.duty ? 'border-red-400' : 'border-white/10'} bg-slate-950/60 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-all font-sans`} placeholder="e.g. Choir" />
                </div>
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button type="button" onClick={() => goToStep(1)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-mono">
                  <span className="material-symbols-outlined text-base">arrow_back</span> Back
                </button>
                <button type="submit" disabled={isPending} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 disabled:opacity-50 active-scale">
                  {isPending ? 'Submitting...' : 'Complete Registration'} <span className="material-symbols-outlined text-base">check_circle</span>
                </button>
              </div>
            </div>
          </section>
        </form>

        {/* STEP 3 */}
        <section className={`w-full text-center transition-all duration-400 ease-out ${step === 3 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-4 invisible absolute'}`}>
          <div className="claude-card border border-emerald-500/30 rounded-3xl p-8 max-w-sm mx-auto shadow-2xl mb-6 relative overflow-hidden bg-emerald-950/20">
            <div className="mx-auto w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-3 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Registration Complete
            </h2>
            <p className="text-xs text-slate-300 mb-6 font-mono">
              Save your high-res QR ticket. Present this code at entry scanners.
            </p>
            {qrCodeDataUrl ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-lg border border-white/20">
                  <img src={qrCodeDataUrl} alt="Your Ticket QR Code" className="w-44 h-44" />
                </div>
                <a 
                  href={qrCodeDataUrl} 
                  download="flowcheck-ticket.png" 
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5 active-scale"
                >
                  <span className="material-symbols-outlined text-base">download</span> Download Ticket Image
                </a>
              </div>
            ) : (
              <div className="animate-pulse w-44 h-44 bg-slate-900 rounded-2xl mx-auto mb-4 border border-white/10"></div>
            )}
          </div>
          
          <div className="flex justify-center">
             <button type="button" onClick={() => window.location.reload()} className="px-5 py-2.5 bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-mono rounded-xl transition-all active-scale">
                 Register Another Ticket
             </button>
          </div>
        </section>

        {/* STEP 4 */}
        <section className={`w-full transition-all duration-400 ease-out ${step === 4 ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-4 invisible absolute'}`}>
          <h2 className="text-lg font-bold text-white mb-1">Lookup Ticket</h2>
          <p className="text-xs text-slate-400 mb-4">Enter your registered email address to retrieve your QR entry ticket.</p>
          
          <div className="space-y-4">
            {lookupError && (
              <div className="bg-red-950/60 text-red-300 p-4 rounded-2xl flex items-center gap-3 border border-red-500/30 text-xs font-mono">
                <span className="material-symbols-outlined text-red-400">error</span>
                <p>{lookupError}</p>
              </div>
            )}
            <div>
              <label htmlFor="lookupEmail" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
              <input 
                type="email" 
                id="lookupEmail" 
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all font-mono" 
                placeholder="juan@example.com" 
              />
            </div>

            <div className="pt-6 flex justify-between items-center">
              <button type="button" onClick={() => goToStep(1)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-mono">
                <span className="material-symbols-outlined text-base">arrow_back</span> Back
              </button>
              <button 
                type="button" 
                onClick={async () => {
                  if (!lookupEmail) return setLookupError('Please enter an email address');
                  
                  const emailKey = lookupEmail.toLowerCase().trim();
                  if (lookupCache.current[emailKey]) {
                    setScanToken(lookupCache.current[emailKey]);
                    try {
                      const url = await QRCode.toDataURL(lookupCache.current[emailKey], {
                        errorCorrectionLevel: 'H', margin: 2, width: 300, color: { dark: '#0b0c10', light: '#ffffff' }
                      });
                      setQrCodeDataUrl(url);
                    } catch (err) {}
                    setStep(3);
                    return;
                  }

                  setIsLookingUp(true);
                  setLookupError('');
                  
                  const result = await lookupAttendeeAction(eventId, lookupEmail);
                  setIsLookingUp(false);
                  
                  if (result.success && result.scanToken) {
                    lookupCache.current[emailKey] = result.scanToken;
                    setScanToken(result.scanToken);
                    try {
                      const url = await QRCode.toDataURL(result.scanToken, {
                        errorCorrectionLevel: 'H',
                        margin: 2,
                        width: 300,
                        color: { dark: '#0b0c10', light: '#ffffff' }
                      });
                      setQrCodeDataUrl(url);
                    } catch (err) {
                      console.error('Failed to generate QR code', err);
                    }
                    setStep(3);
                  } else {
                    setLookupError(result.error || 'Registration not found');
                  }
                }} 
                disabled={isLookingUp} 
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 disabled:opacity-50 active-scale"
              >
                {isLookingUp ? 'Searching...' : 'Lookup Ticket'} <span className="material-symbols-outlined text-base">search</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
