import { getDb } from '@/lib/db';
import { attendees, events, eventAdmins } from '@/lib/db/schema';
import { eq, and, inArray, desc, ilike, or, sql } from 'drizzle-orm';

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

function buildConditions(adminAllowedIds: string[], filters: AttendeesFilters) {
  const conditions = [inArray(attendees.eventId, adminAllowedIds)];
  
  if (filters.eventId && filters.eventId !== 'all') {
    conditions.push(eq(attendees.eventId, filters.eventId));
  }
  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(attendees.status, filters.status as any));
  }
  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(or(
      ilike(attendees.name, s),
      ilike(attendees.email, s),
      ilike(attendees.local, s)
    ) as any);
  }
  
  return conditions;
}

export async function getAttendeesStats(adminId: string, filters: AttendeesFilters = {}) {
  const db = getDb();
  
  const adminEvents = await db.select({ id: eventAdmins.eventId })
    .from(eventAdmins)
    .where(eq(eventAdmins.adminId, adminId));

  const allowedIds = adminEvents.map(e => e.id);
  if (allowedIds.length === 0) return { total: 0, checkedIn: 0, registered: 0 };

  const conditions = buildConditions(allowedIds, filters);

  const [{ total, checkedIn }] = await db.select({
    total: sql<number>`count(*)`,
    checkedIn: sql<number>`sum(case when ${attendees.status} = 'checked_in' then 1 else 0 end)`
  })
  .from(attendees)
  .where(and(...conditions));

  return { 
    total: Number(total || 0), 
    checkedIn: Number(checkedIn || 0), 
    registered: Number(total || 0) - Number(checkedIn || 0) 
  };
}

export async function getAttendeesPaginated(
  adminId: string,
  filters: AttendeesFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<AttendeeWithEvent[]> {
  const db = getDb();
  
  const adminEvents = await db.select({ id: eventAdmins.eventId })
    .from(eventAdmins)
    .where(eq(eventAdmins.adminId, adminId));

  const allowedIds = adminEvents.map(e => e.id);
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
}

export async function getAllAttendeesForExport(
  adminId: string,
  filters: AttendeesFilters = {}
): Promise<AttendeeWithEvent[]> {
  const db = getDb();
  
  const adminEvents = await db.select({ id: eventAdmins.eventId })
    .from(eventAdmins)
    .where(eq(eventAdmins.adminId, adminId));

  const allowedIds = adminEvents.map(e => e.id);
  if (allowedIds.length === 0) return [];

  const conditions = buildConditions(allowedIds, filters);

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
  .limit(10000); // Sensible limit to prevent memory overflow

  return rows as AttendeeWithEvent[];
}

export async function getUniqueEventsForAdmin(adminId: string) {
  const db = getDb();
  const adminEventsList = await db.select({ id: events.id, title: events.title })
    .from(events)
    .innerJoin(eventAdmins, eq(events.id, eventAdmins.eventId))
    .where(eq(eventAdmins.adminId, adminId))
    .orderBy(desc(events.createdAt));
    
  return adminEventsList;
}
