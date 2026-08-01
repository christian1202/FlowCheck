/* eslint-disable @typescript-eslint/no-var-requires */
const postgres = require('postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const connectionString = process.env.DATABASE_URL.replace(':5432/', ':6543/') + '?pgbouncer=true';
  const sql = postgres(connectionString);

  try {
    console.log('Adding map_link column to events table...');
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS map_link TEXT;`;
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

migrate();
