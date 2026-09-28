import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppHeader } from '@/components/app/AppHeader';
import type { UserDoc } from '@/types';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const serverUser = await getServerUser();
  if (!serverUser) redirect('/sign-in');

  // Checked directly against Firestore (trusted admin-SDK read, bypasses rules) rather than
  // the role custom claim, since the claim may not have propagated yet immediately after
  // onboarding writes the doc (setCustomClaims.ts runs async on the Cloud Function trigger).
  const snapshot = await getAdminDb().collection('users').doc(serverUser.uid).get();
  if (!snapshot.exists) redirect('/onboarding');

  const profile = snapshot.data() as UserDoc;

  return (
    <div className="min-h-screen bg-base">
      <AppHeader displayName={profile.displayName} />
      <main>{children}</main>
    </div>
  );
}
