import { getDb } from '@/lib/db';
import { attendees, events } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { RegistrationInput } from '@/lib/validators/registration';
import { enqueueSheetSync } from '@/lib/queue/producer';

export type RegistrationResult = 
  | { success: true; scanToken: string }
  | { success: false; error: string };

export async function registerAttendee(
  data: RegistrationInput, 
  eventId: string
): Promise<RegistrationResult> {
  const db = getDb();
  // Use transaction to ensure consistency
  return await db.transaction(async (tx) => {
    // 1. Check if event is open
    const [event] = await tx.select({ 
      title: events.title,
      status: events.status, 
      maxAttendees: events.maxAttendees 
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    if (event.status !== 'open') {
      return { success: false, error: 'Event is not accepting registrations' };
    }

    // 2. Check for duplicate registration (same email + eventId)
    const existing = await tx.select({ id: attendees.id })
      .from(attendees)
      .where(and(eq(attendees.eventId, eventId), eq(attendees.email, data.email)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: 'Already registered with this email' };
    }

    // 3. Check capacity if maxAttendees is set
    if (event.maxAttendees !== null) {
      const [{ count }] = await tx.select({ count: sql<number>`count(*)` })
        .from(attendees)
        .where(eq(attendees.eventId, eventId));
        
      if (Number(count) >= event.maxAttendees) {
        return { success: false, error: 'Event is at full capacity' };
      }
    }

    // 4. Insert Attendee
    // Drizzle defaults `scanToken` to `gen_random_uuid()`
    const [newAttendee] = await tx.insert(attendees).values({
      eventId,
      name: data.name,
      email: data.email,
      local: data.local,
      district: data.district,
      zone: data.zone,
      duty: data.duty,
      status: 'registered',
    }).returning();

    // 5. Enqueue the Google Sheets sync
    await enqueueSheetSync(eventId);

    return { success: true, scanToken: newAttendee.scanToken };
  });
}

export async function lookupAttendee(eventId: string, email: string) {
  const db = getDb();
  const [attendee] = await db.select({ scanToken: attendees.scanToken })
    .from(attendees)
    .where(and(eq(attendees.eventId, eventId), eq(attendees.email, email)))
    .limit(1);
    
  return attendee || null;
}
