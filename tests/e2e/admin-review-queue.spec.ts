import { expect, test } from '@playwright/test';
import { signUpOnboardAndPromote } from './helpers/adminAuth';

// Section 5.6's core content-quality guarantee: the author of a question can never be the one who
// publishes it. Exercised through the real UI+rules stack (not just the unit-level firestore
// rules test), with two separate editor accounts in two separate browser contexts — mirrors how
// exam-flow.spec.ts uses Admin SDK writes to reach emulator state a normal UI flow can't.
test('review queue: the author cannot publish their own question, a different editor can', async ({ browser }) => {
  const authorContext = await browser.newContext();
  const authorPage = await authorContext.newPage();
  await signUpOnboardAndPromote(authorPage, 'author', 'editor');

  const reviewerContext = await browser.newContext();
  const reviewerPage = await reviewerContext.newPage();
  await signUpOnboardAndPromote(reviewerPage, 'reviewer', 'editor');

  // Author creates a draft question.
  await authorPage.goto('/admin/questions/new');
  await authorPage.locator('#stem').fill('Which artery is most commonly occluded in an inferior STEMI?');
  const optionTexts = authorPage.locator('input[placeholder="Option text"]');
  await optionTexts.nth(0).fill('Right coronary artery');
  await optionTexts.nth(1).fill('Left anterior descending artery');
  await optionTexts.nth(2).fill('Left circumflex artery');
  await optionTexts.nth(3).fill('Left main coronary artery');
  // Explicitly check option A as correct rather than relying on the form's uncontrolled radio
  // defaultValues — the DOM's initial checked state is what actually gets submitted.
  await authorPage.locator('input[type="radio"]').first().check();
  await authorPage.locator('#correctExplanation').fill('The RCA supplies the inferior wall in most people.');
  await authorPage.locator('#subject').fill('Internal Medicine');
  await authorPage.locator('#topic').fill('Cardiology');
  await authorPage.locator('#tagsRaw').fill('Internal Medicine, Cardiology');
  await authorPage.getByRole('button', { name: 'Create draft' }).click();

  // Not `waitForURL(/\/admin\/questions\/[^/]+$/)` — that regex also matches the /new route
  // itself ("new" satisfies `[^/]+` too), so it can resolve before the actual navigation away
  // from /admin/questions/new happens. Waiting for the review panel's draft status is
  // unambiguous: it only renders on the detail page.
  await expect(authorPage.getByText('Status: draft')).toBeVisible();
  const questionUrl = authorPage.url();

  await authorPage.getByRole('button', { name: 'Submit for review' }).click();
  await expect(authorPage.getByText('Status: in review')).toBeVisible();

  // The author's own Publish button is disabled — the UI's first line of defense; the real
  // enforcement is firestore.rules (see firestore.rules.test.ts's questions/{questionId} suite).
  const authorPublishButton = authorPage.getByRole('button', { name: 'Publish' });
  await expect(authorPublishButton).toBeDisabled();
  await expect(authorPage.getByText("You authored this question")).toBeVisible();

  // A different editor opens the same question and can publish it.
  await reviewerPage.goto(questionUrl);
  await expect(reviewerPage.getByText('Status: in review')).toBeVisible();
  await reviewerPage.getByRole('button', { name: 'Publish' }).click();
  await expect(reviewerPage.getByText('Status: published')).toBeVisible();

  // Reflected back on the author's side too once they reload.
  await authorPage.reload();
  await expect(authorPage.getByText('Status: published')).toBeVisible();
});
