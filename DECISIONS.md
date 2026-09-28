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

## Phase 3 — Analytics & dashboard

- **`computeTopicAccuracy.ts` duplicated into `functions/src/analytics/recomputeTopicStats.ts`**
  rather than imported, same reasoning as Phase 1's `setCustomClaims.ts`-adjacent notes:
  `functions/` is a separate TypeScript package/compilation unit with no access to `src/`. It's a
  ~10-line pure function: duplication is cheaper and clearer than setting up a shared workspace
  package for it. Comments in both files point at each other; keep them in sync by hand.
  `questionsAnswered` counts distinct questions attempted at least once; `accuracy` is
  correct/seen across *all* attempts (not just first-attempt) — both the Cloud Function and the
  unit-tested pure logic agree on this.
- **"Sessions" query uses `orderBy('completedAt', 'desc')`, exactly as Section 3's own index list
  specifies** (`sessions: (userId, completedAt desc) — for session history`), not `startedAt` as
  I first reached for over a null-sorting concern (an in-progress session's `completedAt: null`
  sorts after all timestamps in descending order). Firestore's actual behavior here works in this
  app's favor: completed sessions naturally rank first, and an incomplete session only appears in
  the 5-row result if the student doesn't have 5 completed ones yet — at which point
  `SessionHistoryTable` renders it with a "Resume" link instead of a score. No new index needed;
  the Phase 1 index already covers this exact query.
- **Recharts pinned to v3** (`^3.2.1`), not v2 — `pnpm install` flagged v2 as deprecated
  (unmaintained) the moment I added it, and there's no existing v2 code to migrate from since this
  chart is new. Section 1 names "Recharts" without a version; v3 is the conventional choice for a
  fresh build.
- **`TopicAccuracyTable` is a Recharts horizontal bar chart, styled per the dataviz skill's
  guidance** (loaded before writing it, per the skill's own trigger and the engineering spec's
  "reference the app's own dataviz conventions if available" instruction): accuracy-by-topic is a
  **status** encoding (strong/watch/weak, a fixed reserved scale — not the categorical theme), so
  colors reuse the existing `--color-success/warning/danger` tokens, are always paired with a
  legend + direct `%` label (status color is never the only signal), and the bar uses Recharts'
  `background` prop for the "unfilled track" rather than a second series. Also ships a visually-
  hidden (`sr-only`) real `<table>` mirroring the chart data, satisfying the skill's "a table view
  exists" accessibility requirement without conflicting with the spec's explicit choice of
  Recharts for the visual.
- **Dashboard summary stats are "Questions answered", "Overall accuracy", "Weakest topic"** —
  Section 5.4 doesn't enumerate which stats StatCard should show. Chose these three because they
  come free from the already-fetched `userTopicStats` docs (no extra query, matching Section 3.5's
  "cheap single-document reads" design intent) and the weakest-topic card usefully previews what
  "Practise weak topics" is about to do. A precise all-time "sessions completed" count would need
  a separate aggregate query and was left out for the same reason.
- **"Practise weak topics" pre-fills every topic with `status: 'weak'`, falling back to the single
  lowest-accuracy topic if none are strictly 'weak' yet** — Section 5.4 says "topic(s)" (plural),
  implying possibly-multiple, but doesn't define the exact selection rule. The fallback exists so
  the button still does something useful for a student who's only ever gotten to "watch"/"strong"
  topics. Implemented via repeated `?topic=` query params read by `/practice`'s existing client
  state (`useSearchParams`), not a server round-trip.
- **Found and fixed a real runtime bug via the emulator, not just typecheck**: the first draft of
  `recomputeTopicStats.ts` used `import * as admin from 'firebase-admin'` and called
  `admin.firestore.FieldValue.serverTimestamp()` (the classic namespaced-API pattern). This
  type-checked and built cleanly but threw `TypeError: Cannot read properties of undefined
  (reading 'serverTimestamp')` at runtime in the Functions emulator — confirmed via emulator logs,
  not assumed — silently breaking every `userTopicStats` write and leaving the dashboard stuck at
  zero. Fixed by switching to the modular import (`import { FieldValue } from
  'firebase-admin/firestore'`), matching the pattern already used correctly elsewhere
  (`src/lib/firebase/admin.ts`, the practice server actions). Also switched
  `setCustomClaims.ts`'s `admin.auth()` calls to the modular `getAuth()` for consistency, even
  though that one wasn't actually broken (it doesn't touch `FieldValue`).
- **Verified the full Cloud Function trigger chain end-to-end**, not just unit-tested the pure
  logic: extended `tests/e2e/practice-loop.spec.ts` to continue past session completion into the
  dashboard, running the Firestore *and* Functions emulators together (`firebase emulators:start
  --only auth,firestore,storage,functions`, functions pre-built via `cd functions && pnpm build`
  first). This is what actually caught the bug above — `tsc`/`pnpm build` on the Next.js app alone
  never touches the Functions package's runtime behavior. Because `recomputeTopicStats` runs
  asynchronously off the same write that redirects the browser to `/dashboard`, and the dashboard
  is server-rendered with no client-side re-fetch, the test polls with repeated `page.goto`
  reloads (`expect.poll`) rather than a single navigation — confirmed necessary in practice: right
  after a cold emulator restart, the very first trigger dispatch was slow enough that a single
  immediate read raced it, even though the function's own execution time was consistently
  under 500ms once warm.

