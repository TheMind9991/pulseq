import * as admin from 'firebase-admin';
import { expect, test } from '@playwright/test';

// Section 5.3 / Phase 4 done-when: "a full timed exam can be started, timed out or submitted
// early, and reviewed with all explanations visible." Requires the Firebase emulators running —
// see SETUP.md's "Emulator-only local dev" section. Not yet wired into CI (see DECISIONS.md).

async function signUpAndOnboard(page: import('@playwright/test').Page, emailPrefix: string) {
  const email = `${emailPrefix}-${Date.now()}@example.com`;
  await page.goto('/sign-up');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('correct horse battery staple');
  await page.getByRole('button', { name: 'Sign up' }).click();

  await page.waitForURL('/onboarding');
  await page.locator('#displayName').fill('Exam Test Student');
  await page.locator('#faculty').selectOption('Faculty of Medicine, Cairo University (Kasr Al Ainy)');
  await page.locator('#academicYear').selectOption('3');
  await page.getByRole('checkbox', { name: 'Internal Medicine' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('/dashboard');
}

test.describe('timed exam', () => {
  test('submitted early: hides feedback while in progress, reveals everything on the review screen', async ({
    page,
  }) => {
    await signUpAndOnboard(page, 'exam-early');

    await page.getByRole('link', { name: 'Exams' }).click();
    await page.waitForURL('/exams');

    await page.getByRole('button', { name: 'Internal Medicine' }).click();
    await page.getByRole('button', { name: '5', exact: true }).click();
    await page.getByRole('button', { name: '15 min' }).click();
    await page.getByRole('button', { name: 'Start exam' }).click();

    await page.waitForURL(/\/exams\/[^/]+$/);
    await expect(page.getByTestId('exam-countdown')).toBeVisible();

    // Answer the first question — no explanation, no correct/incorrect coloring while in progress.
    await page.locator('[data-testid^="option-"]').first().click();
    await expect(page.getByTestId('explanation-panel')).toHaveCount(0);
    const firstOption = page.locator('[data-testid^="option-"]').first();
    await expect(firstOption).toBeEnabled(); // still changeable, unlike tutor mode

    // Leave the remaining questions unanswered and submit early.
    await page.getByTestId('submit-exam-button').click();

    await expect(page.getByTestId('exam-score-banner')).toBeVisible();
    await expect(page.getByTestId('exam-score-banner')).toContainText('/ 5 correct');
    // Every question — including the 4 left blank — shows an explanation on the review screen.
    await expect(page.getByTestId('explanation-panel')).toHaveCount(5);
  });

  test('auto-submits and shows the review screen once time has run out', async ({ page }) => {
    await signUpAndOnboard(page, 'exam-timeout');

    await page.getByRole('link', { name: 'Exams' }).click();
    await page.waitForURL('/exams');

    await page.getByRole('button', { name: 'Internal Medicine' }).click();
    await page.getByRole('button', { name: '5', exact: true }).click();
    await page.getByRole('button', { name: '15 min' }).click();
    await page.getByRole('button', { name: 'Start exam' }).click();

    await page.waitForURL(/\/exams\/[^/]+$/);
    const sessionId = page.url().split('/').pop()!;

    // Rather than waiting out a real 15-minute timer, fast-forward it by rewriting startedAt
    // directly in the emulator — the same server-side expiry check saveExamAnswer/the page use
    // either way, just reached without a multi-minute test.
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-pulseq' });
    }
    const db = admin.firestore();
    await db
      .collection('sessions')
      .doc(sessionId)
      .update({
        startedAt: admin.firestore.Timestamp.fromMillis(Date.now() - 16 * 60 * 1000),
      });

    await page.reload();

    await expect(page.getByTestId('exam-score-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('exam-score-banner')).toContainText('/ 5 correct');
  });
});
