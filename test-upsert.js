import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", url ? "Set" : "Not set");
console.log("Service Key:", serviceRoleKey ? "Set" : "Not set");

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});

async function run() {
  const { data, error } = await admin.from('admins').upsert({
    id: "00000000-0000-0000-0000-000000000000",
    email: "test@example.com",
    fullName: "Test Admin"
  }, { onConflict: 'id' });
  
  if (error) {
    console.log("Supabase Error:", error);
  } else {
    console.log("Success:", data);
  }
}
run().catch(console.error);