## Phase 4 — Timed exams

- **Refactored shared logic out of the tutor-mode practice code before building exams**, rather
  than duplicating it: question selection (`src/lib/sessions/selectQuestions.ts`), the
  `userQuestionStats` upsert (`src/lib/sessions/userQuestionStats.ts`), and the subject/topic/
  difficulty/status filter UI + state (`useSessionFilters` hook +
  `components/quiz/SessionFilterFields.tsx`, `components/ui/Chip.tsx`). Section 5.3 itself says
  "Same flow as 5.2 but..." — the spec's own framing already treats these as one shared flow, not
  two parallel implementations. No behavior change to the existing practice loop; re-ran its e2e
  test after the refactor to confirm.
- **Exam answers are freely overwritable pre-submission; userQuestionStats is only updated once,
  at final submission — not on every draft change.** Tutor mode's `submitAnswer` locks an answer
  in immediately (matching its immediate-reveal UX), so updating stats at answer time is correct
  there. An exam answer can be changed any number of times before submitting (Section 5.3 implies
  free navigation with no per-question lock, unlike tutor mode), so updating stats on every
  intermediate change would inflate `timesSeen`/`timesCorrect` for a question the student simply
  reconsidered. `saveExamAnswer` writes only `sessions.answers` (with `isCorrect: null` —
  correctness is computed once, for real, at submission, not guessed at draft time); `submitExam`
  scores every question from whatever ended up saved and upserts stats exactly once per question.
- **Introduced a `feedbackMode` prop (`'immediate' | 'hidden' | 'always'`) on `QuestionCard`/
  `OptionRow`**, replacing what was originally sketched as a simple boolean `revealAnswer`. A
  boolean can't express the exam review screen's actual requirement: a *skipped* question must
  still show the correct option highlighted (so the student can learn from it), which needs
  "always reveal, regardless of whether this question was answered" — a case a boolean tied to
  `answered` can't represent. `'immediate'` is tutor mode's existing behavior (reveal once
  answered, then lock) — unchanged. `'hidden'` is an in-progress exam (never reveal, stays
  editable). `'always'` is the exam review screen. `ExplanationPanel` was extended to accept
  `isCorrect: boolean | null` for the same reason — a skipped question's explanation still shows,
  framed as "Not answered" rather than correct/incorrect.
- **Exam review is a single scrollable list of every question (`ExamReview`), not the same
  one-at-a-time `QuestionRail`-navigated view the in-progress exam and tutor mode use.** Section
  5.3 literally describes it as "a results/review screen (**list** of all questions...)", distinct
  wording from the question-by-question screens elsewhere in the same section.
- **Server-side expiry enforcement, not just a client-side timer.** `saveExamAnswer` recomputes
  remaining time from `startedAt`/`durationSeconds` server-side on every call (via the same
  `computeRemainingSeconds` the client's countdown uses) and refuses to apply an answer change —
  finalizing the exam instead — once the deadline has passed, rather than trusting the browser's
  own clock/timer to have already stopped accepting input. Consistent with the "never trust the
  client" pattern already established for `isCorrect` computation in Phase 2.
- **Found and fixed a real runtime bug via the browser, not typecheck or build**: `ExamReview.tsx`
  (a Server Component by default — no `'use client'`) rendered `QuestionCard`/`OptionRow`, which
  attach an `onClick` handler, with an inline `onSelect={() => {}}` no-op. `pnpm build` compiled
  this without complaint, but Next.js threw `Error: Event handlers cannot be passed to Client
  Component props` at actual render time — a React Server Components boundary violation that
  static analysis alone doesn't catch. Fixed by adding `'use client'` to `ExamReview.tsx`, matching
  the pattern already used by its siblings `PracticeSession`/`ExamSession`. Caught by the new e2e
  test, not assumed fixed.
- **Verified the "timed out" path without waiting out a real timer**: rather than sitting through
  a 15-minute wait (the shortest duration preset) in a test, `tests/e2e/exam-flow.spec.ts`'s
  timeout test starts a real exam through the UI, then uses the Admin SDK directly (same emulator
  connection pattern as `scripts/seed-firestore.ts`) to rewrite that session's `startedAt`
  further into the past than its duration allows, then reloads the page — exercising the exact
  same client-side expiry detection and server-side finalization a real 15-minute wait would,
  just reached in seconds.
- **`playwright.config.ts` pinned to `workers: 1`.** Found empirically while adding the exam e2e
  tests: with `workers: 2`, a dashboard assertion that passed reliably in isolation started
  intermittently failing — not a real bug (confirmed by re-running the same test alone, which
  passed every time). All e2e tests share one `pnpm dev` instance and one emulator suite (there's
  no per-worker server/emulator provisioning), so parallel workers contend for both under this
  sandbox's CPU limits. Revisit if/when this is wired into CI with real per-worker isolation.
