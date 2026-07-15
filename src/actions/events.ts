'use server';

import { revalidatePath } from 'next/cache';

import { createEvent, updateEvent, deleteEvent } from '@/data/events';
import { createEventSchema, updateEventSchema } from '@/lib/validators/events';

import { getAdminSessionId } from '@/lib/auth';

async function getAdminId() {
  const id = await getAdminSessionId();
  if (!id) throw new Error('Unauthorized');
  return id;
}

export type CreateEventState = {
  success?: boolean;
  error?: {
    form?: string[];
    title?: string[];
    description?: string[];
    date?: string[];
    location?: string[];
    mapLink?: string[];
    maxAttendees?: string[];
    closesAt?: string[];
  };
};

export async function createEventAction(prevState: CreateEventState | null, formData: FormData): Promise<CreateEventState> {
  let adminId: string;
  try {
    adminId = await getAdminId();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return { error: { form: [message] } };
  }
  
  // Extract and coerce data
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: formData.get('date'),
    location: formData.get('location'),
    mapLink: formData.get('mapLink'),
    maxAttendees: formData.get('maxAttendees') ? Number(formData.get('maxAttendees')) : null,
    closesAt: formData.get('closesAt') || null,
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
  return { success: true };
}

export type UpdateEventState = CreateEventState;

export async function updateEventAction(eventId: string, prevState: any, formData: FormData): Promise<UpdateEventState> {
  const adminId = await getAdminId();
  
  const rawData = {
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    date: formData.get('date') || undefined,
    location: formData.get('location') || undefined,
    mapLink: formData.get('mapLink') || undefined,
    maxAttendees: formData.get('maxAttendees') ? Number(formData.get('maxAttendees')) : undefined,
    closesAt: formData.get('closesAt') || undefined,
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

export async function publishEventAction(eventId: string, formData?: FormData) {
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

export async function deleteEventAction(eventId: string) {
  const adminId = await getAdminId();
  try {
    await deleteEvent(eventId, adminId);
    revalidatePath('/events');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete event' };
  }
}
