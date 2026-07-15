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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (passwordStrength <= 2) return 'bg-red-500';
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
    if (!isLogin) {
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match.' });
        setIsLoading(false);
        return;
      }
      
      if (passwordStrength < 4) {
        setMessage({ type: 'error', text: 'Password is too weak. It must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.' });
        setIsLoading(false);
        return;
      }
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
    <div className="flex flex-col space-y-8">
      {/* Tab Switcher */}
      <div className="flex bg-surface-container-high/50 p-1 rounded-xl shadow-inner relative z-10 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => resetState(true)}
          className={`flex-1 py-2.5 text-sm font-label-sm rounded-lg transition-all active-scale duration-300 ${
            isLogin && !isForgotPassword ? 'bg-surface text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => resetState(false)}
          className={`flex-1 py-2.5 text-sm font-label-sm rounded-lg transition-all active-scale duration-300 ${
            !isLogin && !isForgotPassword ? 'bg-surface text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Register
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-body-sm shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-label-sm text-on-surface font-semibold mb-2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-xl border border-outline-variant bg-surface/50 py-3 px-4 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md placeholder:text-on-surface-variant/70"
            placeholder="admin@example.com"
          />
        </div>

        {!isForgotPassword && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-label-sm text-on-surface font-semibold">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setMessage(null); }}
                    className="text-xs font-label-xs text-primary hover:text-blue-600 transition-colors focus:outline-none"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required={!isForgotPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-outline-variant bg-surface/50 py-3 pl-4 pr-12 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md placeholder:text-on-surface-variant/70"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {!isLogin && password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-widest ${passwordStrength < 4 ? 'text-red-500' : 'text-green-600'}`}>
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

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-label-sm text-on-surface font-semibold mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required={!isLogin}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-outline-variant bg-surface/50 py-3 pl-4 pr-12 text-on-surface shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all font-body-md placeholder:text-on-surface-variant/70"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-8 flex w-full justify-center items-center rounded-xl bg-primary px-4 py-4 text-base font-label-sm text-on-primary shadow-lg hover-lift active-scale disabled:opacity-50 disabled:hover:transform-none disabled:hover:box-shadow-none transition-all"
        >
          {isLoading ? (
            isForgotPassword ? 'Sending link...' : (isLogin ? 'Signing in...' : 'Registering...')
          ) : (
            <>
              {isForgotPassword ? <KeyRound className="w-5 h-5 mr-2" /> : (isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />)}
              <span className="font-semibold">{isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}</span>
            </>
          )}
        </button>
        
        {isForgotPassword && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="text-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors font-medium"
            >
              Back to sign in
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
