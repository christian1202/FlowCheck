import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// connection string
const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode (Supabase Supavisor)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
