import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle>;

const globalForDb = globalThis as unknown as {
  conn: PostgresClient | undefined;
  db: DrizzleDb | undefined;
};

export function getDb(): DrizzleDb {
  if (globalForDb.db) {
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

  const client = globalForDb.conn ?? postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
  });

  const db = globalForDb.db ?? drizzle(client);

  globalForDb.conn = client;
  globalForDb.db = db;

  return db;
}
