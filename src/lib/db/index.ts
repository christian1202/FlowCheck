import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// connection string
let connectionString = process.env.DATABASE_URL!;

if (connectionString) {
  // Force the use of the transaction pooler (port 6543) instead of direct connection (port 5432)
  connectionString = connectionString.replace(':5432/', ':6543/');
  
  // Ensure pgbouncer=true and sslmode=require are appended for edge compatibility
  if (!connectionString.includes('pgbouncer=true')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }
  if (!connectionString.includes('sslmode=require')) {
    connectionString += '&sslmode=require';
  }
}

// Global cache for Cloudflare Workers isolate preservation (prevents TCP exhaustion)
const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

// Disable prefetch as it is not supported for "Transaction" pool mode (Supabase Supavisor)
// We set max: 1 and idle_timeout: 1 to gracefully clean up TCP sockets during cold-starts or worker suspensions
const client = globalForDb.postgresClient ?? postgres(connectionString, { 
  prepare: false, 
  idle_timeout: 1, 
  max: 1 
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
} else {
  // In edge environments, we explicitly preserve the client on globalThis to survive suspend/resume
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });

// Factory function for lazy initialization if needed
export function getDb() {
  return db;
}
