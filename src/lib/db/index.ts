import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cache } from 'react';

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
    max: 1,
    idle_timeout: 0,
    max_lifetime: 10 // Force connection refresh every 10 seconds to avoid Cloudflare isolate freeze socket drops
  });

  return drizzle(client);
});
