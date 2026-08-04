'use server';

import { getAdminSessionId } from '@/lib/auth';
import { getEventById, getEventTeam, getEventsPaginated } from '@/data/events';
import { getDashboardStats, getRecentDashboardEvents } from '@/data/dashboard';
import { getAttendeesPaginated, getAttendeesStats, getUniqueEventsForAdmin } from '@/data/attendees';

/**
 * Hover warm-up actions. Each runs the exact data queries the target page
 * executes, so their `unstable_cache` entries are populated before the user
 * clicks. Callers (useHoverPrefetch) fire these fire-and-forget and swallow
 * errors; auth failures just warm nothing.
 */
async function requireAdmin(): Promise<string> {
  const adminId = await getAdminSessionId();
  if (!adminId) throw new Error('Unauthorized');
  return adminId;
}

/** /events/[id]/settings — getEventById + getEventTeam (the blocking page) */
export async function warmEventSettings(eventId: string): Promise<void> {
  const adminId = await requireAdmin();
  await Promise.all([getEventById(eventId, adminId), getEventTeam(eventId)]);
}

/** /events/[id]/edit and /events/[id]/scanner — getEventById */
export async function warmEventEdit(eventId: string): Promise<void> {
  const adminId = await requireAdmin();
  await getEventById(eventId, adminId);
}

export async function warmEventScanner(eventId: string): Promise<void> {
  const adminId = await requireAdmin();
  await getEventById(eventId, adminId);
}

/** /events (dashboard) — stats + recent events */
export async function warmDashboard(): Promise<void> {
  const adminId = await requireAdmin();
  await Promise.all([getDashboardStats(adminId), getRecentDashboardEvents(adminId)]);
}

/** /events/all and /scanner select — first page of the events list */
export async function warmAllEvents(): Promise<void> {
  const adminId = await requireAdmin();
  await getEventsPaginated(adminId, 1, 20);
}

/** /attendees — paginated rows + stats + event filter options */
export async function warmAttendees(): Promise<void> {
  const adminId = await requireAdmin();
  await Promise.all([
    getAttendeesPaginated(adminId, {}, 1, 20),
    getAttendeesStats(adminId),
    getUniqueEventsForAdmin(adminId),
  ]);
}
