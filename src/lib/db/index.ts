import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getCloudflareContext } from '@opennextjs/cloudflare';

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle>;

type HyperdriveBinding = {
  connectionString: string;
};

declare global {
  interface CloudflareEnv {
    HYPERDRIVE?: HyperdriveBinding;
  }
}

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

export function getSqlClient(): PostgresClient {
  // OpenNext exposes Cloudflare bindings through its request context, not
  // process.env. The fallback keeps direct Postgres usable in local Node work.
  let hyperdrive: HyperdriveBinding | undefined;
  try {
    hyperdrive = getCloudflareContext().env.HYPERDRIVE as HyperdriveBinding | undefined;
  } catch {
    // No Worker request context: use DATABASE_URL for local development.
  }
  const isCloudflareDeployment = process.env.NEXT_PUBLIC_APP_URL?.includes('workers.dev') ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('workers.cloudflare.com');

  if (isCloudflareDeployment && !hyperdrive) {
    throw new Error(
      'HYPERDRIVE is not bound. Enable the [[hyperdrive]] binding in wrangler.toml; direct DATABASE_URL connections hang in Cloudflare Workers.'
    );
  }

  const connectionString = hyperdrive?.connectionString || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Make sure you've configured it in your environment or Cloudflare secrets."
    );
  }

  // A Worker isolate can serve many requests. Do not retain a TCP client in a
  // global when using Hyperdrive; retained clients can exhaust Worker socket
  // resources and produce Error 1102. Hyperdrive maintains the upstream pool.
  if (!hyperdrive && globalForDb.conn) {
    return globalForDb.conn;
  }

  // Use Hyperdrive-specific optimizations (prepare: true, max: 1) only when running through Cloudflare.
  // When running locally connecting directly to Supabase Supavisor pooler (port 5432/6543),
  // prepare MUST be false, and we should rely on standard pg pooling defaults to avoid CONNECTION_ENDED.
  const isDirectConnection = !hyperdrive;
  
  const client = postgres(connectionString, {
    prepare: isDirectConnection ? false : true,
    fetch_types: false,
    max: isDirectConnection ? undefined : 1,
    idle_timeout: isDirectConnection ? undefined : 15,
    max_lifetime: isDirectConnection ? undefined : 60,
    connect_timeout: 10,
    onnotice: () => {},
  });

  if (isDirectConnection) {
    globalForDb.conn = client;
  }

  return client;
}

export function getDb(): DrizzleDb {
  if (globalForDb.db) return globalForDb.db;

  const db = drizzle(getSqlClient());

  // Only cache local Node clients. Worker requests receive a fresh Hyperdrive
  // client so an isolate cannot retain database sockets across requests.
  try {
    if (!getCloudflareContext().env.HYPERDRIVE) {
      globalForDb.db = db;
    }
  } catch {
    globalForDb.db = db;
  }

  return db;
}
