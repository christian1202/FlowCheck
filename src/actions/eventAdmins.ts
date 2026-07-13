'use server';

import { db } from '@/lib/db';
import { admins, eventAdmins } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAdminSessionId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addEventAdmin(eventId: string, email: string, role: 'editor' | 'scanner') {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    return { error: 'Unauthorized' };
  }

  // 1. Verify that the current user has permission (must be owner or editor)
  const currentAccess = await db
    .select()
    .from(eventAdmins)
    .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
    .limit(1);

  if (currentAccess.length === 0 || currentAccess[0].role === 'scanner') {
    return { error: 'You do not have permission to add team members to this event.' };
  }

  // 2. Find the target user by email
  const targetUsers = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email.trim().toLowerCase()))
    .limit(1);

  if (targetUsers.length === 0) {
    return { error: 'User not found. Please ask them to create an account first before inviting them.' };
  }

  const targetUserId = targetUsers[0].id;

  // 3. Upsert into event_admins (insert or update role if they already exist)
  try {
    await db.insert(eventAdmins)
      .values({
        eventId,
        adminId: targetUserId,
        role,
      })
      .onConflictDoUpdate({
        target: [eventAdmins.eventId, eventAdmins.adminId],
        set: { role },
      });
      
    revalidatePath(`/events/${eventId}/settings`);
    return { success: true };
  } catch (err) {
    console.error('Error adding event admin:', err);
    return { error: 'Failed to add team member.' };
  }
}

export async function removeEventAdmin(eventId: string, targetAdminId: string) {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    return { error: 'Unauthorized' };
  }

  // 1. Verify that the current user has permission
  const currentAccess = await db
    .select()
    .from(eventAdmins)
    .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
    .limit(1);

  if (currentAccess.length === 0 || currentAccess[0].role === 'scanner') {
    return { error: 'You do not have permission to remove team members from this event.' };
  }

  // 2. Prevent removing the last owner
  if (currentAccess[0].role === 'owner') {
    const allOwners = await db
      .select()
      .from(eventAdmins)
      .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.role, 'owner')));
      
    if (allOwners.length === 1 && allOwners[0].adminId === targetAdminId) {
      return { error: 'Cannot remove the only owner of the event.' };
    }
  } else if (currentAccess[0].role === 'editor') {
    // Editors cannot remove owners
    const targetAccess = await db
      .select()
      .from(eventAdmins)
      .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, targetAdminId)))
      .limit(1);
      
    if (targetAccess.length > 0 && targetAccess[0].role === 'owner') {
      return { error: 'Editors cannot remove event owners.' };
    }
  }

  // 3. Delete from event_admins
  try {
    await db.delete(eventAdmins)
      .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, targetAdminId)));
      
    revalidatePath(`/events/${eventId}/settings`);
    return { success: true };
  } catch (err) {
    console.error('Error removing event admin:', err);
    return { error: 'Failed to remove team member.' };
  }
}
