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

export function getDb(): DrizzleDb {
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
  if (!hyperdrive && globalForDb.db) {
    return globalForDb.db;
  }

  const client = postgres(connectionString, {
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

  const db = drizzle(client);

  if (!hyperdrive) {
    globalForDb.conn = client;
    globalForDb.db = db;
  }

  return db;
}
