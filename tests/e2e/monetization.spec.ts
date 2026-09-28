import * as admin from 'firebase-admin';
import { expect, test } from '@playwright/test';

// Section 7: daily caps (7.2/7.3), ad placement/graceful degradation (7.1). Requires the Firebase
// emulators running — see SETUP.md's "Emulator-only local dev" section.

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-pulseq' });
  }
  return admin;
}

async function signUpAndOnboard(page: import('@playwright/test').Page, emailPrefix: string) {
  const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto('/sign-up');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('correct horse battery staple');
  await page.getByRole('button', { name: 'Sign up' }).click();

  await page.waitForURL('/onboarding');
  await page.locator('#displayName').fill(`${emailPrefix} Test`);
  await page.locator('#faculty').selectOption('Faculty of Medicine, Cairo University (Kasr Al Ainy)');
  await page.locator('#academicYear').selectOption('3');
  await page.getByRole('checkbox', { name: 'Internal Medicine' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('/dashboard');

  const userRecord = await getFirebaseAdmin().auth().getUserByEmail(email);
  return userRecord.uid;
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function seedDailyUsage(uid: string, usage: { questionsAnswered?: number; examSeconds?: number }) {
  const db = getFirebaseAdmin().firestore();
  await db
    .collection('dailyUsage')
    .doc(`${uid}_${todayDateKey()}`)
    .set({
      userId: uid,
      date: todayDateKey(),
      questionsAnswered: usage.questionsAnswered ?? 0,
      examSeconds: usage.examSeconds ?? 0,
      updatedAt: new Date(),
    });
}

async function setPremium(uid: string, isPremium: boolean) {
  // isPremium is read from a trusted Firestore doc (getCurrentProfile), not the Auth custom
  // claim, so unlike a role change this takes effect on the very next request — no sign-out/in
  // needed (see DECISIONS.md).
  await getFirebaseAdmin().firestore().collection('users').doc(uid).update({ isPremium });
}

test.describe('daily usage caps', () => {
  test('a free user at the 100-question cap is blocked from starting a new tutor session', async ({ page }) => {
    const uid = await signUpAndOnboard(page, 'cap-questions');
    await seedDailyUsage(uid, { questionsAnswered: 100 });

    await page.goto('/practice');
    await page.getByRole('button', { name: 'Internal Medicine' }).click();
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByText("You've hit today's 100-question limit")).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go unlimited →' })).toBeVisible();
    await expect(page).toHaveURL('/practice'); // never navigated into a session
  });

  test('a free user at the 60-minute cap is blocked from starting a new timed exam', async ({ page }) => {
    const uid = await signUpAndOnboard(page, 'cap-examtime');
    await seedDailyUsage(uid, { examSeconds: 3600 });

    await page.goto('/exams');
    await page.getByRole('button', { name: 'Internal Medicine' }).click();
    await page.getByRole('button', { name: 'Start exam' }).click();

    await expect(page.getByText("You've used today's 60-minute exam-mode limit")).toBeVisible();
    await expect(page).toHaveURL('/exams');
  });

  test('a premium user bypasses both caps and sees no ad slot', async ({ page }) => {
    const uid = await signUpAndOnboard(page, 'premium-user');
    await seedDailyUsage(uid, { questionsAnswered: 100, examSeconds: 3600 });
    await setPremium(uid, true);

    await page.goto('/dashboard');
    await expect(page.getByTestId('ad-slot')).toHaveCount(0);

    await page.goto('/practice');
    await expect(page.getByTestId('ad-slot')).toHaveCount(0);
    await page.getByRole('button', { name: 'Internal Medicine' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForURL(/\/practice\/[^/]+$/); // not blocked, despite being at the cap
  });
});

test.describe('ad slot graceful degradation', () => {
  test('a blocked/failed ad script leaves the layout intact (free user)', async ({ page }) => {
    await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort());

    await signUpAndOnboard(page, 'adblock-user');

    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/dashboard');
    // The reserved-space container is always present for a free user, ad or no ad.
    await expect(page.getByTestId('ad-slot')).toBeVisible();
    // No ad ever renders inside it (the script never loaded), but the rest of the page is fine.
    await expect(page.getByTestId('ad-slot').locator('ins.adsbygoogle')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});
