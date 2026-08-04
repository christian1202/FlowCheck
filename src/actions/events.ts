'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

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
  const adminId = await getAdminSessionId();
  if (!adminId) {
    return { error: { form: ['Unauthorized'] } };
  }
  
  // Extract and coerce data efficiently
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

  try {
    await createEvent(validated.data, adminId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    return { error: { form: [message] } };
  }

  revalidatePath('/events', 'page');
  revalidateTag(`admin-${adminId}`, 'seconds'); // data caches: dashboard stats, event lists, unique events
  return { success: true };
}

export type UpdateEventState = CreateEventState;

export async function updateEventAction(eventId: string, _prevState: unknown, formData: FormData): Promise<UpdateEventState> {
  const adminId = await getAdminSessionId();
  if (!adminId) return { error: { form: ['Unauthorized'] } };
  
  const rawData = {
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    date: formData.get('date') || undefined,
    location: formData.get('location') || undefined,
    mapLink: formData.get('mapLink') || undefined,
    maxAttendees: formData.get('maxAttendees') ? Number(formData.get('maxAttendees')) : undefined,
    closesAt: formData.get('closesAt') || undefined,
  };

  const cleanedData = Object.fromEntries(Object.entries(rawData).filter(([, v]) => v !== undefined));

  const validated = updateEventSchema.safeParse(cleanedData);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  try {
    const updated = await updateEvent(eventId, adminId, validated.data);
    revalidatePath(`/events/${eventId}`, 'page');
    revalidatePath('/events', 'page');
    revalidateTag(`admin-${adminId}`, 'seconds');
    revalidateTag(`event-${eventId}`, 'seconds');
    // public register page (getEventBySlug): slug-form links + id-form URLs
    if (updated?.slug) revalidateTag(`slug-${updated.slug}`, 'seconds');
    revalidateTag(`slug-${eventId}`, 'seconds');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update event';
    return { error: { form: [message] } };
  }
}

export async function publishEventAction(eventId: string) {
  const adminId = await getAdminSessionId();
  if (!adminId) return { error: 'Unauthorized' };
  try {
    const updated = await updateEvent(eventId, adminId, { status: 'open' });
    revalidatePath(`/events/${eventId}`, 'page');
    revalidatePath('/events', 'page');
    revalidateTag(`admin-${adminId}`, 'seconds');
    revalidateTag(`event-${eventId}`, 'seconds');
    // public register page (getEventBySlug): slug-form links + id-form URLs
    if (updated?.slug) revalidateTag(`slug-${updated.slug}`, 'seconds');
    revalidateTag(`slug-${eventId}`, 'seconds');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to publish event' };
  }
}

export async function deleteEventAction(eventId: string) {
  const adminId = await getAdminSessionId();
  if (!adminId) return { error: 'Unauthorized' };
  try {
    const deleted = await deleteEvent(eventId, adminId);
    revalidatePath('/events', 'page');
    revalidateTag(`admin-${adminId}`, 'seconds');
    revalidateTag(`event-${eventId}`, 'seconds');
    if (deleted?.slug) revalidateTag(`slug-${deleted.slug}`, 'seconds'); // public register page (getEventBySlug)
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete event' };
  }
}
