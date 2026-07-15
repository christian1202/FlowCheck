import { getAdminSessionId } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
  const db = getDb();
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }

  // Fetch current admin profile from DB using Drizzle
  const [user] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  if (!user) {
    // Failsafe in case of sync issues
    redirect('/login');
  }

  return (
    <div className="p-4 md:p-8 lg:p-12 flex-1 fade-in-stagger w-full max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="font-display-lg-mobile md:font-display-lg text-primary tracking-tight">Account Settings</h1>
        <p className="font-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Update your personal details and security preferences.
        </p>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-3xl">
        <SettingsForm initialName={user.fullName || ''} email={user.email} />
      </div>
    </div>
  );
}