import { db } from '@/lib/db';
import { events, eventAdmins } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { CreateEventInput, UpdateEventInput } from '@/lib/validators/events';

/**
 * Generate a unique slug from a title
 */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomStr}`;
}

export async function createEvent(data: CreateEventInput, adminId: string) {
  // In a real app with Supabase Auth, adminId comes from the session.
  // We'll wrap this in a transaction: create event + assign owner role
  
  return await db.transaction(async (tx) => {
    const slug = generateSlug(data.title);
    
    // 1. Create the event
    const [newEvent] = await tx.insert(events).values({
      title: data.title,
      slug,
      description: data.description,
      date: data.date,
      location: data.location,
      maxAttendees: data.maxAttendees,
      createdBy: adminId,
      status: 'draft',
    }).returning();

    // 2. Assign the creator as the owner
    await tx.insert(eventAdmins).values({
      eventId: newEvent.id,
      adminId: adminId,
      role: 'owner',
    });

    return newEvent;
  });
}

export async function getEventsForAdmin(adminId: string) {
  // Join events with eventAdmins to get all events this admin has access to
  const adminEvents = await db
    .select({
      event: events,
      role: eventAdmins.role,
    })
    .from(events)
    .innerJoin(eventAdmins, eq(events.id, eventAdmins.eventId))
    .where(eq(eventAdmins.adminId, adminId))
    .orderBy(desc(events.createdAt));

  return adminEvents.map((row) => ({
    ...row.event,
    adminRole: row.role,
  }));
}

export async function getEventById(eventId: string, adminId: string) {
  // Verify access
  const adminAccess = await db
    .select()
    .from(eventAdmins)
    .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
    .limit(1);

  if (adminAccess.length === 0) {
    throw new Error('Unauthorized');
  }

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return { ...event, adminRole: adminAccess[0].role };
}

export async function updateEvent(eventId: string, adminId: string, data: UpdateEventInput) {
  // Verify access (must be owner or editor)
  const adminAccess = await db
    .select()
    .from(eventAdmins)
    .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
    .limit(1);

  if (adminAccess.length === 0 || adminAccess[0].role === 'scanner') {
    throw new Error('Unauthorized');
  }

  const [updated] = await db
    .update(events)
    .set(data)
    .where(eq(events.id, eventId))
    .returning();

  return updated;
}
