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
    <div className="space-y-10">
      {/* Profile Section */}
      <section>
        <h2 className="text-xl font-headline-md font-bold text-primary mb-4">Profile Information</h2>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-sm">
          <form onSubmit={handleSaveName} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full sm:max-w-md px-3 py-2 bg-surface-container-highest border border-outline-variant rounded-md text-on-surface-variant cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-on-surface-variant">Your email address cannot be changed.</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full sm:max-w-md px-3 py-2 bg-surface border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-on-surface shadow-sm"
              />
            </div>

            {nameMessage && (
              <div className={`p-3 rounded-md text-sm sm:max-w-md ${nameMessage.type === 'success' ? 'bg-[#e7f5e8] text-[#1e4620]' : 'bg-error-container text-on-error-container'}`}>
                {nameMessage.text}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSavingName}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-tertiary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {isSavingName ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Security Section */}
      <section>
        <h2 className="text-xl font-headline-md font-bold text-primary mb-4">Security</h2>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-sm">
          <form onSubmit={handleSavePassword} className="space-y-4">
            
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-on-surface mb-1">New Password</label>
              <div className="relative w-full sm:max-w-md">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full px-3 py-2 pl-3 pr-10 bg-surface border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-on-surface shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1 sm:max-w-md">
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

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-on-surface mb-1">Confirm New Password</label>
              <div className="relative w-full sm:max-w-md">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full px-3 py-2 pl-3 pr-10 bg-surface border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-on-surface shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-md text-sm sm:max-w-md ${passwordMessage.type === 'success' ? 'bg-[#e7f5e8] text-[#1e4620]' : 'bg-error-container text-on-error-container'}`}>
                {passwordMessage.text}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSavingPassword || !password || !confirmPassword || passwordStrength < 4}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-tertiary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {isSavingPassword ? 'Updating...' : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Update Password
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
