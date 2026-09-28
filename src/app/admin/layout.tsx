import { redirect } from 'next/navigation';
import { getCurrentProfile, getServerUser } from '@/lib/auth/getServerUser';
import { getTenantName } from '@/lib/tenants/getTenantName';
import { AdminHeader } from '@/components/app/AdminHeader';

// Gated on the role custom claim (never a Firestore field — Section 6), same as every other
// server-side authorization check in this app. A signed-in student hitting /admin/* is bounced
// back to /dashboard rather than /sign-in, since they ARE authenticated, just not authorized.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const serverUser = await getServerUser();
  if (!serverUser) redirect('/sign-in');
  if (serverUser.role !== 'editor' && serverUser.role !== 'admin') redirect('/dashboard');

  const current = await getCurrentProfile();
  if (!current) redirect('/onboarding');

  const tenantName = serverUser.tenantId ? await getTenantName(serverUser.tenantId) : undefined;

  return (
    <div className="min-h-screen bg-base">
      <AdminHeader
        displayName={current.profile.displayName}
        isAdmin={serverUser.role === 'admin'}
        tenantName={tenantName}
      />
      <main>{children}</main>
    </div>
  );
}
