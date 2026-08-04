'use server';

import { processScan } from '@/data/scanner';
import { revalidateTag } from 'next/cache';

import { getAdminSessionId } from '@/lib/auth';

async function getAdminId() {
  const id = await getAdminSessionId();
  if (!id) throw new Error('Unauthorized');
  return id;
}

export async function scanTicketAction(eventId: string, scanToken: string) {
  if (!scanToken || typeof scanToken !== 'string') {
    return { error: 'Invalid QR code' };
  }

  try {
    const adminId = await getAdminId();
    const result = await processScan(eventId, adminId, scanToken);

    // Check-ins change attendee counts everywhere (dashboard, lists, stats),
    // so invalidate the data caches for this event and scanning admin.
    if (result?.result === 'success') {
      revalidateTag(`event-${eventId}`, 'seconds');
      revalidateTag(`admin-${adminId}`, 'seconds');
    }

    return { data: result };
  } catch (err: unknown) {
    console.error('Scan Action Error:', err);
    return { error: 'Failed to process scan due to a server error.' };
  }
}
