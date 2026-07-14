import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { db } from '@/lib/db';
import { events, attendees, scanLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

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

// Export standard Next.js route handlers mapping to Hono fetch
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
