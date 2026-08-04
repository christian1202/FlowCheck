import { getDb } from '@/lib/db';
import { events, eventAdmins, admins, attendees } from '@/lib/db/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import type { CreateEventInput, UpdateEventInput } from '@/lib/validators/events';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

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
  const eventId = crypto.randomUUID();
  const now = new Date();

  return await db.transaction(async (tx) => {
    const [newEvent] = await tx.insert(events).values({
      id: eventId,
      title: data.title,
      slug,
      description: data.description || null,
      date: new Date(data.date),
      location: data.location || null,
      mapLink: data.mapLink || null,
      maxAttendees: data.maxAttendees ?? null,
      closesAt: data.closesAt ? new Date(data.closesAt) : null,
      createdBy: adminId,
      status: 'draft',
      createdAt: now,
    }).returning();

    await tx.insert(eventAdmins).values({
      eventId: eventId,
      adminId: adminId,
      role: 'owner',
    });

    return newEvent;
  });
}

/**
 * Builds the FTS search condition (shared by the paginated list and the
 * async-search combobox). User terms are bound as a parameter and stripped to
 * alphanumerics so `to_tsquery` never receives raw input.
 */
function buildEventSearchCondition(queryText: string) {
  const formattedQuery = queryText
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `${term.replace(/[^a-zA-Z0-9]/g, '')}:*`)
    .filter((term) => term !== ':*')
    .join(' & ');

  return formattedQuery
    ? sql`to_tsvector('english', ${events.title} || ' ' || coalesce(${events.location}, '')) @@ to_tsquery('english', ${formattedQuery})`
    : undefined;
}

export const getEventsPaginated = (
  adminId: string,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<EventWithRole[]> =>
  unstable_cache(
    async () => {
      const db = getDb();
      const offset = (page - 1) * limit;

      const queryText = search ? search.trim() : '';
      const searchCondition = queryText ? buildEventSearchCondition(queryText) : undefined;
      const conditions = searchCondition
        ? and(eq(eventAdmins.adminId, adminId), searchCondition)
        : eq(eventAdmins.adminId, adminId);

      const rows = await db
        .select({
          role: eventAdmins.role,
          event: events,
          registeredCount: sql<number>`count(${attendees.id})`.mapWith(Number),
          checkedInCount: sql<number>`count(${attendees.id}) FILTER (WHERE ${attendees.status} = 'checked_in')`.mapWith(Number),
        })
        .from(eventAdmins)
        .innerJoin(events, eq(eventAdmins.eventId, events.id))
        .leftJoin(attendees, eq(attendees.eventId, events.id))
        .where(conditions)
        .groupBy(events.id, eventAdmins.role)
        .orderBy(desc(events.createdAt))
        .limit(limit)
        .offset(offset);

      return rows.map((row) => ({
        ...row.event,
        adminRole: row.role as EventRole,
        registeredCount: row.registeredCount,
        checkedInCount: row.checkedInCount,
      }));
    },
    ['events-paginated', adminId, String(page), String(limit), (search ?? '').trim()],
    { revalidate: 30, tags: ['events-paginated', `admin-${adminId}`] }
  )();

export const getEventById = (eventId: string, adminId: string): Promise<EventWithRole> =>
  unstable_cache(
    async () => {
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
    },
    ['event-by-id', adminId, eventId],
    { revalidate: 30, tags: ['event-by-id', `event-${eventId}`, `admin-${adminId}`] }
  )();

export async function updateEvent(eventId: string, adminId: string, data: UpdateEventInput): Promise<EventRow> {
  const db = getDb();

  const update: Partial<typeof events.$inferInsert> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.date !== undefined) update.date = new Date(data.date);
  if (data.location !== undefined) update.location = data.location;
  if (data.mapLink !== undefined) update.mapLink = data.mapLink;
  if (data.maxAttendees !== undefined) update.maxAttendees = data.maxAttendees;
  if (data.closesAt !== undefined) update.closesAt = data.closesAt ? new Date(data.closesAt) : null;
  if (data.status !== undefined) update.status = data.status;

  if (Object.keys(update).length === 0) {
    // Authorization: only return the row if the caller is a team member of this
    // event — otherwise any authenticated admin could read any event's full row
    // (drafts, google sheet IDs, creator UUIDs) by guessing an event id.
    const [existing] = await db
      .select({ event: events })
      .from(eventAdmins)
      .innerJoin(events, eq(eventAdmins.eventId, events.id))
      .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
      .limit(1);
    if (!existing) throw new Error('Unauthorized or event not found');
    return existing.event;
  }

  const [updated] = await db
    .update(events)
    .set(update)
    .where(
      and(
        eq(events.id, eventId),
        sql`EXISTS (
          SELECT 1 FROM ${eventAdmins} 
          WHERE ${eventAdmins.eventId} = ${events.id} 
            AND ${eventAdmins.adminId} = ${adminId} 
            AND ${eventAdmins.role} IN ('owner', 'editor')
        )`
      )
    )
    .returning();

  if (!updated) {
    throw new Error('Unauthorized or event not found');
  }

  return updated;
}

export async function deleteEvent(eventId: string, adminId: string): Promise<{ id: string; slug: string } | null> {
  const db = getDb();
  const [deleted] = await db
    .delete(events)
    .where(
      and(
        eq(events.id, eventId),
        sql`EXISTS (
          SELECT 1 FROM ${eventAdmins}
          WHERE ${eventAdmins.eventId} = ${events.id}
            AND ${eventAdmins.adminId} = ${adminId}
            AND ${eventAdmins.role} IN ('owner', 'editor')
        )`
      )
    )
    .returning({ id: events.id, slug: events.slug });

  return deleted ?? null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getEventBySlug = (slugOrId: string) =>
  unstable_cache(
    async () => {
      const db = getDb();
      const isUuid = UUID_REGEX.test(slugOrId);
      const condition = isUuid 
        ? or(eq(events.slug, slugOrId), eq(events.id, slugOrId))
        : eq(events.slug, slugOrId);

      const [event] = await db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          description: events.description,
          date: events.date,
          location: events.location,
          mapLink: events.mapLink,
          status: events.status,
          closesAt: events.closesAt,
          maxAttendees: events.maxAttendees,
          currentAttendees: events.currentAttendees,
        })
        .from(events)
        .where(condition)
        .limit(1);

      return event || null;
    },
    ['event-by-slug', slugOrId],
    { revalidate: 30, tags: ['event-by-slug', `slug-${slugOrId}`] }
  )();

export const getEventTeam = (eventId: string) =>
  unstable_cache(
    async () => {
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
        .where(eq(eventAdmins.eventId, eventId))
        .limit(100);

      return rows.map((row) => ({
        adminId: row.adminId,
        role: row.role as EventRole,
        email: row.email,
        fullName: row.fullName,
      }));
    },
    ['event-team', eventId],
    { revalidate: 30, tags: ['event-team', `event-${eventId}`] }
  )();

export const searchAdminEvents = cache(async (adminId: string, query: string) => {
  const db = getDb();

  const queryText = query.trim();
  const searchCondition = queryText ? buildEventSearchCondition(queryText) : undefined;
  const conditions = searchCondition
    ? and(eq(eventAdmins.adminId, adminId), searchCondition)
    : eq(eventAdmins.adminId, adminId);

  const rows = await db
    .select({ id: events.id, title: events.title })
    .from(eventAdmins)
    .innerJoin(events, eq(eventAdmins.eventId, events.id))
    .where(conditions)
    .orderBy(desc(events.createdAt))
    .limit(20);

  return rows;
});
