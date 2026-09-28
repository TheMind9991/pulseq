# Decisions log

Judgment calls made during the build where the engineering spec (`PulseQ_Engineering_PRD.md`)
didn't specify an exact choice, per its own Section 0 instruction to record and continue rather
than stall. Newest entries at the bottom of each phase's section.

## Phase 1 — Foundation

- **Design tokens are placeholders.** `pulseq-site.zip` (the design system source of truth,
  Section 4.1) was not provided with this build — only the two PRD markdown files, and later
  `Copy_of_End_round_IM_193.xlsx`. `src/styles/globals.css` and `tailwind.config.ts` currently
  hold a conventional, reasonable placeholder token set (dark-default + light theme, spacing,
  radii, shadows, type scale) so Phase 1 wasn't blocked on it. **When the real zip is provided,
  replace the token block in `globals.css` verbatim with `css/tokens.css`'s contents** — the
  Tailwind config's `extend.colors`/`borderRadius`/`boxShadow`/`fontSize` already point at CSS
  custom properties by name, so as long as the real file defines the same variable names
  (`--color-accent`, `--color-text-primary`, etc. — rename to match if the real file uses
  different names), no component code needs to change. Same applies to `js/theme.js` →
  `ThemeToggle.tsx` / the inline script in `src/app/layout.tsx`, which were re-implemented from
  the spec's description (localStorage + `prefers-color-scheme` fallback + blocking inline
  script) rather than ported line-for-line, since the source file wasn't available either.
- **No visual component port yet.** `components/marketing/*`, `components/quiz/*`,
  `components/dashboard/*` (Section 4.3) are not built — Phase 1 only needed a functional
  sign-up/sign-in/onboarding flow and an empty dashboard shell. The marketing landing page is a
  bare placeholder, not the `index.html` port (that's explicitly Phase 7).
- **Session strategy: Firebase session cookies, not client-only auth state.** The spec doesn't
  specify how server components/route gating authenticate. Chose the standard Next.js App
  Router + Firebase Auth pattern: client signs in with the Firebase JS SDK, then POSTs the ID
  token to `/api/auth/session` (`src/app/api/auth/session/route.ts`), which mints an httpOnly
  session cookie via `adminAuth.createSessionCookie`. Server components read it via
  `getServerUser()` (`src/lib/auth/getServerUser.ts`). `AuthSync.tsx` keeps the cookie in sync
  on token refresh / sign-out. This avoids shipping ID tokens to client-readable storage and is
  the conventional choice for SSR route gating with Firebase.
- **Onboarding-completion signal = Firestore doc existence, not a boolean flag.** Section 5.1
  says onboarding "creates" the `users/{uid}` doc; there's no separate `onboardingCompletedAt`
  field in the Section 3.1 schema. `(app)/layout.tsx` gates on whether the doc exists at all
  (checked server-side via the Admin SDK, not via the custom claim, since the claim only
  propagates after `setCustomClaims.ts`'s Cloud Function trigger runs — an async delay a
  doc-existence check avoids).
- **`displayName` captured during onboarding, not sign-up.** The `users/{uid}` schema (Section
  3.1) requires `displayName`, but the spec's sign-up flow (Section 5.1) only collects
  email/password (or Google, which already has a name). Added a "Full name" field to the
  onboarding form, pre-filled from the Firebase Auth profile when available (Google sign-in).
- **Faculty / academic year / modules are a hardcoded list**, per Section 5.1's explicit
  "hardcoded list for v1" option — see `src/lib/constants/curriculum.ts`. The faculty list and
  module list are a reasonable starting set (Kasr Al Ainy + a few other named Egyptian
  faculties from the product PRD; common preclinical/clinical module names) and should be
  reviewed by the product owner before real users sign up — not sourced from real curriculum
  data.
- **Deployment target: not yet decided.** Section 1 says to pick Vercel+Firebase or Firebase
  Hosting with Next.js SSR "whichever the agent's environment supports out of the box." No
  deployment was attempted in this session (no hosting credentials configured) — deferred to
  whenever the user is ready to deploy; both remain viable, Vercel is the more common pairing
  for Next.js + Firebase-as-backend-only and is the tentative default absent a stated
  preference.
- **`firestore.rules` written in full (Section 6), not just the Phase 1 subset.** Cheap to write
  once collections' shapes were already fixed by Section 3, even though `questions`, `sessions`,
  `userTopicStats` etc. have no documents yet. **`firestore.rules.test.ts` coverage is Phase-1
  scoped on purpose** (only `users/{uid}` and `dailyUsage/{docId}`, per the Phase 1 done-when
  checklist) — add tests for `questions`, `sessions`, `userQuestionStats`, `errorReports`,
  `tenants` as the phases that populate those collections land, per Section 6's full test list.
- **No `middleware.ts`.** Route protection is done at the layout level
  (`(app)/layout.tsx` redirects), which is simpler and sufficient for the routes that exist so
  far. Revisit if a later phase needs edge-level gating (e.g. redirecting before any server
  component runs, for perf).
- **CI runs `pnpm build`, `pnpm test`, and `pnpm test:rules`** (`.github/workflows/ci.yml`), per
  Section 12. The Firestore rules tests run against the Firestore emulator, which needs Java —
  GitHub-hosted `ubuntu-latest` runners ship a JDK already, and `firebase-tools` is a root
  devDependency, so no extra setup step was needed beyond `pnpm install`. No real Firebase
  project credentials are required for any of the three CI steps (the emulator is self-contained,
  and `pnpm build` no longer needs live `NEXT_PUBLIC_FIREBASE_*` values — see the
  `src/lib/firebase/client.ts` SSR guard below).
- **`src/lib/firebase/client.ts` guards Auth/Firestore/Storage construction behind
  `typeof window !== 'undefined'`.** Every consumer of `auth`/`db`/`storage` is a `'use client'`
  component that only touches them inside a `useEffect` or an event handler — never during
  render — so this is safe. Without the guard, `getAuth()`'s eager API-key-format validation
  throws `auth/invalid-api-key` during Next.js's SSR/static-prerender pass whenever
  `NEXT_PUBLIC_FIREBASE_API_KEY` isn't set, which broke `pnpm build` entirely (caught by actually
  running the build in this session, not just `tsc --noEmit`, which doesn't execute this code
  path).
- **Removed the custom `@typescript-eslint/no-explicit-any` rule** from `.eslintrc.json` — it
  isn't registered by `eslint-config-next`'s `next/core-web-vitals` preset on its own (only a
  full `@typescript-eslint` plugin config would register it), and referencing an undefined rule
  hard-fails `next build`'s lint step for every file. `next/core-web-vitals` already applies
  reasonable defaults; revisit if stricter linting is wanted later.
