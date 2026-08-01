import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();
let connectionString = process.env.DATABASE_URL;
connectionString = connectionString.replace(':6543/', ':5432/');
connectionString = connectionString.replace('pgbouncer=true', '');
const client = postgres(connectionString, { max: 1 });
async function run() {
  const result = await client`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log("Tables:", result.map(r => r.table_name));
  process.exit(0);
}
run().catch(console.error);
