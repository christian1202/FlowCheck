'use server';

import { processScan } from '@/data/scanner';

// In a real implementation with Supabase Auth, you would extract this from headers/cookies.
async function getAdminId() {
  return '00000000-0000-0000-0000-000000000000'; // mock uuid
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
