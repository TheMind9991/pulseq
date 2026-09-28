import { defineConfig, devices } from '@playwright/test';

// Assumes the Firebase emulators (Auth + Firestore + Storage + Functions, the last built via
// `cd functions && pnpm build` first) are already running — see SETUP.md's "Emulator-only local
// dev" section — and that `.env.local` has NEXT_PUBLIC_USE_FIREBASE_EMULATORS set. Not wired into
// CI yet (would need the emulators started as part of the job); tracked as a follow-up rather
// than blocking on it — see DECISIONS.md.
//
// workers: 1 — every test shares one `pnpm dev` instance and one emulator suite (see webServer
// below), not one per worker, so concurrent test runs contend for the same single-instance
// server and Firestore/Auth emulators. Confirmed empirically: a dashboard assertion that passed
// reliably alone started intermittently failing at workers: 2 under this sandbox's CPU limits,
// purely from that contention, not a real bug. Revisit once this is wired into CI with a
// per-worker server/emulator setup.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Unset by default — Playwright resolves its own downloaded browser. Only needed in
        // environments with a pre-installed browser at a fixed, version-mismatched path.
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
