import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

// Diagnostics route. Deliberately returns no error internals — raw DB errors
// can include host/connection details and must never reach clients.
export async function GET() {
  const db = getDb();
  try {
    const start = Date.now();
    const data = await db.select({ id: events.id }).from(events).limit(1);
    return NextResponse.json({ success: true, data, time: Date.now() - start });
  } catch (err) {
    console.error('test-db error:', err);
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
  }
}
