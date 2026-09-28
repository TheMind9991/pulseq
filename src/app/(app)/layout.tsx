import { redirect } from 'next/navigation';
import { getCurrentProfile, getServerUser } from '@/lib/auth/getServerUser';
import { AppHeader } from '@/components/app/AppHeader';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const serverUser = await getServerUser();
  if (!serverUser) redirect('/sign-in');

  const current = await getCurrentProfile(); // re-uses getServerUser's cached result
  if (!current) redirect('/onboarding');

  return (
    <div className="min-h-screen bg-base">
      <AppHeader displayName={current.profile.displayName} />
      <main>{children}</main>
    </div>
  );
}
