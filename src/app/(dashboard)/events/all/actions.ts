'use server';

import { getAdminSessionId } from '@/lib/auth';
import { getEventsPaginated } from '@/data/events';

export async function fetchEventsPage(page: number, limit: number = 20, search?: string) {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    throw new Error("Unauthorized");
  }

  const events = await getEventsPaginated(adminId, page, limit, search);
  return events;
}
