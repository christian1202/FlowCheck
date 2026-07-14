import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDb();
  try {
    const start = Date.now();
    const data = await db.select({ id: events.id }).from(events).limit(1);
    return NextResponse.json({ success: true, data, time: Date.now() - start });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({ success: false, error: message, stack }, { status: 500 });
  }
}
