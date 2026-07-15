import { getDb } from '@/lib/db';
import { events, eventAdmins, admins, attendees } from '@/lib/db/schema';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import type { CreateEventInput, UpdateEventInput } from '@/lib/validators/events';

export type EventRole = 'owner' | 'editor' | 'scanner';
export type EventRow = InferSelectModel<typeof events>;
export type EventWithRole = EventRow & { 
  adminRole: EventRole;
  registeredCount?: number;
  checkedInCount?: number;
};

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

export async function createEvent(data: CreateEventInput, adminId: string): Promise<EventRow> {
  const db = getDb();
  const slug = generateSlug(data.title);

  return await db.transaction(async (tx) => {
    const [newEvent] = await tx.insert(events).values({
      title: data.title,
      slug,
      description: data.description || null,
      date: new Date(data.date),
      location: data.location || null,
      maxAttendees: data.maxAttendees ?? null,
      closesAt: data.closesAt ? new Date(data.closesAt) : null,
      createdBy: adminId,
      status: 'draft',
    }).returning();

    await tx.insert(eventAdmins).values({
      eventId: newEvent.id,
      adminId: adminId,
      role: 'owner',
    });

    return newEvent;
  });
}

export async function getEventsForAdmin(adminId: string): Promise<EventWithRole[]> {
  const db = getDb();
  const rows = await db
    .select({
      role: eventAdmins.role,
      event: events,
      registeredCount: sql<number>`(SELECT count(*) FROM ${attendees} WHERE ${attendees.eventId} = ${events.id})`.mapWith(Number),
      checkedInCount: sql<number>`(SELECT count(*) FROM ${attendees} WHERE ${attendees.eventId} = ${events.id} AND ${attendees.status} = 'checked_in')`.mapWith(Number),
    })
    .from(eventAdmins)
    .innerJoin(events, eq(eventAdmins.eventId, events.id))
    .where(eq(eventAdmins.adminId, adminId))
    .orderBy(desc(eventAdmins.addedAt));

  return rows.map((row) => ({
    ...row.event,
    adminRole: row.role as EventRole,
    registeredCount: row.registeredCount,
    checkedInCount: row.checkedInCount,
  }));
}

export async function getEventsPaginated(
  adminId: string, 
  page: number = 1, 
  limit: number = 20, 
  search?: string
): Promise<EventWithRole[]> {
  const db = getDb();
  const offset = (page - 1) * limit;

  let conditions = eq(eventAdmins.adminId, adminId);
  if (search) {
    conditions = and(conditions, ilike(events.title, `%${search}%`)) as any;
  }

  const rows = await db
    .select({
      role: eventAdmins.role,
      event: events,
      registeredCount: sql<number>`(SELECT count(*) FROM ${attendees} WHERE ${attendees.eventId} = ${events.id})`.mapWith(Number),
      checkedInCount: sql<number>`(SELECT count(*) FROM ${attendees} WHERE ${attendees.eventId} = ${events.id} AND ${attendees.status} = 'checked_in')`.mapWith(Number),
    })
    .from(eventAdmins)
    .innerJoin(events, eq(eventAdmins.eventId, events.id))
    .where(conditions)
    .orderBy(desc(events.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    ...row.event,
    adminRole: row.role as EventRole,
    registeredCount: row.registeredCount,
    checkedInCount: row.checkedInCount,
  }));
}

export async function getEventById(eventId: string, adminId: string): Promise<EventWithRole> {
  const db = getDb();
  const rows = await db
    .select({
      role: eventAdmins.role,
      event: events,
    })
    .from(eventAdmins)
    .innerJoin(events, eq(eventAdmins.eventId, events.id))
    .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error('Unauthorized');
  }

  return {
    ...rows[0].event,
    adminRole: rows[0].role as EventRole,
  };
}

export async function updateEvent(eventId: string, adminId: string, data: UpdateEventInput): Promise<EventRow> {
  const db = getDb();
  // Verify access first
  const access = await db
    .select({ role: eventAdmins.role })
    .from(eventAdmins)
    .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
    .limit(1);

  if (access.length === 0 || access[0].role === 'scanner') {
    throw new Error('Unauthorized');
  }

  const update: Partial<typeof events.$inferInsert> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.date !== undefined) update.date = new Date(data.date);
  if (data.location !== undefined) update.location = data.location;
  if (data.maxAttendees !== undefined) update.maxAttendees = data.maxAttendees;
  if (data.closesAt !== undefined) update.closesAt = data.closesAt ? new Date(data.closesAt) : null;
  if (data.status !== undefined) update.status = data.status;

  const [updated] = await db
    .update(events)
    .set(update)
    .where(eq(events.id, eventId))
    .returning();

  return updated;
}

export async function deleteEvent(eventId: string, adminId: string): Promise<void> {
  const db = getDb();
  const access = await db
    .select({ role: eventAdmins.role })
    .from(eventAdmins)
    .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
    .limit(1);

  if (access.length === 0 || access[0].role === 'scanner') {
    throw new Error('Unauthorized');
  }

  await db.delete(events).where(eq(events.id, eventId));
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  return event || null;
}

export async function getEventTeam(eventId: string) {
  const db = getDb();
  const rows = await db
    .select({
      adminId: eventAdmins.adminId,
      role: eventAdmins.role,
      email: admins.email,
      fullName: admins.fullName,
    })
    .from(eventAdmins)
    .innerJoin(admins, eq(eventAdmins.adminId, admins.id))
    .where(eq(eventAdmins.eventId, eventId));

  return rows.map((row) => ({
    adminId: row.adminId,
    role: row.role as EventRole,
    email: row.email,
    fullName: row.fullName,
  }));
}