import { expect, test } from '@playwright/test';

// Section 4.3 / Phase 7's index.html port — the logged-out landing page. Doesn't need the
// Firebase emulators (no auth/Firestore calls on this route), just the dev server.

test.describe('marketing page', () => {
  test('renders the hero and links through to sign-up / sign-in', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Exam-style practice that actually matches your syllabus' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Get started free' }).first().click();
    await page.waitForURL('/sign-up');

    await page.goBack();
    await page.getByRole('banner').getByRole('link', { name: 'Sign in' }).click();
    await page.waitForURL('/sign-in');
  });

  test('the pricing CTA scrolls to the pricing section, and both plans link to sign-up', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'See pricing' }).click();
    await expect(page).toHaveURL(/#pricing$/);
    await expect(page.getByRole('heading', { name: 'One price. The whole question bank either way.' })).toBeInViewport();

    await expect(page.getByRole('link', { name: 'Go unlimited' })).toHaveAttribute('href', '/sign-up');
  });

  test('the FAQ accordion opens an answer on click', async ({ page }) => {
    await page.goto('/');

    const question = page.getByText('Is the question bank actually free?');
    const answer = page.getByText('Every subject, every topic, tutor mode and timed exams are free');
    await expect(answer).not.toBeInViewport();

    await question.click();
    await expect(answer).toBeVisible();
  });

  test('the theme toggle switches the marketing page too', async ({ page }) => {
    await page.goto('/');

    const initial = await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button', { name: /Switch to (dark|light) theme/ }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', initial ?? '');
  });
});
