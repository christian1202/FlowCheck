import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-4 py-12 lg:px-8 bg-background relative overflow-hidden">
      {/* Premium background blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 fade-in-stagger">
        <div className="mx-auto w-20 h-20 bg-surface-container-high rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-primary">event_available</span>
        </div>
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
