import { Hono } from 'hono';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono().basePath('/api');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .get('/hello', (c) => {
    return c.json({ message: 'Hello from Hono Edge!' });
  })
  .get('/events', async (c) => {
    try {
      const allEvents = await db.select().from(events);
      return c.json(allEvents);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  })
  .get('/events/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
      if (!event) return c.json({ error: 'Event not found' }, 404);
      return c.json(event);
    } catch (e) {
      console.error(e);
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
