import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle>;

const globalForDb = globalThis as unknown as {
  conn: PostgresClient | undefined;
  db: DrizzleDb | undefined;
};

export function getDb(): DrizzleDb {
  // Use global caching ONLY in local development to prevent hot-reload connection leaks.
  // In serverless Cloudflare Workers production, global sockets get closed by Cloudflare/Supabase
  // between request pauses, leading to "Error: Connection closed." on reused isolates.
  if (process.env.NODE_ENV === 'development' && globalForDb.db) {
    return globalForDb.db;
  }

  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Make sure you've configured it in your environment or Cloudflare secrets."
    );
  }

  // Standardize Supabase transaction pooler port (6543) with PgBouncer mode
  connectionString = connectionString.replace(':5432/', ':6543/');
  if (!connectionString.includes('pgbouncer=true')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }

  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  });

  const db = drizzle(client);

  if (process.env.NODE_ENV === 'development') {
    globalForDb.conn = client;
    globalForDb.db = db;
  }

  return db;
}
