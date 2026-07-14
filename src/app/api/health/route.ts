import { NextResponse } from 'next/server';

interface HealthResult {
  timestamp: string;
  env: Record<string, string>;
  db: { status: string; rowCount?: number; error?: string };
  auth: { status: string; rowCount?: number; error?: string };
}

export async function GET() {
  const results: HealthResult = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
      databaseUrl: process.env.DATABASE_URL ? 'set (masked)' : 'MISSING',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set (masked)' : 'MISSING',
      cronSecret: process.env.CRON_SECRET ? 'set (masked)' : 'MISSING',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'MISSING',
    },
    db: { status: 'untested' },
    auth: { status: 'untested' },
  };

  // Test database connectivity
  try {
    const { db } = await import('@/lib/db');
    const { events } = await import('@/lib/db/schema');
    const data = await db.select({ id: events.id }).from(events).limit(1);
    results.db = { status: 'ok', rowCount: data.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.db = { status: 'error', error: message };
  }

  // Test Supabase auth connectivity
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase/admin');
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('admins').select('id').limit(1);
    if (error) throw new Error(error.message);
    results.auth = { status: 'ok', rowCount: data.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.auth = { status: 'error', error: message };
  }

  const allOk = results.db.status === 'ok' && results.auth.status === 'ok';
  return NextResponse.json(results, { status: allOk ? 200 : 500 });
}