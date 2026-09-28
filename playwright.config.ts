import { defineConfig, devices } from '@playwright/test';

// Assumes the Firebase emulators (Firestore + Auth) are already running — see SETUP.md's
// "Emulator-only local dev" section — and that `.env.local` has NEXT_PUBLIC_USE_FIREBASE_EMULATORS
// set. Not wired into CI yet (would need the emulators started as part of the job); tracked as a
// follow-up rather than blocking Phase 2 on it — see DECISIONS.md.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
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
