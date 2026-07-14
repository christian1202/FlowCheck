import { Hono } from 'hono';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const app = new Hono().basePath('/api');

const routes = app
  .get('/hello', (c) => {
    return c.json({ message: 'Hello from Hono Edge!' });
  })
  .get('/events', async (c) => {
    try {
      const { data: allEvents, error } = await getSupabaseAdmin().from('events').select('*');
      if (error) throw error;
      return c.json(allEvents);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  })
  .get('/events/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const { data: event, error } = await getSupabaseAdmin().from('events').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
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
