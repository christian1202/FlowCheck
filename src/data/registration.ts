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

  // 1. Fetch event status and capacity details
  const [event] = await db
    .select({
      id: events.id,
      status: events.status,
      maxAttendees: events.maxAttendees,
      currentAttendees: events.currentAttendees,
      closesAt: events.closesAt,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return { success: false, error: 'Event does not exist.' };
  }

  if (event.status !== 'open') {
    return { success: false, error: `Registration is currently ${event.status}.` };
  }

  if (event.closesAt && new Date() > new Date(event.closesAt)) {
    return { success: false, error: 'Event registration auto-close deadline has passed.' };
  }

  const currentCount = event.currentAttendees ?? 0;
  if (event.maxAttendees !== null && event.maxAttendees !== undefined && currentCount >= event.maxAttendees) {
    return { success: false, error: `Event has reached maximum capacity (${event.maxAttendees} attendees).` };
  }

  // 2. Increment currentAttendees counter safely using COALESCE
  await db
    .update(events)
    .set({
      currentAttendees: sql`COALESCE(${events.currentAttendees}, 0) + 1`,
    })
    .where(eq(events.id, eventId));

  // 3. Generate clean UUID scan token for fast, high-contrast QR code scanning
  const scanToken = crypto.randomUUID();

  // 4. Insert Attendee into attendees table
  try {
    const [newAttendee] = await db
      .insert(attendees)
      .values({
        eventId,
        scanToken,
        name: data.name,
        email: data.email,
        local: data.local,
        district: data.district,
        zone: data.zone,
        duty: data.duty,
        status: 'registered',
      })
      .returning();

    // 5. Enqueue Google Sheets sync
    await enqueueSheetSync(eventId);

    return { success: true, scanToken: newAttendee.scanToken };
  } catch (err: any) {
    // Rollback currentAttendees counter on error
    await db
      .update(events)
      .set({
        currentAttendees: sql`GREATEST(0, COALESCE(${events.currentAttendees}, 1) - 1)`,
      })
      .where(eq(events.id, eventId));

    if (err.code === '23505' || err?.cause?.code === '23505' || err?.constraint === 'unq_event_email') {
      return { success: false, error: 'Already registered with this email' };
    }

    return { success: false, error: err.message || 'Registration failed' };
  }
}

export async function lookupAttendee(eventId: string, email: string) {
  const db = getDb();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  const [attendee] = await db.select({ scanToken: attendees.scanToken })
    .from(attendees)
    .where(and(eq(attendees.eventId, eventId), eq(sql`LOWER(${attendees.email})`, cleanEmail)))
    .limit(1);
    
  return attendee || null;
}
