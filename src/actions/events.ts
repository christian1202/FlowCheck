'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createEvent, updateEvent } from '@/data/events';
import { createEventSchema, updateEventSchema } from '@/lib/validators/events';

import { getAdminSessionId } from '@/lib/auth';

async function getAdminId() {
  const id = await getAdminSessionId();
  if (!id) throw new Error('Unauthorized');
  return id;
}

export type CreateEventState = {
  error?: {
    form?: string[];
    title?: string[];
    description?: string[];
    date?: string[];
    location?: string[];
    maxAttendees?: string[];
  };
};

export async function createEventAction(prevState: CreateEventState | null, formData: FormData): Promise<CreateEventState> {
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

  let newEventId: string;
  try {
    const event = await createEvent(validated.data, adminId);
    newEventId = event.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    return { error: { form: [message] } };
  }

  revalidatePath('/events'); // revalidate the dashboard
  redirect(`/events/${newEventId}/settings`);
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update event';
    return { error: { form: [message] } };
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
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to publish event' };
  }
}
