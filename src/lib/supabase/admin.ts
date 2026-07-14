import { createClient } from '@supabase/supabase-js';

/**
 * Creates a server-only Supabase REST client on demand.
 *
 * Do not cache this at module scope: OpenNext supplies process.env inside the
 * active Worker request context. REST is deliberately used here instead of a
 * Postgres TCP client, which is unreliable across Worker isolate lifetimes.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
