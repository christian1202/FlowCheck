'use client';

import { useState, useMemo } from 'react';
import { updateProfileName, updatePassword } from '@/actions/settings';
import { Save, KeyRound, Eye, EyeOff } from 'lucide-react';

interface SettingsFormProps {
  initialName: string;
  email: string;
}

export default function SettingsForm({ initialName, email }: SettingsFormProps) {
  const [name, setName] = useState(initialName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingName(true);
    setNameMessage(null);

    const result = await updateProfileName(name);
    if (result.error) {
      setNameMessage({ type: 'error', text: result.error });
    } else {
      setNameMessage({ type: 'success', text: 'Profile updated successfully.' });
    }
    setIsSavingName(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    
    if (passwordStrength < 4) {
      setPasswordMessage({ type: 'error', text: 'Password is too weak. It must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.' });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMessage(null);

    const result = await updatePassword(password);
    if (result.error) {
      setPasswordMessage({ type: 'error', text: result.error });
    } else {
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setPassword('');
      setConfirmPassword('');
    }
    setIsSavingPassword(false);
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Profile Section */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3 tracking-tight">Profile Information</h2>
        <div className="claude-card p-6 rounded-3xl border border-white/10 shadow-lg">
          <form onSubmit={handleSaveName} className="space-y-4">
            
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full sm:max-w-md px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-400 font-mono cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] font-mono text-slate-500">Your account email address is read-only.</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full sm:max-w-md px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all font-sans"
              />
            </div>

            {nameMessage && (
              <div className={`p-3.5 rounded-2xl text-xs font-mono sm:max-w-md border ${nameMessage.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-red-950/60 text-red-300 border-red-500/30'}`}>
                {nameMessage.text}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSavingName}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 active-scale disabled:opacity-50"
              >
                {isSavingName ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Security Section */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3 tracking-tight">Security & Credentials</h2>
        <div className="claude-card p-6 rounded-3xl border border-white/10 shadow-lg">
          <form onSubmit={handleSavePassword} className="space-y-4">
            
            <div>
              <label htmlFor="new-password" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">New Password</label>
              <div className="relative w-full sm:max-w-md">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full px-3.5 py-2.5 pr-10 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5 sm:max-w-md">
                  <div className="flex h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
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

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Confirm New Password</label>
              <div className="relative w-full sm:max-w-md">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full px-3.5 py-2.5 pr-10 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {passwordMessage && (
              <div className={`p-3.5 rounded-2xl text-xs font-mono sm:max-w-md border ${passwordMessage.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-red-950/60 text-red-300 border-red-500/30'}`}>
                {passwordMessage.text}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSavingPassword || !password || !confirmPassword || passwordStrength < 4}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 active-scale disabled:opacity-50"
              >
                {isSavingPassword ? 'Updating...' : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
