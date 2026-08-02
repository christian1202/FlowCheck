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
  const cleanEmail = data.email.trim().toLowerCase();

  let scanToken = '';

  try {
    const txResult = await db.transaction(async (tx) => {
      // 1. Row locking for update to prevent concurrent capacity breaches
      const [event] = await tx
        .select({
          id: events.id,
          status: events.status,
          maxAttendees: events.maxAttendees,
          currentAttendees: events.currentAttendees,
          closesAt: events.closesAt,
        })
        .from(events)
        .where(eq(events.id, eventId))
        .for('update');

      if (!event) {
        throw new Error('EVENT_NOT_FOUND');
      }

      if (event.status !== 'open') {
        throw new Error(`REGISTRATION_CLOSED:${event.status}`);
      }

      if (event.closesAt && new Date() > new Date(event.closesAt)) {
        throw new Error('REGISTRATION_DEADLINE_PASSED');
      }

      const currentCount = event.currentAttendees ?? 0;
      if (event.maxAttendees !== null && event.maxAttendees !== undefined && currentCount >= event.maxAttendees) {
        throw new Error(`CAPACITY_EXCEEDED:${event.maxAttendees}`);
      }

      // 2. Increment currentAttendees counter safely
      await tx
        .update(events)
        .set({
          currentAttendees: sql`COALESCE(${events.currentAttendees}, 0) + 1`,
        })
        .where(eq(events.id, eventId));

      // 3. Generate clean UUID scan token upfront
      const newToken = crypto.randomUUID();

      // 4. Insert Attendee with clean normalized email without returning payload overhead
      await tx
        .insert(attendees)
        .values({
          eventId,
          scanToken: newToken,
          name: data.name,
          email: cleanEmail,
          local: data.local,
          district: data.district,
          zone: data.zone,
          duty: data.duty,
          status: 'registered',
        });

      return newToken;
    });

    scanToken = txResult;
  } catch (err: any) {
    if (err.code === '23505' || err?.cause?.code === '23505' || err?.constraint === 'unq_event_email') {
      return { success: false, error: 'Already registered with this email' };
    }
    const message = err.message || '';
    if (message.startsWith('REGISTRATION_CLOSED:')) {
      return { success: false, error: `Registration is currently ${message.split(':')[1]}.` };
    }
    if (message.startsWith('CAPACITY_EXCEEDED:')) {
      return { success: false, error: `Event has reached maximum capacity (${message.split(':')[1]} attendees).` };
    }
    if (message === 'EVENT_NOT_FOUND') return { success: false, error: 'Event does not exist.' };
    if (message === 'REGISTRATION_DEADLINE_PASSED') return { success: false, error: 'Event registration auto-close deadline has passed.' };

    return { success: false, error: message || 'Registration failed' };
  }

  // 5. Enqueue Google Sheets sync OUTSIDE transaction boundary with isolated error handling
  try {
    await enqueueSheetSync(eventId);
  } catch (syncErr) {
    console.error('Sheet sync queueing failed post-registration:', syncErr);
  }

  return { success: true, scanToken };
}

export async function lookupAttendee(eventId: string, email: string) {
  const db = getDb();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  const [attendee] = await db.select({ scanToken: attendees.scanToken })
    .from(attendees)
    .where(and(eq(attendees.eventId, eventId), eq(attendees.email, cleanEmail)))
    .limit(1);
    
  return attendee || null;
}
