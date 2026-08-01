import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle>;

const globalForDb = globalThis as unknown as {
  conn: PostgresClient | undefined;
  db: DrizzleDb | undefined;
};

export function resetDb() {
  if (globalForDb.conn) {
    try {
      globalForDb.conn.end();
    } catch {}
  }
  globalForDb.conn = undefined;
  globalForDb.db = undefined;
}

export function getDb(): DrizzleDb {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Make sure you've configured it in your environment or Cloudflare secrets."
    );
  }

  const client = globalForDb.conn ?? postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 15,
    max_lifetime: 60,
    connect_timeout: 10,
    onnotice: () => {},
  });

  const db = globalForDb.db ?? drizzle(client);

  globalForDb.conn = client;
  globalForDb.db = db;

  return db;
}
