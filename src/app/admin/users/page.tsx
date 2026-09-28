import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { RoleSelect } from '@/components/admin/RoleSelect';
import { changeUserRole } from '@/app/admin/users/actions';
import type { UserDoc } from '@/types';

// Admin-only, not editor — role management is a platform-administration concern, separate from
// the content-management access AdminLayout already gates on.
export default async function AdminUsersPage() {
  const serverUser = await getServerUser();
  if (!serverUser?.tenantId) return null; // AdminLayout already redirects otherwise
  if (serverUser.role !== 'admin') redirect('/admin');

  const db = getAdminDb();
  const snapshot = await db
    .collection('users')
    .where('tenantId', '==', serverUser.tenantId)
    .orderBy('displayName', 'asc')
    .limit(200)
    .get();
  const users = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as UserDoc) }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-primary">Users</h1>

      <div className="overflow-hidden rounded-lg border border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle text-start text-secondary">
              <th scope="col" className="px-4 py-3 font-medium">
                Name
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Role
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-subtle last:border-0">
                <td className="px-4 py-3 text-primary">{user.displayName}</td>
                <td className="px-4 py-3 text-secondary">{user.email}</td>
                <td className="px-4 py-3">
                  <RoleSelect
                    userId={user.id}
                    currentRole={user.role}
                    disabled={user.id === serverUser.uid}
                    onChangeRole={changeUserRole}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
