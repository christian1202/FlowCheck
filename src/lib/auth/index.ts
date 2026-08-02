import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

import { cache } from 'react';

/**
 * Convenience function to get the current user's ID in server actions/components.
 * Returns null if not authenticated.
 * It also automatically syncs the user to the public.admins table if they don't exist.
 */
async function syncAdminUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  try {
    if (!user.email) return;
    const admin = getSupabaseAdmin();
    await admin.from('admins').upsert({
      id: user.id,
      email: user.email,
      full_name: (user.user_metadata?.full_name as string) || null,
    }, { onConflict: 'id' });
  } catch (err) {
    console.error("Failed to sync admin user to public schema:", err);
  }
}

export const getAdminSessionId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  // Asynchronous non-blocking sync so DB calls are not delayed by Supabase REST roundtrips
  syncAdminUser(user).catch(() => {});
  
  return user.id;
});
