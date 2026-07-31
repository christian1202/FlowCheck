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

  // 1. Atomic UPDATE on events table using sql operator
  // Only increments currentAttendees if event exists, is open, registration is not closed, and below max capacity
  const [updatedEvent] = await db
    .update(events)
    .set({
      currentAttendees: sql`${events.currentAttendees} + 1`,
    })
    .where(
      and(
        eq(events.id, eventId),
        eq(events.status, 'open'),
        sql`(${events.closesAt} IS NULL OR ${events.closesAt} > NOW())`,
        sql`(${events.maxAttendees} IS NULL OR ${events.currentAttendees} < ${events.maxAttendees})`
      )
    )
    .returning({ id: events.id });

  if (!updatedEvent) {
    return { success: false, error: 'Event is full, closed, or does not exist.' };
  }

  // 2. Insert Attendee into attendees table
  try {
    const [newAttendee] = await db
      .insert(attendees)
      .values({
        eventId,
        name: data.name,
        email: data.email,
        local: data.local,
        district: data.district,
        zone: data.zone,
        duty: data.duty,
        status: 'registered',
      })
      .returning();

    // 3. Enqueue Google Sheets sync
    await enqueueSheetSync(eventId);

    return { success: true, scanToken: newAttendee.scanToken };
  } catch (err: any) {
    // If insert fails due to PostgreSQL unique constraint violation ('23505')
    if (err.code === '23505' || err?.cause?.code === '23505' || err?.constraint === 'unq_event_email') {
      // Compensating transaction: decrement currentAttendees counter by 1
      await db
        .update(events)
        .set({
          currentAttendees: sql`${events.currentAttendees} - 1`,
        })
        .where(eq(events.id, eventId));

      return { success: false, error: 'Already registered with this email' };
    }

    // Rollback currentAttendees counter on any other unexpected error
    await db
      .update(events)
      .set({
        currentAttendees: sql`${events.currentAttendees} - 1`,
      })
      .where(eq(events.id, eventId));

    return { success: false, error: err.message || 'Registration failed' };
  }
}

export async function lookupAttendee(eventId: string, email: string) {
  const db = getDb();
  const [attendee] = await db.select({ scanToken: attendees.scanToken })
    .from(attendees)
    .where(and(eq(attendees.eventId, eventId), eq(attendees.email, email)))
    .limit(1);
    
  return attendee || null;
}
