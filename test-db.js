import dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config();

let connectionString = process.env.DATABASE_URL;
connectionString = connectionString.replace(':5432/', ':6543/');
if (!connectionString.includes('pgbouncer=true')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
}
if (!connectionString.includes('sslmode=require')) {
  connectionString += '&sslmode=require';
}

console.log("Connecting to:", connectionString);

const client = postgres(connectionString, {
  prepare: false,
  idle_timeout: 1,
  max: 1
});

async function run() {
  try {
    const result = await client`SELECT 1 as num`;
    console.log("Success:", result);
  } catch (err) {
    console.error("Error connecting to DB:", err);
  } finally {
    await client.end();
  }
}

run();
