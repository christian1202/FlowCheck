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
        className="w-full sm:w-[160px] inline-flex justify-center items-center py-2.5 px-5 shadow-sm text-sm font-label-sm font-bold rounded-xl text-error bg-error/10 hover:bg-error/20 border border-error/20 focus:outline-none transition-all active-scale disabled:opacity-50"
      >
        <span className="material-symbols-outlined mr-2 text-[20px]">delete</span>
        Delete Event
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in-stagger">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest border border-outline-variant/50 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-error" />
                </div>
                <h2 className="text-xl font-display-md font-bold text-error tracking-tight">Delete Event</h2>
              </div>
              <button 
                onClick={() => !isDeleting && setShowConfirm(false)}
                disabled={isDeleting}
                className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-on-surface text-body-md text-center">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-highest/50">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full font-label-sm font-bold text-on-surface-variant hover:bg-surface-variant transition-colors active-scale disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full font-label-sm font-bold text-white bg-error hover:bg-error/90 transition-colors active-scale shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  'Delete Event'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
