import { getDb } from '@/lib/db';
import { events, eventAdmins, attendees } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { getTotalScansForAdmin } from './scanner';

export const getDashboardStats = unstable_cache(
  async (adminId: string) => {
    const db = getDb();
    
    // Using a single query to get total and active events for this admin
    const [stats] = await db.select({
      totalEvents: sql<number>`count(*)`.mapWith(Number),
      activeEvents: sql<number>`count(case when ${events.status} = 'open' and (${events.closesAt} is null or ${events.closesAt} > now()) then 1 else null end)`.mapWith(Number),
    })
    .from(eventAdmins)
    .innerJoin(events, eq(eventAdmins.eventId, events.id))
    .where(eq(eventAdmins.adminId, adminId));

    const totalScans = await getTotalScansForAdmin(adminId);

    return {
      totalEvents: stats?.totalEvents || 0,
      activeEvents: stats?.activeEvents || 0,
      totalScans,
    };
  },
  ['dashboard-stats'],
  { revalidate: 60, tags: ['dashboard-stats'] }
);

export async function getRecentDashboardEvents(adminId: string) {
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
      registeredCount: sql<number>`(SELECT count(*) FROM ${attendees} WHERE ${attendees.eventId} = ${events.id})`.mapWith(Number),
      checkedInCount: sql<number>`(SELECT count(*) FROM ${attendees} WHERE ${attendees.eventId} = ${events.id} AND ${attendees.status} = 'checked_in')`.mapWith(Number),
    })
    .from(eventAdmins)
    .innerJoin(events, eq(eventAdmins.eventId, events.id))
    .where(eq(eventAdmins.adminId, adminId))
    .orderBy(desc(events.date))
    .limit(6);

  return rows;
}
