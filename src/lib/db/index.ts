import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cache } from 'react';

// We initialize this lazily to prevent top-level module evaluation crashes
let _db: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (_db) return _db;

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

  _db = drizzle(client);
  return _db;
};

// Proxy to allow seamless drop-in replacement for existing `db.select()` calls
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const actualDb = getDb();
    return (actualDb as any)[prop];
  }
});
