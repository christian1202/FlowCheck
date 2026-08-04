import { getDb } from '@/lib/db';
import { events, eventAdmins, attendees } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export const getDashboardStats = (adminId: string) =>
  unstable_cache(
    async () => {
      const db = getDb();
      
      // Single-pass aggregated query for totalEvents, activeEvents, and totalScans
      const [stats] = await db.select({
        totalEvents: sql<number>`count(distinct ${events.id})`.mapWith(Number),
        activeEvents: sql<number>`count(distinct case when ${events.status} = 'open' and (${events.closesAt} is null or ${events.closesAt} > now()) then ${events.id} else null end)`.mapWith(Number),
        totalScans: sql<number>`count(${attendees.id}) FILTER (WHERE ${attendees.status} = 'checked_in')`.mapWith(Number),
      })
      .from(eventAdmins)
      .innerJoin(events, eq(eventAdmins.eventId, events.id))
      .leftJoin(attendees, eq(attendees.eventId, events.id))
      .where(eq(eventAdmins.adminId, adminId));

      return {
        totalEvents: stats?.totalEvents || 0,
        activeEvents: stats?.activeEvents || 0,
        totalScans: stats?.totalScans || 0,
      };
    },
    ['dashboard-stats', adminId],
    // `admin-${adminId}` tag so mutations (create/update/delete event, scans)
    // invalidate dashboard stats via revalidateTag('admin-...').
    { revalidate: 60, tags: ['dashboard-stats', `admin-${adminId}`] }
  )();

export const getRecentDashboardEvents = (adminId: string) =>
  unstable_cache(
    async () => {
      const db = getDb();

      const rows = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          date: events.date,
          location: events.location,
          maxAttendees: events.maxAttendees,
          status: events.status,
          closesAt: events.closesAt,
          mapLink: events.mapLink,
          registeredCount: sql<number>`count(${attendees.id})`.mapWith(Number),
          checkedInCount: sql<number>`count(${attendees.id}) FILTER (WHERE ${attendees.status} = 'checked_in')`.mapWith(Number),
        })
        .from(eventAdmins)
        .innerJoin(events, eq(eventAdmins.eventId, events.id))
        .leftJoin(attendees, eq(attendees.eventId, events.id))
        .where(eq(eventAdmins.adminId, adminId))
        .groupBy(events.id, eventAdmins.addedAt)
        .orderBy(desc(events.date))
        .limit(6);

      return rows;
    },
    ['recent-events', adminId],
    { revalidate: 30, tags: ['recent-events', `admin-${adminId}`] }
  )();

