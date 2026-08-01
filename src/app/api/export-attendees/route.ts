import { Readable } from 'node:stream';
import { getAdminSessionId } from '@/lib/auth';
import { getDb, getSqlClient } from '@/lib/db';
import { eventAdmins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const encoder = new TextEncoder();
const PAGE_SIZE = 100;

function csvValue(value: unknown) {
  const normalized = value instanceof Date ? value.toISOString() : String(value ?? '');
  return `"${normalized.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const adminId = await getAdminSessionId();
  if (!adminId) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search')?.trim();

  if (status && !['registered', 'checked_in', 'cancelled'].includes(status)) {
    return new Response('Invalid status filter', { status: 400 });
  }

  const db = getDb();
  const managedEvents = await db
    .select({ id: eventAdmins.eventId })
    .from(eventAdmins)
    .where(eq(eventAdmins.adminId, adminId));
  const eventIds = managedEvents.map((event) => event.id);

  if (eventIds.length === 0) {
    return new Response('Name,Email,Event,Local,Duty,Status,Registered At,Checked In At\n', {
      headers: csvHeaders(),
    });
  }

  const sql = getSqlClient();
  const eventFilter = eventId ? sql`and a.event_id = ${eventId}` : sql``;
  const statusFilter = status ? sql`and a.status = ${status}` : sql``;
  const searchFilter = search
    ? sql`and (a.name ilike ${`%${search}%`} or a.email ilike ${`%${search}%`} or a.local ilike ${`%${search}%`})`
    : sql``;

  const query = sql`
    select a.name, a.email, e.title as event_title, a.local, a.duty, a.status,
           a.registered_at, a.checked_in_at
    from attendees a
    inner join events e on e.id = a.event_id
    where a.event_id = any(${sql.array(eventIds, 2950)})
    ${eventFilter}
    ${statusFilter}
    ${searchFilter}
    order by a.registered_at desc
  `;

  async function* csvRows() {
    yield 'Name,Email,Event,Local,Duty,Status,Registered At,Checked In At\n';
    try {
      for await (const batch of query.cursor(PAGE_SIZE)) {
        for (const row of batch) {
          yield [
            csvValue(row.name), csvValue(row.email), csvValue(row.event_title),
            csvValue(row.local), csvValue(row.duty), csvValue(row.status),
            csvValue(row.registered_at), csvValue(row.checked_in_at),
          ].join(',') + '\n';
        }
      }
    } finally {
      await sql.end({ timeout: 2 });
    }
  }

  // Node's Readable stream keeps row iteration incremental; convert it to the
  // Web stream Response expects in Workers with nodejs_compat enabled.
  const nodeStream = Readable.from(csvRows());
  const stream = (Readable.toWeb(nodeStream) as ReadableStream<string>).pipeThrough(new TransformStream<string, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(chunk));
    },
  }));

  return new Response(stream, {
    headers: csvHeaders(),
  });
}

function csvHeaders() {
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="attendees-${new Date().toISOString().slice(0, 10)}.csv"`,
    'Cache-Control': 'no-store',
  };
}
