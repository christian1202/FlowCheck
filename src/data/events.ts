import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { CreateEventInput, UpdateEventInput } from '@/lib/validators/events';

type EventRole = 'owner' | 'editor' | 'scanner';
type EventRecord = Record<string, any>;

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function normalizeEvent(event: EventRecord): EventRecord {
  return {
    ...event,
    createdBy: event.created_by,
    maxAttendees: event.max_attendees,
    googleSheetId: event.google_sheet_id,
    googleSheetUrl: event.google_sheet_url,
    createdAt: event.created_at,
  };
}

/**
 * Generate a unique slug from a title
 */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomStr}`;
}

export async function createEvent(data: CreateEventInput, adminId: string): Promise<EventRecord> {
  const admin = getSupabaseAdmin();
  const slug = generateSlug(data.title);
  const { data: newEvent, error: eventError } = await admin.from('events').insert({
      title: data.title,
      slug,
      description: data.description,
      date: data.date,
      location: data.location,
      max_attendees: data.maxAttendees,
      created_by: adminId,
      status: 'draft',
    }).select().single();
  throwIfError(eventError);

  const { error: ownerError } = await admin.from('event_admins').insert({
    event_id: newEvent.id,
    admin_id: adminId,
    role: 'owner',
  });
  if (ownerError) {
    // Avoid leaving an inaccessible event if the second REST request fails.
    await admin.from('events').delete().eq('id', newEvent.id);
    throwIfError(ownerError);
  }

  return normalizeEvent(newEvent as EventRecord);
}

export async function getEventsForAdmin(adminId: string): Promise<Array<EventRecord & { adminRole: EventRole }>> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('event_admins')
    .select('role, event:events(*)')
    .eq('admin_id', adminId)
    .order('added_at', { ascending: false });
  throwIfError(error);

  return ((data ?? []) as Array<{ role: EventRole; event: EventRecord | null }>)
    .filter((row) => row.event)
    .map((row) => ({ ...normalizeEvent(row.event!), adminRole: row.role }));
}

export async function getEventById(eventId: string, adminId: string): Promise<EventRecord & { adminRole: EventRole }> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('event_admins')
    .select('role, event:events(*)')
    .eq('event_id', eventId)
    .eq('admin_id', adminId)
    .maybeSingle();
  throwIfError(error);
  const row = data as { role: EventRole; event: EventRecord | null } | null;
  if (!row?.event) {
    throw new Error('Unauthorized');
  }
  return { ...normalizeEvent(row.event), adminRole: row.role };
}

export async function updateEvent(eventId: string, adminId: string, data: UpdateEventInput): Promise<EventRecord> {
  const event = await getEventById(eventId, adminId);
  if (event.adminRole === 'scanner') {
    throw new Error('Unauthorized');
  }
  const admin = getSupabaseAdmin();
  const update = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.date !== undefined && { date: data.date }),
    ...(data.location !== undefined && { location: data.location }),
    ...(data.maxAttendees !== undefined && { max_attendees: data.maxAttendees }),
    ...(data.status !== undefined && { status: data.status }),
  };
  const { data: updated, error } = await admin.from('events').update(update).eq('id', eventId).select().single();
  throwIfError(error);
  return normalizeEvent(updated as EventRecord);
}

export async function getEventBySlug(slug: string): Promise<EventRecord | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('events').select('*').eq('slug', slug).maybeSingle();
  throwIfError(error);
  return data ? normalizeEvent(data as EventRecord) : null;
}

export async function getEventTeam(eventId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('event_admins')
    .select('admin_id, role, admin:admins(email, full_name)')
    .eq('event_id', eventId);
  throwIfError(error);

  return ((data ?? []) as unknown as Array<{
    admin_id: string;
    role: EventRole;
    admin: Array<{ email: string; full_name: string | null }> | null;
  }>).filter((row) => row.admin?.[0]).map((row) => ({
    adminId: row.admin_id,
    role: row.role,
    email: row.admin![0].email,
    fullName: row.admin![0].full_name,
  }));
}
