'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteEventAction } from '@/actions/events';
import { Loader2 } from 'lucide-react';

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        const result = await deleteEventAction(eventId);
        if (result.success) {
          router.push('/events');
        } else {
          alert(result.error);
          setIsDeleting(false);
        }
      } catch (err) {
        alert('An unexpected error occurred.');
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-error hover:bg-red-700 focus:outline-none transition-colors disabled:opacity-50"
    >
      {isDeleting ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : (
        <span className="material-symbols-outlined mr-2 text-[20px]">delete</span>
      )}
      Delete Event
    </button>
  );
}
