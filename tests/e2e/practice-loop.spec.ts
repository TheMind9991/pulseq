import { expect, test } from '@playwright/test';

// The full happy-path E2E test called for by engineering spec Section 9: sign-up -> onboarding
// -> start a practice session -> answer every question -> see it reflected on the dashboard.
// Requires the Firebase emulators (including Functions, for recomputeTopicStats) running and the
// app pointed at them — see SETUP.md's "Emulator-only local dev" section, and
// playwright.config.ts's header comment. Not yet wired into CI.

test('sign-up -> onboarding -> practice session -> completion -> dashboard', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'correct horse battery staple';

  await page.goto('/sign-up');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await page.waitForURL('/onboarding');
  await page.locator('#displayName').fill('E2E Test Student');
  await page.locator('#faculty').selectOption('Faculty of Medicine, Cairo University (Kasr Al Ainy)');
  await page.locator('#academicYear').selectOption('3');
  await page.getByRole('checkbox', { name: 'Internal Medicine' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL('/dashboard');
  await expect(page.getByRole('heading', { name: /Welcome, E2E/ })).toBeVisible();
  // Empty shell, pre-Phase-3 baseline: no questions answered yet.
  await expect(page.getByTestId('stat-questions-answered')).toHaveText('0');

  await page.getByRole('link', { name: 'Practice' }).click();
  await page.waitForURL('/practice');

  await page.getByRole('button', { name: 'Internal Medicine' }).click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: 'Start' }).click();

  await page.waitForURL(/\/practice\/[^/]+$/);

  const questionCount = 5;
  for (let i = 0; i < questionCount; i++) {
    await page.locator('[data-testid^="option-"]').first().click();
    await expect(page.getByTestId('explanation-panel')).toBeVisible();
    if (i < questionCount - 1) {
      await page.getByRole('button', { name: 'Next →' }).click();
    }
  }

  const banner = page.getByTestId('session-complete-banner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(`/ ${questionCount} correct`);

  // recomputeTopicStats (Cloud Function) runs asynchronously off the last submitAnswer write, and
  // the dashboard is server-rendered (no live client-side re-fetch) — so poll with reloads rather
  // than a single navigation, since the first load can legitimately race the function.
  await expect
    .poll(
      async () => {
        await page.goto('/dashboard');
        return page.getByTestId('stat-questions-answered').textContent();
      },
      { timeout: 20_000, intervals: [500, 1000, 1000, 2000] },
    )
    .toBe(String(questionCount));

  await expect(page.getByTestId('stat-weakest-topic')).not.toHaveText('—');
  // The Recharts bar chart's accessible table mirror — confirms real per-topic rows rendered,
  // not the "answer a few questions" empty state.
  await expect(page.getByText('Answer a few questions to see your accuracy by topic here.')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'Completed' })).toBeVisible();
});
