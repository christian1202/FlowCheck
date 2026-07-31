'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteEventAction } from '@/actions/events';
import { X, Trash2 } from 'lucide-react';

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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
    } catch (err) {
      alert('An unexpected error occurred.');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-5 text-xs font-bold rounded-xl text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 hover:border-red-500/50 transition-all active-scale disabled:opacity-50 gap-2"
      >
        <span className="material-symbols-outlined text-base">delete</span>
        <span>Delete Event</span>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in-stagger">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => !isDeleting && setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Delete Event</h2>
              </div>
              <button 
                onClick={() => !isDeleting && setShowConfirm(false)}
                disabled={isDeleting}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-300 leading-relaxed text-center font-sans">
                Are you sure you want to delete this event? All attendee registrations and scan telemetry will be permanently removed.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center bg-slate-950/50">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors active-scale disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors active-scale shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
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
      )}
    </>
  );
}
