import { defineConfig } from 'vitest/config';

// Separate from vitest.config.ts (which only picks up tests/unit) so `pnpm test` never tries to
// run these against a non-existent emulator. Run via `pnpm test:rules`, which wraps this in
// `firebase emulators:exec`.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
