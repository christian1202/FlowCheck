'use client';

import { createClient } from '@/lib/auth/client';
import { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    });
    // We don't set isLoading to false because the page will redirect to Google
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="flex w-full justify-center items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
    >
      {isLoading ? (
        'Redirecting...'
      ) : (
        <>
          <LogIn className="w-4 h-4 mr-2" />
          Sign in with Google
        </>
      )}
    </button>
  );
}
