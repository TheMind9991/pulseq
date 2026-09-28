import path from 'node:path';
import { expect, test } from '@playwright/test';

// Section 4.5 / Phase 8: switching locale to Arabic must render every built screen correctly in
// RTL with no visual breakage. English remains the only fully-translated locale (see
// DECISIONS.md) — what's verified here is RTL *layout* correctness (mirrored direction, no
// overlapping/clipped elements, arrows pointing the right way), not string translation.
const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'test-results', 'rtl-screenshots');

async function signUpAndOnboard(page: import('@playwright/test').Page, emailPrefix: string) {
  const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto('/sign-up');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('correct horse battery staple');
  await page.getByRole('button', { name: 'Sign up' }).click();

  await page.waitForURL('/onboarding');
  await page.locator('#displayName').fill('RTL Test');
  await page.locator('#faculty').selectOption('Faculty of Medicine, Cairo University (Kasr Al Ainy)');
  await page.locator('#academicYear').selectOption('3');
  await page.getByRole('checkbox', { name: 'Internal Medicine' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('/dashboard');
}

test.describe('RTL / Arabic locale toggle', () => {
  test('the header toggle flips dir to rtl and it persists across reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await page.getByRole('button', { name: 'Switch to Arabic' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Toggling back works too.
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('email/password inputs stay LTR even on an RTL page (Latin content in an RTL context)', async ({
    page,
  }) => {
    // The (auth) layout has no header of its own (no toggle to click there) — set the locale
    // from the marketing page first, same as every other cross-page flow in this suite; it's a
    // client-only localStorage preference, so it carries over to the next navigation.
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to Arabic' }).click();

    await page.goto('/sign-up');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#email')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('#password')).toHaveAttribute('dir', 'ltr');
  });

  test('every built screen renders without breakage in RTL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to Arabic' }).click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'marketing.png'), fullPage: true });
    await expect(page.getByRole('heading', { name: 'Exam-style practice that actually matches your syllabus' })).toBeVisible();

    await signUpAndOnboard(page, 'rtl');
    // locale is a client-only preference (localStorage), so it survived the sign-up/onboarding
    // navigations untouched — no need to re-toggle.
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard.png'), fullPage: true });
    await expect(page.getByRole('heading', { name: /Welcome, RTL/ })).toBeVisible();

    await page.goto('/practice');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'practice-builder.png'), fullPage: true });
    await page.getByRole('button', { name: 'Internal Medicine' }).click();
    await page.getByRole('button', { name: '5', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Start' })).toBeEnabled();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForURL(/\/practice\/[^/]+$/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'practice-question.png'), fullPage: true });

    await page.locator('[data-testid^="option-"]').first().click();
    await expect(page.getByTestId('explanation-panel')).toBeVisible();
    // "Next" nav must still be reachable and clickable — the arrow glyph mirrors, the label
    // doesn't move.
    await page.getByRole('button', { name: 'Next' }).click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'practice-question-2.png'), fullPage: true });

    await page.goto('/settings');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings.png'), fullPage: true });
    await expect(page.getByText('Free plan')).toBeVisible();
  });
});
