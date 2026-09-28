import { getServerUser } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import type { UserDoc } from '@/types';

// Empty shell for Phase 1 (Section 10, Phase 1 done-when: "land on an empty /dashboard shell").
// Real stat cards / topic accuracy / session history land in Phase 3 once userTopicStats and
// sessions exist (Section 5.4).
export default async function DashboardPage() {
  const serverUser = await getServerUser();
  if (!serverUser) return null; // AppLayout already redirects unauthenticated requests

  const snapshot = await getAdminDb().collection('users').doc(serverUser.uid).get();
  const profile = snapshot.data() as UserDoc;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-primary">Welcome, {profile.displayName.split(' ')[0]}</h1>
      <p className="mt-2 text-secondary">
        {profile.faculty} &middot; Year {profile.academicYear}
      </p>
      <div className="mt-8 rounded-lg border border-dashed border-subtle p-8 text-center text-muted">
        Your practice history and topic accuracy will show up here once you start answering
        questions.
      </div>
    </div>
  );
}
