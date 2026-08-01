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

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-slate-800';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-amber-500';
    if (passwordStrength === 4) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

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
    <div className="flex flex-col space-y-6 text-slate-100">
      {/* Tab Switcher */}
      <div className="flex bg-slate-950/95 md:bg-slate-950/80 p-1 rounded-xl border border-white/10 relative z-10 md:backdrop-blur-md">
        <button
          type="button"
          onClick={() => resetState(true)}
          className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all active-scale ${
            isLogin && !isForgotPassword 
              ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
              : 'text-slate-400 md:hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => resetState(false)}
          className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all active-scale ${
            !isLogin && !isForgotPassword 
              ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
              : 'text-slate-400 md:hover:text-white'
          }`}
        >
          Register
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-mono border md:backdrop-blur-md ${
          message.type === 'success' ? 'bg-emerald-950/90 md:bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-red-950/90 md:bg-red-950/60 text-red-300 border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
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
            className="block w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
            placeholder="admin@example.com"
          />
        </div>

        {!isForgotPassword && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-mono uppercase tracking-widest text-slate-400">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setMessage(null); }}
                    className="text-[11px] font-mono text-amber-400 hover:text-amber-300 transition-colors"
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
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-4 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {!isLogin && password.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className={`font-bold uppercase tracking-wider ${passwordStrength < 4 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {getStrengthText()}
                    </span>
                    {passwordStrength < 4 && (
                      <span className="text-slate-500">
                        Include uppercase, lowercase, numbers & special symbols.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
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
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-4 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
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
          className="mt-6 flex w-full justify-center items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.25)] active-scale disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            isForgotPassword ? 'Sending link...' : (isLogin ? 'Signing in...' : 'Registering...')
          ) : (
            <>
              {isForgotPassword ? <KeyRound className="w-4 h-4 mr-2" /> : (isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />)}
              <span>{isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}</span>
            </>
          )}
        </button>
        
        {isForgotPassword && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              Back to sign in
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
