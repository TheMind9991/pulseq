'use server';

import { revalidatePath } from 'next/cache';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getServerUser } from '@/lib/auth/getServerUser';
import { userRoleSchema } from '@/lib/schemas/user';
import type { UserDoc } from '@/types';

type ActionResult = { ok: true } | { error: string };

const ASSIGNABLE_ROLES = ['student', 'editor', 'admin'] as const;

// Role management is admin-only (not editor) — editors manage content, only admins manage who
// can manage content. Writes users/{userId}.role via the Admin SDK, which bypasses
// firestore.rules (the rule explicitly forbids a client from ever setting its own role) — that
// write is what functions/src/auth/setCustomClaims.ts mirrors into the Auth custom claim the
// rest of the app actually trusts.
export async function changeUserRole(userId: string, role: string): Promise<ActionResult> {
  const serverUser = await getServerUser();
  if (!serverUser) return { error: 'You must be signed in.' };
  if (serverUser.role !== 'admin') return { error: 'Only admins can change roles.' };
  if (!serverUser.tenantId) return { error: 'Missing tenant.' };

  const parsedRole = userRoleSchema.safeParse(role);
  if (!parsedRole.success || !ASSIGNABLE_ROLES.includes(parsedRole.data as (typeof ASSIGNABLE_ROLES)[number])) {
    return { error: 'Invalid role.' };
  }

  if (userId === serverUser.uid && parsedRole.data !== 'admin') {
    return { error: 'You cannot remove your own admin role.' };
  }

  const db = getAdminDb();
  const userRef = db.collection('users').doc(userId);
  const snap = await userRef.get();
  if (!snap.exists) return { error: 'User not found.' };
  const existing = snap.data() as UserDoc;
  if (existing.tenantId !== serverUser.tenantId) return { error: 'User not found.' };

  await userRef.update({ role: parsedRole.data });
  await getAdminAuth().setCustomUserClaims(userId, { role: parsedRole.data, tenantId: existing.tenantId });

  revalidatePath('/admin/users');
  return { ok: true };
}
