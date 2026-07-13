'use server';

import { createClient } from '@/lib/auth/index';
import { getAdminSessionId } from '@/lib/auth/index';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateProfileName(fullName: string) {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    return { error: 'Unauthorized' };
  }

  if (!fullName || fullName.trim() === '') {
    return { error: 'Name cannot be empty.' };
  }

  const supabase = await createClient();

  // 1. Update Supabase Auth metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName.trim() }
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Update Drizzle database
  try {
    await db.update(admins)
      .set({ fullName: fullName.trim() })
      .where(eq(admins.id, adminId));
      
    revalidatePath('/settings');
    return { success: true };
  } catch (dbError) {
    console.error('Error updating profile in db:', dbError);
    return { error: 'Failed to update database profile.' };
  }
}

export async function updatePassword(password: string) {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    return { error: 'Unauthorized' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 4) {
    return { error: 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
