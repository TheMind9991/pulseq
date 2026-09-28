import * as admin from 'firebase-admin';
import type { Page } from '@playwright/test';

// Shared by the Phase 5 admin e2e tests (bulk-upload-through-UI, review-queue). Signs up and
// onboards a brand-new student via the real UI, then promotes them to editor/admin directly
// through the Admin SDK — same approach exam-flow.spec.ts already uses to manipulate emulator
// state a normal UI flow can't reach. Signs out and back in afterwards because a custom claim
// change doesn't retroactively rewrite an already-issued session cookie; only a fresh sign-in
// mints a new ID token (and session cookie) that reflects the updated role (see DECISIONS.md).
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-pulseq' });
  }
  return admin;
}

export async function signUpOnboardAndPromote(
  page: Page,
  emailPrefix: string,
  role: 'editor' | 'admin',
): Promise<{ email: string; uid: string }> {
  const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'correct horse battery staple';

  await page.goto('/sign-up');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await page.waitForURL('/onboarding');
  await page.locator('#displayName').fill(`${emailPrefix} Test`);
  await page.locator('#faculty').selectOption('Faculty of Medicine, Cairo University (Kasr Al Ainy)');
  await page.locator('#academicYear').selectOption('3');
  await page.getByRole('checkbox', { name: 'Internal Medicine' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('/dashboard');

  const fbAdmin = getFirebaseAdmin();
  const userRecord = await fbAdmin.auth().getUserByEmail(email);
  await fbAdmin.firestore().collection('users').doc(userRecord.uid).update({ role });
  await fbAdmin.auth().setCustomUserClaims(userRecord.uid, { role, tenantId: 'pulseq-core' });

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('/sign-in');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');

  return { email, uid: userRecord.uid };
}
