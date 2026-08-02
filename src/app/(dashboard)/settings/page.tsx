import { Suspense } from 'react';
import { connection } from 'next/server';
import { getAdminSessionId } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/settings/SettingsForm';

async function SettingsContent({ adminId }: { adminId: string }) {
  const db = getDb();
  
  // Project only required fields instead of SELECT *
  const [user] = await db
    .select({
      fullName: admins.fullName,
      email: admins.email,
    })
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="glass-panel p-6 md:p-8 rounded-3xl">
      <SettingsForm initialName={user.fullName || ''} email={user.email} />
    </div>
  );
}

export default async function SettingsPage() {
  await connection();
  const adminId = await getAdminSessionId();
  if (!adminId) {
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

      <Suspense fallback={
        <div className="glass-panel p-6 md:p-8 rounded-3xl animate-pulse space-y-4">
          <div className="h-10 bg-slate-800 rounded w-full"></div>
          <div className="h-10 bg-slate-800 rounded w-full"></div>
        </div>
      }>
        <SettingsContent adminId={adminId} />
      </Suspense>
    </div>
  );
}