import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';

const DEFAULT_ROLE = 'student';
const DEFAULT_TENANT_ID = 'pulseq-core';

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

  const userRecord = await getAuth().getUser(userId);
  const currentClaims = userRecord.customClaims ?? {};
  if (currentClaims.role === data.role && currentClaims.tenantId === data.tenantId) {
    return; // already in sync — avoid a pointless token-invalidating claims write
  }

  await getAuth().setCustomUserClaims(userId, { role: data.role, tenantId: data.tenantId });
});
