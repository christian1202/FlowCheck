import LoginForm from '@/components/auth/LoginForm';
import Image from 'next/image';

export default function LoginPage() {

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-4 py-12 lg:px-8 bg-background relative overflow-hidden">
      {/* Premium background blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 fade-in-stagger">
        <Image src="/images/flowcheck_logo_v2.png" alt="FlowCheck" width={64} height={64} className="mx-auto h-16 w-16 mb-6" priority />
        <h2 className="font-display-lg-mobile md:font-display-lg text-primary tracking-tight">
          FlowCheck
        </h2>
        <p className="mt-3 font-body-lg text-on-surface-variant max-w-sm mx-auto">
          Welcome back. Sign in to manage your events and scanners.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10 fade-in-stagger">
        <div className="glass-panel px-6 py-10 sm:rounded-3xl sm:px-12 relative overflow-hidden shadow-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
