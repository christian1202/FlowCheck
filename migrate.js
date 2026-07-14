import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  let connectionString = process.env.DATABASE_URL;
  connectionString = connectionString.replace(':6543/', ':5432/');
  connectionString = connectionString.replace('pgbouncer=true', '');
  console.log("Connecting directly to port 5432 for migration...");
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log("Migration complete!");
  process.exit(0);
}
run().catch(console.error);
