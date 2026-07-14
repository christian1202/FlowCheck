import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cache } from 'react';

// Use React's cache to initialize the database connection exactly once PER REQUEST.
// This prevents cross-request TCP socket pooling in Cloudflare Workers,
// which is the root cause of the "Connection closed" exceptions when isolates freeze.
export const getDb = cache(() => {
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Make sure you've configured it as a Cloudflare secret:\n" +
      "  wrangler secret put DATABASE_URL"
    );
  }

  // Force the use of the transaction pooler (port 6543) instead of direct connection (port 5432)
  connectionString = connectionString.replace(':5432/', ':6543/');

  if (!connectionString.includes('pgbouncer=true')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }

  const client = postgres(connectionString, {
    prepare: false,
    max: 1
  });

  return drizzle(client);
});

// Proxy to allow seamless drop-in replacement for existing `db.select()` calls
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const actualDb = getDb();
    return (actualDb as any)[prop];
  }
});
