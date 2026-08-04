'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { deleteEventAction } from '@/actions/events';
import { X, Trash2 } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const mounted = useIsMounted();

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteEventAction(eventId);
      if (result.success) {
        router.push('/events/all');
      } else {
        alert(result.error);
        setIsDeleting(false);
        setShowConfirm(false);
      }
    } catch {
      alert('An unexpected error occurred.');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <div 
        className="fixed inset-0 bg-slate-950/95 md:bg-slate-950/90 md:backdrop-blur-xl transition-opacity transform-gpu"
        onClick={() => !isDeleting && setShowConfirm(false)}
      />
      <div className="relative w-full max-w-sm bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col my-auto z-10 text-slate-100 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Delete Event</h2>
          </div>
          <button 
            onClick={() => !isDeleting && setShowConfirm(false)}
            disabled={isDeleting}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-center">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Are you sure you want to delete this event? All attendee registrations and scan telemetry will be permanently removed.
          </p>
        </div>
        <div className="px-5 py-3.5 border-t border-white/10 flex justify-between items-center bg-slate-950/90 shrink-0">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
            className="px-4 min-h-11 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors active-scale disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors active-scale shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
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
        disabled={isDeleting}
        className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-5 text-xs font-bold rounded-xl text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 hover:border-red-500/50 transition-colors transition-transform transform-gpu active-scale disabled:opacity-50 gap-2"
      >
        <span className="material-symbols-outlined text-base">delete</span>
        <span>Delete Event</span>
      </button>

      {showConfirm && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
