'use client';

import { createClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className={className || "w-full flex items-center gap-3 px-4 py-2 rounded-md text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-all duration-200"}
    >
      <span className="material-symbols-outlined">logout</span>
      Logout
    </button>
  );
}
