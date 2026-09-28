import { expect, test } from '@playwright/test';

// The full happy-path E2E test called for by engineering spec Section 9: sign-up -> onboarding
// -> start a practice session -> answer every question -> session marked completedAt. Requires
// the Firebase emulators running and the app pointed at them (see SETUP.md's "Emulator-only
// local dev" section, and playwright.config.ts's header comment) — not yet wired into CI.
// The "see it reflected on the dashboard" portion from Section 9's description is deferred until
// Phase 3 builds the real dashboard (Phase 1/2's is an empty shell, per its own done-when).

test('sign-up -> onboarding -> practice session -> completion', async ({ page }) => {
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
});
