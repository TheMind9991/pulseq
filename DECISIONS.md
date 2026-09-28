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

## Phase 5 — Admin & content pipeline

- **Inspected the real `Copy_of_End_round_IM_193.xlsx` directly before writing any parsing code**
  (Section 0's own instruction), rather than building from the spec's prose description of it
  alone. This surfaced real quirks the prose doesn't fully capture:
  - The sheet's 50 real rows are followed by ~949 genuinely-blank rows, but those trailing rows
    still carry a stray `false` in the `Reviewed` column (a checkbox-format default) — a
    "stop at the first row where *every* cell is empty" check never finds a boundary at all.
    `parseWorkbook.ts` keys the cutoff off the `Question` cell specifically instead.
  - **8 of the 50 rows** (not just the 1 malformed-Answer row) have only a single Tags segment
    ("Internal Medicine", no topic) — a real, common failure mode the spec's prose doesn't
    quantify. `validateQuestionRow` correctly blocks all 8 on `too_few_tag_segments`, while still
    reporting the subject it *could* extract from each.
  - The subject appears as both `"Internal Medicine"` and `"Internal medicine"` across real rows
    (confirms the spec's casing-normalization requirement is not hypothetical) — but the same
    sheet also uses `"GIT"` as a real topic value, which a naive capitalize-every-word title-case
    would mangle into `"Git"`. `parseTagsToTaxonomy.ts`'s title-case preserves any
    already-fully-uppercase token (2+ chars) as an acronym instead of re-casing it.
  - The malformed-Answer row (`"(A - selected as best clinical sign *among the options*)"`, sheet
    row 34) is *also* one of the 8 few-tag-segment rows, and is the *only* row using Option E —
    the messiest row in the sheet by a wide margin, and now a concrete test fixture rather than a
    hypothetical.
  - Committed the file itself at `tests/fixtures/Copy_of_End_round_IM_193.xlsx` and wrote a test
    (`tests/unit/content/parseWorkbook.test.ts`) that parses and validates it directly, asserting
    the exact real counts above (50 rows, 1 malformed Answer, 6 Comment rows, 8 blocking few-tag
    rows, 42 importable) — this is the concrete proof for Phase 5's done-when, not a synthetic
    stand-in.
- **Found and fixed a real design bug via that same real-file test, before any UI existed to
  hide it**: my first draft of `extractAnswerLetter` treated the tolerant-regex recovery path
  (Section 5.5.1's own worked example — the malformed row above) as *equivalent to* a clean match,
  so `validateQuestionRow` never actually flagged it at all — silently contradicting the done-when
  ("correctly flags the one row with a malformed Answer cell"). Fixed by having
  `extractAnswerLetter` report `wasClean: true | false` alongside a successful extraction:
  `wasClean: false` (recovered via the tolerant fallback) is now a non-blocking warning — a human
  should double-check it, but there *is* an unambiguous answer, so it doesn't block import on its
  own — while a truly ambiguous or empty cell (no letter recoverable at all) is the only case that
  blocks, matching Section 5.5.1's "ambiguous or fails... not silently defaulted to a guess" for
  the case where there genuinely isn't a letter to recover.
- **Bulk upload built as a Server Action (`previewBulkUpload`/`confirmBulkUpload`), not the
  literal Cloud Function `functions/src/content/bulkUploadQuestions.ts` the spec's repo structure
  names.** Every other mutation in this codebase (session start/answer/submit, dashboard writes)
  already went through Server Actions specifically so Phase 6 could reuse the same server-side
  write path (see Phase 2's DECISIONS.md entry) — introducing a second, inconsistent pattern
  (callable Cloud Functions, with their own client-invocation shape and payload encoding) for
  admin-only mutations, when nothing about file upload+parse actually requires it, would fragment
  the codebase's architecture for no functional gain. Reserved real Cloud Functions for what
  genuinely needs Firestore triggers (`setCustomClaims`, `recomputeTopicStats`). The *parsing/
  validation* module names and separation the spec calls for (`validateQuestionRow.ts`) are kept,
  just under `src/lib/content/` rather than `functions/src/content/`.
  Preview and confirm are two separate calls with no server-side staging in between — the
  validated rows round-trip through the client (which already holds them after the preview
  response) rather than being written to a temp Firestore doc. Simple and fine at this content
  volume (dozens to low thousands of rows); would need reconsidering only at a much larger batch
  size than this platform's content pipeline currently produces.
- **The author != reviewer publish rule is enforced in firestore.rules (`isValidPublishTransition`
  on `questions/{questionId}`'s `allow update`), not just in the server action.** `publishQuestion`
  in `src/app/admin/questions/actions.ts` also checks `authorId !== uid` before writing, but that
  check exists only to surface a friendly error message — the rule is the actual enforcement
  (Section 6's "rules as the real enforcement layer, not just client checks"), confirmed by
  `tests/rules/firestore.rules.test.ts`'s `questions/{questionId}` suite: a second editor can
  publish an `in_review` question and become `reviewedById`, the original author cannot publish
  their own `in_review` question, publishing from any status other than `in_review` is rejected,
  and `delete` is denied outright (retiring is a status update to `'retired'`, never a delete, so
  a student's past session history referencing a retired question stays intact).
- **`(admin)` was renamed to a plain `admin/` route segment, not a route group.** A route group
  (`(admin)`) contributes no URL segment by design — the first attempt put `questions/page.tsx`
  under `(admin)/questions/`, which built successfully but served at bare `/questions`, not
  `/admin/questions` (caught by inspecting `next build`'s route table, not by typecheck/lint, which
  both stayed clean throughout). Fixed by moving the whole tree to a real `src/app/admin/` folder,
  whose own `layout.tsx` gates every route under it by the role claim — the same effect intended,
  achieved with a real path segment instead of a group.
- **Admin question form only lets you add/remove the *last* option (append at the end, remove the
  end), never a specific one in the middle.** The form binds each option row's displayed letter to
  its array index (`OPTION_IDS[index]`) to keep the UI simple, and the underlying data's real `id`
  field (`'A'..'E'`) is what's actually persisted — removing a middle option would desync those two
  without extra bookkeeping for no real benefit, since content is always authored/imported as a
  contiguous A.. run. Keeping removal end-only sidesteps the desync entirely rather than adding
  code to prevent it.
- **Tightened the pre-existing `errorReports/{reportId}` rule to also check tenant, not just role.**
  The original rule (from Phase 1/3's scaffold, before this collection had a real writer) let any
  editor/admin read and update *any* tenant's reports (`allow read, update: if isEditorOrAdmin();`
  — no `isSameTenant` check at all), which would leak report content and question IDs across
  tenants once white-labeling is live. Added `tenantId` to `ErrorReportDoc`, and both `create` and
  `read/update` now also require `isSameTenant(...)`, matching every other tenant-scoped
  collection's rule shape. Covered by a new `errorReports/{reportId}` describe block in
  `firestore.rules.test.ts` (create requires `reportedByUserId == request.auth.uid` AND matching
  tenant; a student can never read/update; an editor can read/resolve their own tenant's report but
  not another tenant's).
- **"Report an issue" only renders when `feedbackMode !== 'hidden'`** (practice and exam review,
  not the live in-progress exam) — matches the done-when's own wording ("QuestionCard (practice +
  exam review)") and avoids adding a distraction to a timed, in-progress exam; a student who spots
  a problem mid-exam can still report it from the review screen right after submitting.
- **Role changes go through `users/{userId}.role`, written by the Admin SDK, not through a
  dedicated "set claim" endpoint.** `functions/src/auth/setCustomClaims.ts` (Phase 1) already
  treats that Firestore field as the source of truth and mirrors it into the Auth custom claim on
  every write; `changeUserRole` (`src/app/admin/users/actions.ts`) just writes that same field via
  `getAdminDb()`, which bypasses firestore.rules' explicit block on a client setting its own role.
  It also calls `setCustomUserClaims` directly rather than waiting on the trigger, so the change is
  visible immediately instead of racing an async Cloud Function — the trigger's own
  already-in-sync check (see its comment) means this never produces a duplicate/conflicting write
  when it fires afterward.
- **Role management is restricted to `role === 'admin'`, not `isEditorOrAdmin()`.** AdminLayout
  gates `/admin/*` on editor-or-admin (content management), but `/admin/users` and
  `changeUserRole` additionally require admin specifically — deciding who can manage content is a
  platform-administration concern, one level above managing the content itself. An editor hitting
  `/admin/users` is redirected to `/admin` (not bounced out of the admin area entirely, since
  they're still a legitimate admin-area user); the "Users" nav link itself is hidden for editors
  in `AdminHeader` so this only surfaces as a redirect if they type the URL directly. The role
  picker's own admin row is disabled client-side (can't touch your own role at all) on top of the
  server action's "can't remove your own admin role" check — belt and suspenders against
  self-lockout, consistent with how `publishQuestion` layers a friendly server-side check on top
  of the rule that's the actual enforcement.
- **`scripts/set-user-role.ts` writes both the Firestore field and the custom claim directly**,
  rather than relying solely on the Cloud Function trigger — bootstrapping the very first admin
  has to work even against a project where Functions haven't been deployed yet (the trigger only
  exists once `firebase deploy --only functions` has run), which is exactly the chicken-and-egg
  situation this script exists to break.

## Phase 5 — e2e validation: real bugs the tests caught

Added `tests/e2e/admin-bulk-upload.spec.ts` (the real sample file through the actual UI —
preview, per-row pass/warning/fail report, deselect-then-confirm) and
`tests/e2e/admin-review-queue.spec.ts` (two separate editor accounts in two separate browser
contexts, proving author != reviewer end to end, not just at the rules-unit level), plus a shared
`tests/e2e/helpers/adminAuth.ts` (sign up through the real UI, promote via Admin SDK, sign out/in
so the session cookie picks up the new role claim — a custom claim change doesn't retroactively
rewrite an already-issued session cookie). Running the full suite against real emulators (per
this phase's own "verify by running the code" standard) surfaced three real bugs no amount of
typecheck/lint/build had caught, since none of them are type errors:

1. **`QuestionEditClient` crashed at runtime**: `Only plain objects... can be passed to Client
   Components from Server Components. Classes... are not supported.` It took the whole `QuestionDoc`
   as a prop, which carries Firestore `Timestamp` fields (`createdAt`/`updatedAt`) — a class
   instance, not RSC-serializable, even though it typechecks fine (`Timestamp` is a valid TS type,
   just not a valid one to cross the server/client boundary as a prop). Fixed by having the page
   build a plain `defaultValues` object server-side and pass that plus `status` instead of the raw
   doc — the same pattern `SessionHistoryTable`/`TopicAccuracyTable` already used correctly
   (calling `.toDate()` before handing data to a client component), just missed here.
2. **`/admin/questions` crashed at runtime**: `Event handlers cannot be passed to Client Component
   props.` The status-filter tabs wrapped the *interactive* `Chip` component (designed for
   `SessionFilterFields`'s client-side filtering, with a required `onClick`) inside a `<Link>`,
   passing a no-op `onClick={() => {}}` from a Server Component — `Chip` has no `'use client'` of
   its own, so it rendered as a Server Component too, and a function prop can never cross that
   boundary. Fixed by dropping `Chip` here entirely and styling the `<Link>` itself as the pill
   (also fixes an invalid `<button>`-inside-`<a>` nesting the old version had).
3. **A genuinely flaky assertion in `admin-review-queue.spec.ts` itself** (a test bug, not an app
   bug): `waitForURL(/\/admin\/questions\/[^/]+$/)` right after submitting the create form also
   matches `/admin/questions/new` — "new" satisfies `[^/]+` just as well as a real document ID —
   so on a slow render it could resolve before the actual client-side navigation away from `/new`
   happened, capturing the wrong URL. Fixed by waiting for the review panel's `Status: draft` text
   instead, which only ever renders on the real detail page.

None of these three would have been caught by `pnpm typecheck`/`pnpm lint`/`pnpm build` — the RSC
serialization and function-prop rules are runtime-only checks — which is exactly why this phase's
"verify by running the code" standard treats the e2e pass as a required, not optional, step before
any commit.

Two environment-only issues, not code bugs, also worth recording since they cost real time to
diagnose: `pnpm test:e2e` needs `FIRESTORE_EMULATOR_HOST`/`FIREBASE_AUTH_EMULATOR_HOST`/
`FIREBASE_PROJECT_ID` exported in the shell that runs Playwright itself (Next.js auto-loads
`.env.local` for the dev server it spawns, but Playwright's own process — and any `firebase-admin`
call made directly from a spec file, like `adminAuth.ts` or `exam-flow.spec.ts`'s timer
fast-forward — does not); and `practice-loop.spec.ts`/`exam-flow.spec.ts` need `pnpm seed` run
against the emulator first (no published questions -> "Start" never navigates anywhere, which
looks identical to a hung UI from the outside, not an obviously-empty-state error).
