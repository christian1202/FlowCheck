'use server';

import { processScan } from '@/data/scanner';

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
    
    return { data: result };
  } catch (err: any) {
    console.error('Scan Action Error:', err);
    return { error: 'Failed to process scan due to a server error.' };
  }
}
