'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function LogoutButton({ className, iconOnly }: { className?: string, iconOnly?: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mounted = useIsMounted();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const defaultClassName = "w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors transition-transform transform-gpu active-scale";
  const buttonClass = className || defaultClassName;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/95 md:bg-slate-950/90 md:backdrop-blur-xl transition-opacity transform-gpu"
        onClick={() => !isLoggingOut && setShowConfirm(false)}
      />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-sm bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col my-auto z-10 text-slate-100 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Sign Out</h2>
          </div>
          <button 
            onClick={() => !isLoggingOut && setShowConfirm(false)}
            disabled={isLoggingOut}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Are you sure you want to sign out of FlowCheck? Your active session will be closed.
          </p>
        </div>
        
        <div className="px-5 py-3.5 border-t border-white/10 flex justify-between items-center bg-slate-950/90 shrink-0">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isLoggingOut}
            className="px-4 min-h-11 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors active-scale disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors active-scale shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            {isLoggingOut ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                <span>Signing out...</span>
              </>
            ) : (
              <span>Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button 
        type="button"
        onClick={() => setShowConfirm(true)}
        className={buttonClass}
        title={iconOnly ? "Logout" : undefined}
      >
        <span className="material-symbols-outlined text-base">logout</span>
        {!iconOnly && <span>Logout</span>}
      </button>

      {showConfirm && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
