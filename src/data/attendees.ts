import { getDb } from '@/lib/db';
import { attendees, events, eventAdmins } from '@/lib/db/schema';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

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

export type AttendeesFilters = {
  search?: string;
  eventId?: string;
  status?: string;
};

export const getAdminAllowedEventIds = cache(async (adminId: string): Promise<string[]> => {
  const db = getDb();
  const adminEvents = await db.select({ id: eventAdmins.eventId })
    .from(eventAdmins)
    .where(eq(eventAdmins.adminId, adminId));
  return adminEvents.map(e => e.id);
});

function buildConditions(adminAllowedIds: string[], filters: AttendeesFilters) {
  const conditions = [];
  
  if (filters.eventId && filters.eventId !== 'all') {
    if (adminAllowedIds.includes(filters.eventId)) {
      conditions.push(eq(attendees.eventId, filters.eventId));
    } else {
      conditions.push(sql`1 = 0`);
    }
  } else {
    conditions.push(inArray(attendees.eventId, adminAllowedIds));
  }

  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(attendees.status, filters.status as 'registered' | 'checked_in' | 'cancelled'));
  }
  if (filters.search) {
    const queryText = filters.search.trim();
    if (queryText) {
      conditions.push(
        sql`to_tsvector('english', ${attendees.name} || ' ' || ${attendees.email} || ' ' || coalesce(${attendees.local}, '')) @@ websearch_to_tsquery('english', ${queryText})`
      );
    }
  }
  
  return conditions;
}

export const getAttendeesStats = (adminId: string, eventId: string = 'all') =>
  unstable_cache(
    async () => {
      const db = getDb();
      
      const allowedIds = await getAdminAllowedEventIds(adminId);
      if (allowedIds.length === 0) return { total: 0, checkedIn: 0, registered: 0 };

      const conditions = [];
      if (eventId && eventId !== 'all') {
        if (allowedIds.includes(eventId)) {
          conditions.push(eq(attendees.eventId, eventId));
        } else {
          return { total: 0, checkedIn: 0, registered: 0 };
        }
      } else {
        conditions.push(inArray(attendees.eventId, allowedIds));
      }

      const [{ total, checkedIn }] = await db.select({
        total: sql<number>`count(*)`.mapWith(Number),
        checkedIn: sql<number>`count(*) FILTER (WHERE ${attendees.status} = 'checked_in')`.mapWith(Number),
      })
      .from(attendees)
      .where(and(...conditions));

      return { 
        total: Number(total || 0), 
        checkedIn: Number(checkedIn || 0), 
        registered: Number(total || 0) - Number(checkedIn || 0) 
      };
    },
    ['attendees-stats', adminId, eventId],
    { revalidate: 60, tags: ['attendees-stats', `admin-${adminId}`, `event-${eventId}`] }
  )();

export const getAttendeesPaginated = (
  adminId: string,
  filters: AttendeesFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<AttendeeWithEvent[]> =>
  unstable_cache(
    async () => {
      const db = getDb();

      const allowedIds = await getAdminAllowedEventIds(adminId);
      if (allowedIds.length === 0) return [];

      const conditions = buildConditions(allowedIds, filters);
      const offset = (page - 1) * limit;

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
      .where(and(...conditions))
      .orderBy(desc(attendees.registeredAt))
      .limit(limit)
      .offset(offset);

      return rows as AttendeeWithEvent[];
    },
    [
      'attendees-paginated',
      adminId,
      String(page),
      String(limit),
      filters.eventId ?? 'all',
      filters.status ?? 'all',
      (filters.search ?? '').trim(),
    ],
    {
      revalidate: 30,
      tags: [
        'attendees-paginated',
        `admin-${adminId}`,
        ...(filters.eventId && filters.eventId !== 'all' ? [`event-${filters.eventId}`] : []),
      ],
    }
  )();

export const getUniqueEventsForAdmin = (adminId: string) =>
  unstable_cache(
    async () => {
      const db = getDb();
      const adminEventsList = await db.select({ id: events.id, title: events.title })
        .from(events)
        .innerJoin(eventAdmins, eq(events.id, eventAdmins.eventId))
        .where(eq(eventAdmins.adminId, adminId))
        .orderBy(desc(events.createdAt))
        .limit(200);

      return adminEventsList;
    },
    ['unique-events', adminId],
    { revalidate: 30, tags: ['unique-events', `admin-${adminId}`] }
  )();

