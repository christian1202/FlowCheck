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
export const getAdminSessionId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  // Auto-sync user to public.admins table
  try {
    if (user.email) {
      const admin = getSupabaseAdmin();
      const { error } = await admin.from('admins').upsert({
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || null,
      }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
    }
  } catch (err) {
    console.error("Failed to sync admin user to public schema:", err);
  }
  
  return user.id;
});
