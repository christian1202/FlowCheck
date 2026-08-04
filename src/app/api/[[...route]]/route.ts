import { Hono } from 'hono';
import { registerAttendee } from '@/data/registration';
import { registrationSchema } from '@/lib/validators/registration';

// NOTE: previously this file also exposed unauthenticated `GET /api/events` and
// `GET /api/events/:id` returning full event rows for every event (including
// drafts, Google sheet IDs, and creator UUIDs). Those were removed — nothing in
// the app used them, and they leaked data to anonymous callers.
// Only the public pre-registration endpoint remains (validated, capacity-checked).
const app = new Hono().basePath('/api');

const routes = app.post('/events/:id/register', async (c) => {
  const eventId = c.req.param('id');
  try {
    const body = await c.req.json();
    const validated = registrationSchema.safeParse(body);
    if (!validated.success) {
      return c.json({ error: validated.error.flatten().fieldErrors }, 400);
    }

    const result = await registerAttendee(validated.data, eventId);

    if (!result.success) {
      return c.json({ error: result.error }, 409);
    }

    return c.json({ success: true, scanToken: result.scanToken }, 201);
  } catch (e) {
    console.error('Registration endpoint error:', e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export type AppType = typeof routes;

// Use the Web-standard Hono handler directly. This avoids the Vercel adapter
// compatibility layer while remaining portable to the Cloudflare Worker runtime.
export const GET = (request: Request) => app.fetch(request);
export const POST = (request: Request) => app.fetch(request);
export const PUT = (request: Request) => app.fetch(request);
export const DELETE = (request: Request) => app.fetch(request);
export const PATCH = (request: Request) => app.fetch(request);
export const OPTIONS = (request: Request) => app.fetch(request);
