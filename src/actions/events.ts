'use server';

import { revalidatePath } from 'next/cache';
import { createEvent, updateEvent } from '@/data/events';
import { createEventSchema, updateEventSchema } from '@/lib/validators/events';

// In a real implementation with Supabase Auth, you would extract this from headers/cookies.
// For now, we mock the admin ID.
async function getAdminId() {
  return '00000000-0000-0000-0000-000000000000'; // mock uuid
}

export async function createEventAction(formData: FormData) {
  const adminId = await getAdminId();
  
  // Extract and coerce data
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: formData.get('date'),
    location: formData.get('location'),
    maxAttendees: formData.get('maxAttendees') ? Number(formData.get('maxAttendees')) : null,
  };

  const validated = createEventSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  try {
    const event = await createEvent(validated.data, adminId);
    revalidatePath('/events'); // revalidate the dashboard
    return { success: true, eventId: event.id };
  } catch (err: any) {
    return { error: { form: [err.message || 'Failed to create event'] } };
  }
}

export async function updateEventAction(eventId: string, formData: FormData) {
  const adminId = await getAdminId();
  
  const rawData = {
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    date: formData.get('date') || undefined,
    location: formData.get('location') || undefined,
    maxAttendees: formData.get('maxAttendees') ? Number(formData.get('maxAttendees')) : undefined,
  };

  // Filter out undefined values to allow partial updates
  const cleanedData = Object.fromEntries(Object.entries(rawData).filter(([_, v]) => v !== undefined));

  const validated = updateEventSchema.safeParse(cleanedData);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  try {
    await updateEvent(eventId, adminId, validated.data);
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    return { success: true };
  } catch (err: any) {
    return { error: { form: [err.message || 'Failed to update event'] } };
  }
}

export async function publishEventAction(eventId: string) {
  const adminId = await getAdminId();
  try {
    // We update the status. In Phase 5, we will trigger the Google Sheet creation here.
    await updateEvent(eventId, adminId, { status: 'open' });
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to publish event' };
  }
}
