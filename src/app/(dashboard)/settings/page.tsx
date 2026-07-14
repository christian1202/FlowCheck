import { getAdminSessionId } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    redirect('/login');
  }

  // Fetch current admin profile from DB
  const { data: user, error } = await getSupabaseAdmin()
    .from('admins')
    .select('*')
    .eq('id', adminId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!user) {
    // Failsafe in case of sync issues
    redirect('/login');
  }

  return (
    <div className="p-container-margin md:p-section-padding flex-1 fade-in-stagger w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display-md text-primary font-bold tracking-tight">Account Settings</h1>
        <p className="mt-2 text-on-surface-variant font-body-lg">
          Update your personal details and security preferences.
        </p>
      </div>

      <SettingsForm initialName={user.fullName || ''} email={user.email} />
    </div>
  );
}
