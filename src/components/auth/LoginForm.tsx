'use client';

import { createClient } from '@/lib/auth/client';
import { useState, useMemo } from 'react';
import { LogIn, UserPlus, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const resetState = (login: boolean) => {
    setIsLogin(login);
    setIsForgotPassword(false);
    setMessage(null);
  };

  // Calculate password strength (0 to 5)
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (!password) return score;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 5);
  }, [password]);

  // Map score to color
  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-surface-container-highest';
    if (passwordStrength <= 2) return 'bg-error';
    if (passwordStrength === 3) return 'bg-yellow-500';
    if (passwordStrength === 4) return 'bg-green-400';
    return 'bg-green-600';
  };

  // Map score to text
  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength === 3) return 'Fair';
    if (passwordStrength === 4) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    if (isForgotPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/api/auth/callback?next=/settings`,
      });
      
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Check your email for the password reset link.' });
      }
      setIsLoading(false);
      return;
    }

    if (!password) {
      setMessage({ type: 'error', text: 'Please enter your password.' });
      setIsLoading(false);
      return;
    }

    // Strict validation for registration
    if (!isLogin && passwordStrength < 4) {
      setMessage({ type: 'error', text: 'Password is too weak. It must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.' });
      setIsLoading(false);
      return;
    }
    
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
          onClick={() => resetState(true)}
          className={`flex-1 py-2 text-sm font-label-sm rounded-md transition-all ${
            isLogin && !isForgotPassword ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => resetState(false)}
          className={`flex-1 py-2 text-sm font-label-sm rounded-md transition-all ${
            !isLogin && !isForgotPassword ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
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

        {!isForgotPassword && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-label-sm text-on-surface font-semibold">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setMessage(null); }}
                  className="text-sm font-label-sm text-primary hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="mt-2 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required={!isForgotPassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-outline-variant bg-surface py-2.5 pl-3 pr-10 text-on-surface shadow-sm focus:border-primary focus:ring-1 focus:ring-primary font-body-md placeholder:text-on-surface-variant"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator (only show during registration if they typed something) */}
            {!isLogin && password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold ${passwordStrength < 4 ? 'text-error' : 'text-green-600'}`}>
                    {getStrengthText()}
                  </span>
                  {passwordStrength < 4 && (
                    <span className="text-on-surface-variant text-[10px]">
                      Needs uppercase, lowercase, number, and special char.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex w-full justify-center items-center rounded-md bg-primary px-3 py-3 text-sm font-label-sm text-on-primary shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-opacity"
        >
          {isLoading ? (
            isForgotPassword ? 'Sending link...' : (isLogin ? 'Signing in...' : 'Registering...')
          ) : (
            <>
              {isForgotPassword ? <KeyRound className="w-4 h-4 mr-2" /> : (isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />)}
              {isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}
            </>
          )}
        </button>
        
        {isForgotPassword && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="text-sm font-label-sm text-on-surface-variant hover:text-on-surface"
            >
              Back to sign in
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
