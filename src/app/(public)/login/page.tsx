import LoginForm from '@/components/auth/LoginForm';
import Image from 'next/image';

export default function LoginPage() {

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-4 py-12 lg:px-8 bg-ambient-mesh text-slate-100 relative overflow-hidden">
      {/* Background glowing lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 fade-in-stagger">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <Image src="/images/flowchecklogo-final-bg-white-big.png" alt="FlowCheck" width={48} height={48} className="h-10 w-10 object-contain" priority />
        </div>
        <h2 className="font-display-lg-mobile md:font-display-lg text-white font-bold tracking-tight gradient-text">
          FlowCheck
        </h2>
        <p className="mt-2 text-xs md:text-sm text-slate-400 max-w-sm mx-auto font-sans">
          Secure, real-time event portal & QR scanner node system.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10 fade-in-stagger">
        <div className="claude-card px-6 py-8 sm:rounded-3xl sm:px-10 relative overflow-hidden shadow-2xl border border-white/10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
