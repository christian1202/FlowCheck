import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const start = Date.now();
    const { data, error } = await getSupabaseAdmin().from('events').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ success: true, data, time: Date.now() - start });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
