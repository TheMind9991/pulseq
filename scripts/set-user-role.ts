/**
 * Bootstraps the first admin/editor for a tenant. The /admin/users role-change UI (Section 10
 * Phase 5) needs an existing admin to reach it in the first place — this script breaks that
 * chicken-and-egg problem from the command line instead.
 *
 * Run with: pnpm set-user-role <email> <student|editor|admin>
 *
 * Honors FIRESTORE_EMULATOR_HOST/FIREBASE_AUTH_EMULATOR_HOST the same way scripts/seed-firestore.ts
 * does. Writes both the users/{uid}.role Firestore field (the source of truth — see
 * functions/src/auth/setCustomClaims.ts) and the Auth custom claim directly, so this works
 * immediately even if the setCustomClaims trigger isn't deployed/running yet.
 */
import * as admin from 'firebase-admin';

const VALID_ROLES = ['student', 'editor', 'admin'] as const;
type Role = (typeof VALID_ROLES)[number];

function isValidRole(value: string): value is Role {
  return (VALID_ROLES as readonly string[]).includes(value);
}

async function main() {
  const [email, roleArg] = process.argv.slice(2);
  if (!email || !roleArg || !isValidRole(roleArg)) {
    console.error(`Usage: pnpm set-user-role <email> <${VALID_ROLES.join('|')}>`);
    process.exit(1);
  }
  const role: Role = roleArg;

  const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
  if (usingEmulator) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-pulseq' });
    console.log(`Setting role via emulator(s) at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing Firebase admin credentials, and no emulator env vars are set. Set ' +
          'FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or run against the ' +
          'emulator (see SETUP.md).',
      );
    }
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
    console.log(`Setting role on project ${projectId}.`);
  }

  const auth = admin.auth();
  const db = admin.firestore();

  const userRecord = await auth.getUserByEmail(email);
  const userRef = db.collection('users').doc(userRecord.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new Error(`No users/${userRecord.uid} Firestore doc — has ${email} finished onboarding yet?`);
  }
  const tenantId = (userSnap.data() as { tenantId?: string }).tenantId ?? 'pulseq-core';

  await userRef.update({ role });
  await auth.setCustomUserClaims(userRecord.uid, { role, tenantId });

  console.log(`Set ${email} (${userRecord.uid}) to role "${role}" in tenant "${tenantId}".`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
