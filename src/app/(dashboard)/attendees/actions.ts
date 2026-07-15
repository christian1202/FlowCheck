'use server';

import { getAdminSessionId } from '@/lib/auth';
import { getAttendeesPaginated, getAttendeesStats, getAllAttendeesForExport, type AttendeesFilters } from '@/data/attendees';

export async function fetchAttendeesPage(filters: AttendeesFilters, page: number) {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    throw new Error("Unauthorized");
  }

  const attendees = await getAttendeesPaginated(adminId, filters, page, 50);
  return attendees;
}

export async function fetchAttendeesStats(filters: AttendeesFilters) {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    throw new Error("Unauthorized");
  }

  const stats = await getAttendeesStats(adminId, filters);
  return stats;
}

export async function fetchAllAttendeesForExport(filters: AttendeesFilters) {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    throw new Error("Unauthorized");
  }

  const attendees = await getAllAttendeesForExport(adminId, filters);
  return attendees;
}
