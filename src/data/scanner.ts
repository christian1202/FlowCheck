import { getDb } from '@/lib/db';
import { attendees, events, eventAdmins, scanLogs } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { enqueueSheetSync } from '@/lib/queue/producer';

export type ScanResultResponse = {
  result: 'success' | 'duplicate' | 'invalid_event' | 'event_closed' | 'invalid_ticket' | 'unauthorized';
  attendee?: {
    name: string;
    local: string | null;
    duty: string | null;
    checkedInAt?: Date | null;
  };
};

export async function processScan(
  eventId: string,
  adminId: string,
  scanToken: string
): Promise<ScanResultResponse> {
  const db = getDb();
  // Use transaction to ensure data integrity
  return await db.transaction(async (tx) => {
    // 1. Verify admin has access to this event (as scanner, editor, or owner)
    const adminAccess = await tx.select({ role: eventAdmins.role })
      .from(eventAdmins)
      .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
      .limit(1);

    if (adminAccess.length === 0) {
      return { result: 'unauthorized' };
    }

    // 2. Check if event is open (cannot scan if draft/archived)
    const [event] = await tx.select({ status: events.status, closesAt: events.closesAt })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event || event.status === 'draft' || event.status === 'archived') {
      return { result: 'invalid_event' };
    }

    if (event.closesAt && new Date() > new Date(event.closesAt)) {
      // Event timer has expired
      return { result: 'event_closed' };
    }

    // 3. Find attendee by scanToken
    const [attendee] = await tx.select()
      .from(attendees)
      .where(eq(attendees.scanToken, scanToken))
      .limit(1);

    if (!attendee) {
      // Log invalid scan attempt
      await tx.insert(scanLogs).values({
        eventId,
        scannedBy: adminId,
        result: 'invalid_ticket'
      });
      return { result: 'invalid_ticket' };
    }

    // 4. Ensure attendee belongs to this specific event
    if (attendee.eventId !== eventId) {
      await tx.insert(scanLogs).values({
        eventId,
        attendeeId: attendee.id,
        scannedBy: adminId,
        result: 'invalid_event'
      });
      return { result: 'invalid_event' };
    }

    // 5. Check if already checked in
    if (attendee.status === 'checked_in') {
      await tx.insert(scanLogs).values({
        eventId,
        attendeeId: attendee.id,
        scannedBy: adminId,
        result: 'duplicate'
      });
      return { 
        result: 'duplicate',
        attendee: {
          name: attendee.name,
          local: attendee.local,
          duty: attendee.duty,
          checkedInAt: attendee.checkedInAt
        }
      };
    }

    // 6. Update attendee status to checked_in
    const now = new Date();
    await tx.update(attendees)
      .set({ 
        status: 'checked_in', 
        checkedInAt: now,
        checkedInBy: adminId
      })
      .where(eq(attendees.id, attendee.id));

    // 7. Log success scan
    await tx.insert(scanLogs).values({
      eventId,
      attendeeId: attendee.id,
      scannedBy: adminId,
      result: 'success'
    });

    // Enqueue the Google Sheets sync
    await enqueueSheetSync(eventId);

    return {
      result: 'success',
      attendee: {
        name: attendee.name,
        local: attendee.local,
        duty: attendee.duty,
        checkedInAt: now
      }
    };
  });
}

export async function getTotalScansForAdmin(adminId: string): Promise<number> {
  const db = getDb();
  
  // Find all events this admin manages
  const adminEvents = await db.select({ eventId: eventAdmins.eventId })
    .from(eventAdmins)
    .where(eq(eventAdmins.adminId, adminId));

  if (adminEvents.length === 0) return 0;

  const eventIds = adminEvents.map(e => e.eventId);

  // Count all checked-in attendees for these events
  const rows = await db.select()
    .from(attendees)
    .where(
      and(
        inArray(attendees.eventId, eventIds),
        eq(attendees.status, 'checked_in')
      )
    );

  return rows.length;
}
