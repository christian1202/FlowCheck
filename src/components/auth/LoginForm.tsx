'use client';

import { createClient } from '@/lib/auth/client';
import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter your email and password.' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setIsLoading(false);
      } else {
        router.push('/events');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Check your email to confirm your account! You can sign in once confirmed.' });
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex bg-surface-container-highest rounded-lg p-1 shadow-inner">
        <button
          type="button"
          onClick={() => { setIsLogin(true); setMessage(null); }}
          className={`flex-1 py-2 text-sm font-label-sm rounded-md transition-all ${
            isLogin ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsLogin(false); setMessage(null); }}
          className={`flex-1 py-2 text-sm font-label-sm rounded-md transition-all ${
            !isLogin ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Register
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md text-sm font-body-sm ${message.type === 'success' ? 'bg-[#e7f5e8] text-[#1e4620] border border-[#a3d9a5]' : 'bg-error-container text-on-error-container border border-[#ffb4ab]'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-label-sm text-on-surface font-semibold">
            Email address
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-outline-variant bg-surface py-2.5 px-3 text-on-surface shadow-sm focus:border-primary focus:ring-1 focus:ring-primary font-body-md placeholder:text-on-surface-variant"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-label-sm text-on-surface font-semibold">
            Password
          </label>
          <div className="mt-2">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md border border-outline-variant bg-surface py-2.5 px-3 text-on-surface shadow-sm focus:border-primary focus:ring-1 focus:ring-primary font-body-md placeholder:text-on-surface-variant"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex w-full justify-center items-center rounded-md bg-primary px-3 py-3 text-sm font-label-sm text-on-primary shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-opacity"
        >
          {isLoading ? (
            isLogin ? 'Signing in...' : 'Registering...'
          ) : (
            <>
              {isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
