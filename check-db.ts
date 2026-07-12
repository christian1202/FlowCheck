import { db } from './src/lib/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const res = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tables:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
