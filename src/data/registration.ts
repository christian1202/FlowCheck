import { db } from '@/lib/db';
import { attendees, events } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { RegistrationInput } from '@/lib/validators/registration';
import { generateQRBase64 } from '@/lib/qr';
import { sendQrEmail } from '@/lib/email/brevo';

export type RegistrationResult = 
  | { success: true; queuedEmail: boolean }
  | { success: false; error: string };

export async function registerAttendee(
  data: RegistrationInput, 
  eventId: string
): Promise<RegistrationResult> {
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

    // 4. Check Daily Email Cap (290/day)
    const [{ emailCount }] = await tx.select({ count: sql<number>`count(*)` })
      .from(attendees)
      .where(and(
        eq(attendees.emailSent, true),
        sql`DATE(email_sent_at) = CURRENT_DATE`
      ));

    const limitReached = Number(emailCount) >= 290;

    // 5. Insert Attendee
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
      emailSent: false, // Initially false
    }).returning();

    // 6. Handle Email Sending / Queueing
    if (limitReached) {
      // Return early; the Cron Job will pick this up tomorrow
      return { success: true, queuedEmail: true };
    }

    // Try sending the email synchronously
    try {
      const qrBase64 = await generateQRBase64(newAttendee.scanToken);
      const emailSent = await sendQrEmail(
        newAttendee.email,
        newAttendee.name,
        event.title,
        qrBase64,
        newAttendee.scanToken
      );

      if (emailSent) {
        await tx.update(attendees)
          .set({ emailSent: true, emailSentAt: new Date() })
          .where(eq(attendees.id, newAttendee.id));
      }
      
      // If email fails to send here (e.g. Brevo API down), it remains emailSent=false 
      // and will be retried by the queue/cron job automatically.
    } catch (error) {
      console.error('Error during QR/Email flow:', error);
      // We don't fail the registration, just let it be picked up by the retry queue
    }

    return { success: true, queuedEmail: false };
  });
}
