'use client';

import { useState } from 'react';
import { createClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';

export default function LogoutButton({ className, iconOnly }: { className?: string, iconOnly?: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        className={className || "w-full flex items-center gap-3 px-4 py-2 rounded-md text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-all duration-200"}
      >
        <span className="material-symbols-outlined">logout</span>
        {!iconOnly && <span>Logout</span>}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in-stagger">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest border border-outline-variant/50 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-error" />
                </div>
                <h2 className="text-xl font-display-md font-bold text-error tracking-tight">Sign Out</h2>
              </div>
              <button 
                onClick={() => !isLoggingOut && setShowConfirm(false)}
                disabled={isLoggingOut}
                className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-on-surface text-body-md text-center">
                Are you sure you want to sign out of FlowCheck?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-highest/50">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-full font-label-sm font-bold text-on-surface-variant hover:bg-surface-variant transition-colors active-scale disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-full font-label-sm font-bold text-white bg-error hover:bg-error/90 transition-colors active-scale shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
              >
                {isLoggingOut ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Signing out...
                  </>
                ) : (
                  'Sign Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
