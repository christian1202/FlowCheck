import { getDb } from '@/lib/db';
import { attendees, events, eventAdmins } from '@/lib/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

export type AttendeeWithEvent = {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  local: string | null;
  duty: string | null;
  status: 'registered' | 'checked_in' | 'cancelled';
  registeredAt: Date;
  checkedInAt: Date | null;
};

export async function getAttendeesForAdmin(adminId: string): Promise<AttendeeWithEvent[]> {
  const db = getDb();
  
  // Find all events this admin manages
  const adminEvents = await db.select({ id: eventAdmins.eventId })
    .from(eventAdmins)
    .where(eq(eventAdmins.adminId, adminId));

  const allowedIds = adminEvents.map(e => e.id);
  if (allowedIds.length === 0) return [];
  
  // Fetch all attendees for those events, joined with event details
  const rows = await db.select({
    id: attendees.id,
    eventId: attendees.eventId,
    eventTitle: events.title,
    name: attendees.name,
    email: attendees.email,
    local: attendees.local,
    duty: attendees.duty,
    status: attendees.status,
    registeredAt: attendees.registeredAt,
    checkedInAt: attendees.checkedInAt,
  })
  .from(attendees)
  .innerJoin(events, eq(attendees.eventId, events.id))
  .where(inArray(attendees.eventId, allowedIds))
  .orderBy(desc(attendees.registeredAt));

  return rows as AttendeeWithEvent[];
}
