import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Global cache for Cloudflare Workers isolate preservation (prevents TCP exhaustion)
const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
  drizzleInstance: ReturnType<typeof drizzle> | undefined;
};

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!globalForDb.drizzleInstance) {
      let connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error(
          "DATABASE_URL is not set. Make sure you've configured it as a Cloudflare secret:\n" +
          "  wrangler secret put DATABASE_URL"
        );
      }

      // Force the use of the transaction pooler (port 6543) instead of direct connection (port 5432)
      connectionString = connectionString.replace(':5432/', ':6543/');

      // Ensure pgbouncer=true and sslmode=require are appended for edge compatibility
      if (!connectionString.includes('pgbouncer=true')) {
        connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
      }
      if (!connectionString.includes('sslmode=require')) {
        connectionString += '&sslmode=require';
      }

      // Disable prefetch as it is not supported for "Transaction" pool mode (Supabase Supavisor)
      const client = postgres(connectionString, {
        prepare: false,
        idle_timeout: 1,
        max: 1
      });

      globalForDb.postgresClient = client;
      globalForDb.drizzleInstance = drizzle(client, { schema });
    }

    const value = (globalForDb.drizzleInstance as any)[prop];
    return typeof value === 'function' ? value.bind(globalForDb.drizzleInstance) : value;
  }
});

// Factory function for lazy initialization if needed
export function getDb() {
  return db;
}
