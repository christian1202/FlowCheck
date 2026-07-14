import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { syncEventToSheet } from '@/lib/google/sheets';

export async function POST(req: NextRequest) {
  const db = getDb();
  // 1. Verify authorization
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    let eventIds: string[] = body.eventIds || [];

    // 2. If eventIds is empty, it's a cron job - we should fetch all 'open' events that have a sheet
    if (eventIds.length === 0) {
      const openEvents = await db.select({ id: events.id })
        .from(events)
        .where(eq(events.status, 'open')); // Only sync open events
        
      eventIds = openEvents.map(e => e.id);
    }

    if (eventIds.length === 0) {
      return NextResponse.json({ message: 'No events to sync' }, { status: 200 });
    }

    // 3. Process all events concurrently to eliminate sequential query waterfalls
    const results = await Promise.all(
      eventIds.map(async (eventId) => {
        // Get the sheet ID for this event
        const [event] = await db.select({ googleSheetId: events.googleSheetId })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (event?.googleSheetId) {
          try {
            const rowsSynced = await syncEventToSheet(eventId, event.googleSheetId);
            return { eventId, status: 'success', rowsSynced };
          } catch (error: any) {
            console.error(`Failed to sync event ${eventId}:`, error);
            return { eventId, status: 'error', error: error.message };
          }
        } else {
          return { eventId, status: 'skipped', reason: 'No sheet provisioned' };
        }
      })
    );

    // 4. Also handle Email Retry Queue here if we implemented it, but right now
    // the Cron handles sheets, and we can add email retries here later.

    return NextResponse.json({ results }, { status: 200 });
  } catch (error: any) {
    console.error('API Error in sync-sheets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
