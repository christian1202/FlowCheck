import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Need to run via ts-node or compile. I'll just use raw postgres.js
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres"; 
// Wait, the Next.js app has a specific env variable set somewhere. I should read it from .env.local

import fs from 'fs';
let env = '';
try {
  env = fs.readFileSync('.env.local', 'utf-8');
} catch(e) {}

const dbUrlMatch = env.match(/DATABASE_URL="?([^"\n]+)"?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : connectionString;

const client = postgres(dbUrl, {
  prepare: true,
  fetch_types: false,
});

async function main() {
  try {
    const res = await client`select "event_id" from "event_admins" where "admin_id" = 'f2fc926a-81ae-4f88-a0fd-c6d1214bc4cd'`;
    console.log("Success:", res);
  } catch(e) {
    console.error("Error executing query:", e);
  } finally {
    await client.end();
  }
}
main();
