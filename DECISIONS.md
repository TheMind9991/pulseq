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

## Phase 2 — Core practice loop

- **Bumped `next` 14.2.15 → 14.2.35** (and `eslint-config-next` to match) at the start of this
  phase — `pnpm install` flagged a known security advisory against 14.2.15. Section 1 pins the
  major version ("Next.js 14"), not an exact patch, so staying on 14.2.x while taking the fix is
  within spec. Rebuilt and re-ran the full test suite after the bump; no breakage.
- **Subject/topic taxonomy (`SUBJECT_TOPICS` in `src/lib/constants/practice.ts`) is hardcoded**,
  same reasoning and precedent as `FACULTIES`/`MODULES` in Phase 1: Firestore has no cheap
  "distinct" query, and there's no real content yet to derive it from (the real xlsx sample is
  reserved for Phase 5's importer, not this seed data — see next entry). Used by both the
  practice session builder's filter chips and the seed script, so they can't drift apart. Revisit
  once Phase 5 content exists — derive available subjects/topics from actually-published
  questions instead.
- **Seed content is synthetic, not the real `Copy_of_End_round_IM_193.xlsx`.** The engineering
  spec Section 0 is explicit that the real xlsx is for testing the Phase 5 bulk-upload importer
  against its real-world quirks (malformed `Answer` cells, per-option explanation gaps, etc.) —
  using it here would both misuse that fixture and fail Phase 2's "3-4 subjects" requirement
  (the real file is 100% Internal Medicine). `scripts/seed-firestore.ts` instead hand-authors 52
  textbook-level MCQs across 4 subjects / 13 topics, written to `status: 'published'` directly —
  a dev-only shortcut around the author≠reviewer rule (Section 5.6), clearly commented as such at
  the top of the script. Not real, human-reviewed course content.
- **`startPracticeSession` fetches all tenant-scoped published questions and filters/ranks
  in application code**, rather than composing Firestore composite-index queries for arbitrary
  multi-select subject+topic+difficulty combinations. Section 5.2's "least-recently-seen
  preferred" selection already implies post-fetch ranking logic, not a pure Firestore query. Fine
  at Phase 2's ~50-question scale (existing `(tenantId, status, subject, topic)` index already
  covers the `tenantId`+`status` prefix used); revisit — pagination, a dedicated search index, or
  narrower Firestore-level filtering — once content approaches the product PRD's 3,000-question
  target (Section 8) or the 10k-concurrent-user NFR makes per-session full-collection reads
  costly.
- **Answer submission goes through a server action (`submitAnswer`), not a direct client-side
  Firestore write**, even though `firestore.rules` already permits the owning user to write their
  own `sessions`/`userQuestionStats` docs directly. Section 7.2 (Phase 6) explicitly describes
  daily-cap enforcement as reusing "the same server-side write path that already persists
  answers" — meaning that path is assumed to already be server-side by the time Phase 6 lands.
  Building it as a server action now avoids reworking this in Phase 6. Firestore rules remain as
  defense-in-depth, not the primary write path. `isCorrect` is also computed server-side (from
  `questions/{id}.correctOptionId`, never trusted from the client) for the same reason, even
  though a student can already see the full question doc (rules don't currently redact answer
  fields from published-question reads — see next entry).
- **Published question docs are not redacted before the correct answer is revealed.**
  `firestore.rules` (Section 6) gates `questions` reads only by `status`/`tenantId`, with no
  mention of hiding `correctOptionId`/explanations from an unanswered question — so a student
  could technically read the answer key via devtools before selecting an option. This matches the
  spec's own rule design (content is never gated, per the product PRD's "never gated by payment
  status" philosophy extended here) and anti-scraping is called out as a separate, later NFR
  concern (rate limiting/watermarking — product PRD Section 7), not answer-key redaction. Not
  changed in Phase 2; flagged here rather than silently patched, since redacting would need a
  answer-stripped read path (e.g. a callable/server action returning sanitized question content)
  that the spec doesn't currently ask for.
- **'flagged' status filter and question-level bookmarking are out of scope for Phase 2.**
  `userQuestionStats.bookmarked` (Section 3.4) is the schema field for it, but no build phase in
  Section 10 explicitly assigns building the bookmark toggle or the `/bookmarks` page, and Phase
  2's own done-when checklist doesn't mention it. The session builder's status filter exposes
  only Unseen/Incorrect for now; `sessionStatusFilterSchema` still includes `'flagged'` for schema
  fidelity with Section 3.3. Build the toggle + `/bookmarks` page whenever bookmarking is
  explicitly scoped (or fold it into Phase 5 alongside error reports, which is a similar shape of
  work).
- **Per-session `flaggedForReview` (Section 3.3, distinct from the bookmark above — an
  ephemeral "come back to this" flag scoped to one session) is also deferred.** Not in Phase 2's
  done-when, and Section 5.2's step 3 only specifies the rail must reflect
  answered-correct/answered-incorrect/current/unanswered — no flagged state. Schema field exists
  (`SessionAnswer.flaggedForReview`) and defaults to `false`; the UI to set it can land alongside
  the bookmark toggle above.
- **Design tokens converted from hex to "R G B" triplets** (`src/styles/globals.css`,
  `tailwind.config.ts`) — found while building the quiz components, which are the first to use
  Tailwind opacity modifiers (`bg-success/10`, `border-danger`, etc. for the correct/incorrect
  option and explanation-panel tints). A bare `--color-x: #hex` custom property makes Tailwind
  silently emit no CSS at all for `bg-x/10`-style utilities (confirmed by inspecting the compiled
  CSS, not just assumed) — the standard fix is storing "R G B" and wrapping as
  `rgb(var(--x) / <alpha-value>)` in the Tailwind color config, which is what's now in place. Also
  fixed the two places that referenced a raw `var(--color-x)` directly (`globals.css`'s `body`
  rule, and an `accent-[...]` arbitrary value in the onboarding form) to wrap with `rgb(...)` too.
  If the real `pulseq-site.zip` tokens.css is pasted in later, convert its hex values to this same
  triplet format rather than dropping the `rgb()`/`<alpha-value>` wiring.
- **Added emulator-only local dev support** (`NEXT_PUBLIC_USE_FIREBASE_EMULATORS`,
  `FIRESTORE_EMULATOR_HOST`/`FIREBASE_AUTH_EMULATOR_HOST` handling in
  `src/lib/firebase/client.ts` and `admin.ts`) — not explicitly requested by the spec, but needed
  to actually verify Phase 2 end-to-end (still no live Firebase project connected to this build;
  see Phase 1's DECISIONS.md entries). Kept as a permanent, documented option (SETUP.md's
  "Emulator-only local dev" section) since it's a genuinely useful local-dev/CI capability going
  forward, not a one-off testing hack — every write path (session cookie, Firestore, custom
  claims) runs unmodified against it.
- **Added a real Playwright E2E test** (`tests/e2e/practice-loop.spec.ts`,
  `playwright.config.ts`) covering Section 9's first required happy path (sign-up → onboarding →
  start a practice session → answer every question), run against the emulators above and a real
  Chromium browser — this is what actually verified Phase 2 works end-to-end, not just unit/rules
  tests. The "see it reflected on the dashboard" portion of Section 9's description is deferred
  until Phase 3 builds the real dashboard (currently an intentional empty shell). Not yet wired
  into CI — would need the emulators started as a CI step first; tracked as a follow-up, same
  status as the `pnpm test:rules` gap noted for CI in Phase 1.
