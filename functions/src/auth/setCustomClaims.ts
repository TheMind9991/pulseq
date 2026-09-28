import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const DEFAULT_ROLE = 'student';
const DEFAULT_TENANT_ID = 'pulseq-core';

// Section 3.7 / Phase 8: the concrete mechanism by which "a second tenant can be created without
// a data migration" — a tenant needs no provisioning step of its own, it comes into existence the
// first time any user's tenantId claim points at it. Idempotent (checked, not blindly
// set-with-merge) so it never clobbers branding an admin has since customized via the (not yet
// built) tenant-settings UI.
async function ensureTenantExists(tenantId: string): Promise<void> {
  const ref = getFirestore().collection('tenants').doc(tenantId);
  const snap = await ref.get();
  if (snap.exists) return;
  await ref.set({ name: tenantId, branding: {}, createdAt: FieldValue.serverTimestamp() });
}

// Mirrors users/{userId}.role and .tenantId into the Firebase Auth custom claim that
// firestore.rules and every server-side check actually trust (engineering spec Section 3.1 /
// Section 6) — this is the direct replacement for the old client-trusted "God Mode" role field.
//
// Client writes (onboarding, Section 5.1) are not allowed to set role/isPremium/premiumExpiresAt
// at all (see firestore.rules), so a freshly onboarded doc arrives here without a role. This
// function fills in the default via the Admin SDK, which bypasses those rules — that update
// re-triggers this same function once, at which point role/tenantId are present and the claim
// is set.
export const setCustomClaims = onDocumentWritten('users/{userId}', async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return; // doc deleted — nothing to mirror

  const data = after.data() as { role?: string; tenantId?: string };
  const userId = event.params.userId;

  if (!data.role || !data.tenantId) {
    await after.ref.update({
      role: data.role ?? DEFAULT_ROLE,
      tenantId: data.tenantId ?? DEFAULT_TENANT_ID,
    });
    return;
  }

  await ensureTenantExists(data.tenantId);

  const userRecord = await getAuth().getUser(userId);
  const currentClaims = userRecord.customClaims ?? {};
  if (currentClaims.role === data.role && currentClaims.tenantId === data.tenantId) {
    return; // already in sync — avoid a pointless token-invalidating claims write
  }

  await getAuth().setCustomUserClaims(userId, { role: data.role, tenantId: data.tenantId });
});
