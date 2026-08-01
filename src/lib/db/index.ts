import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle>;

type HyperdriveBinding = {
  connectionString: string;
};

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

  // Cloudflare Workers must use a Hyperdrive connection string for Postgres
  // TCP access. OpenNext exposes bindings on process.env at request time.
  const hyperdrive = (process.env as unknown as { HYPERDRIVE?: HyperdriveBinding }).HYPERDRIVE;
  const connectionString = hyperdrive?.connectionString || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Make sure you've configured it in your environment or Cloudflare secrets."
    );
  }

  const client = globalForDb.conn ?? postgres(connectionString, {
    // Hyperdrive can cache prepared statements. Direct local connections use
    // the same setting safely with the transaction pooler.
    prepare: true,
    fetch_types: false,
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
