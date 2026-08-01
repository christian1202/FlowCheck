import { Hono } from 'hono';
import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { registerAttendee } from '@/data/registration';
import { registrationSchema } from '@/lib/validators/registration';

const app = new Hono().basePath('/api');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .get('/hello', (c) => {
    return c.json({ message: 'Hello from Hono Edge!' });
  })
  .get('/events', async (c) => {
    try {
      const db = getDb();
      const allEvents = await db.select().from(events).limit(100);
      return c.json(allEvents);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  })
  .get('/events/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const db = getDb();
      const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
      if (!event) return c.json({ error: 'Event not found' }, 404);
      return c.json(event);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  })
  .post('/events/:id/register', async (c) => {
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
