import LoginForm from '@/components/auth/LoginForm';
import { getAdminSessionId } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const adminId = await getAdminSessionId();
  if (adminId) {
    redirect('/events');
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-background text-on-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-10 font-display-lg text-display-lg text-primary tracking-tight">
          FlowCheck Admin
        </h2>
        <p className="mt-2 text-sm font-body-sm text-on-surface-variant">
          Sign in to manage your events and scanners
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px]">
        <div className="bg-surface-container-lowest px-6 py-10 shadow-lg sm:rounded-2xl sm:px-12 border border-outline-variant relative overflow-hidden">
          {/* Subtle gradient accent for premium feel without being overly dark */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-surface-variant via-primary to-surface-variant opacity-50"></div>

          
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
