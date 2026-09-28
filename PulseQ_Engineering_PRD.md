# PulseQ — Engineering Build Specification

Version: 1.0
Date: 28 September 2026
Audience: An autonomous coding agent (Claude Cloud) building this from scratch
Companion doc: "PulseQ PRD.md" (product-level PRD, same project) — read that first for the *why*; this doc is the *how*.

---

## 0. How to use this document

Build in the phase order given in Section 10. Each phase lists exact deliverables, file paths, and a "definition of done" checklist. Do not skip ahead to a later phase's UI polish before an earlier phase's data layer is working end-to-end — this is a fresh build, so there is no legacy code to preserve, but there is a strict dependency order (auth → data model → core practice loop → analytics → admin → payments → white-label).

Where a decision is not specified here, make the most conventional choice for the stated stack and note the assumption in a `DECISIONS.md` file at the repo root rather than stalling to ask. Flag anything under "Open questions" (Section 13) as a comment in code (`// TODO(product): ...`) rather than guessing silently.

A full visual design system and static HTML/CSS reference implementation has already been produced and should be treated as the source of truth for all visual specs (colors, spacing, type, component states). It is provided alongside this document as `pulseq-site.zip` containing:
- `css/tokens.css` — design tokens (colors for light/dark themes, spacing, radii, shadows, type scale)
- `css/base.css`, `css/landing.css`, `css/app.css` — component styles
- `index.html` — marketing landing page reference
- `pages/app-question.html` — quiz/practice screen reference
- `pages/dashboard.html` — student dashboard reference
- `js/theme.js` — light/dark theme toggle logic (persists via localStorage)

Port these into React components and Tailwind config (Section 4.2) rather than reimplementing the visual design from scratch or from imagination.

A real content-authoring spreadsheet, `Copy_of_End_round_IM_193.xlsx`, is also provided alongside this document — 50 real Internal Medicine questions in the exact format the bulk-upload feature (Section 5.5) must parse. Build and test the importer against this actual file, not a simplified template invented for convenience; its quirks (per-option explanations, a comma-separated tag hierarchy, occasional malformed data) are specified in detail in Section 5.5 precisely because they are real and will recur in future content batches.

---

## 1. Tech stack (fixed — do not substitute)

- **Framework:** Next.js 14, App Router, TypeScript strict mode.
- **Backend/data:** Firebase — Firestore (data), Firebase Auth (identity), Firebase Storage (images), Cloud Functions (server-side logic: role claims, Excel ingestion, payment webhooks).
- **Styling:** Tailwind CSS, configured with tokens from `css/tokens.css` (Section 4.2). No CSS-in-JS.
- **State/data fetching:** React Server Components by default; `swr` for client-side data that needs revalidation (live progress, session state).
- **Forms/validation:** `react-hook-form` + `zod` for both client and server (Cloud Functions) validation — one schema, shared.
- **Excel parsing:** `xlsx` (SheetJS) for admin bulk upload — note the product PRD's stated preference for `xlsxwriter`-equivalent robustness; on Node, use `xlsx` for reads and `exceljs` for writes if a downloadable template/export is needed, since `xlsx`'s write support is weaker.
- **Charts:** Recharts, styled to match `css/tokens.css` colors (see the dataviz guidance in Section 4.4).
- **Deployment target:** Vercel (Next.js) + Firebase (backend), or Firebase Hosting with Next.js SSR support — pick whichever the agent's environment supports out of the box; note the choice in `DECISIONS.md`.
- **Package manager:** pnpm.

Do not introduce a second backend, a second database, or a second UI framework. Do not propose a rewrite of this stack — it is fixed per the product owner's existing familiarity and prior build history.

---

## 2. Repository structure

```
pulseq/
├── DECISIONS.md                 # agent's own log of judgment calls made during build
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── functions/                   # Cloud Functions (separate package)
│   ├── src/
│   │   ├── index.ts
│   │   ├── auth/
│   │   │   └── setCustomClaims.ts
│   │   ├── content/
│   │   │   ├── bulkUploadQuestions.ts
│   │   │   └── validateQuestionRow.ts
│   │   ├── payments/
│   │   │   ├── createCheckout.ts
│   │   │   └── webhookHandler.ts
│   │   └── analytics/
│   │       └── recomputeTopicStats.ts
│   └── package.json
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                    # landing page (port of index.html)
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/                          # authenticated student app
│   │   │   ├── layout.tsx                  # app shell: header, theme toggle, nav
│   │   │   ├── dashboard/page.tsx          # port of pages/dashboard.html
│   │   │   ├── practice/
│   │   │   │   ├── page.tsx                # session builder (subject/topic/difficulty picker)
│   │   │   │   └── [sessionId]/page.tsx    # port of pages/app-question.html
│   │   │   ├── exams/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [sessionId]/page.tsx
│   │   │   ├── bookmarks/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                  # gated by role claim
│   │   │   ├── admin/page.tsx              # overview / coverage
│   │   │   ├── admin/questions/page.tsx    # list + review queue
│   │   │   ├── admin/questions/new/page.tsx
│   │   │   ├── admin/questions/[id]/page.tsx
│   │   │   ├── admin/upload/page.tsx       # Excel bulk upload
│   │   │   ├── admin/users/page.tsx
│   │   │   └── admin/reports/page.tsx      # student error reports queue
│   │   ├── api/
│   │   │   ├── webhooks/payments/route.ts
│   │   │   └── og/route.tsx                # optional: OG image generation
│   │   └── layout.tsx                      # root layout, theme script injection
│   ├── components/
│   │   ├── ui/                             # generic primitives: Button, Card, Tag, Toggle
│   │   ├── marketing/                      # hero, feature-grid, pricing-card, faq-item
│   │   ├── quiz/                           # QuestionCard, OptionRow, ExplanationPanel, ProgressStrip, QuestionRail
│   │   └── dashboard/                      # StatCard, TopicAccuracyTable, SessionHistoryTable
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts                   # client SDK init
│   │   │   ├── admin.ts                    # admin SDK init (server-only)
│   │   │   └── converters.ts               # Firestore <-> TS type converters
│   │   ├── auth/
│   │   │   ├── useUser.ts                  # client hook
│   │   │   └── getServerUser.ts            # server helper
│   │   ├── schemas/                        # zod schemas (shared client/server)
│   │   │   ├── question.ts
│   │   │   ├── session.ts
│   │   │   └── user.ts
│   │   └── analytics/
│   │       └── computeTopicAccuracy.ts
│   ├── types/
│   │   └── index.ts                        # shared TS types generated from zod schemas
│   └── styles/
│       └── globals.css                     # Tailwind base + design tokens as CSS vars
├── scripts/
│   └── seed-firestore.ts                   # dev/staging seed data
└── tests/
    ├── unit/
    └── e2e/                                 # Playwright
```

---

## 3. Data model (Firestore)

Design every collection with a `tenantId` field from day one (default `"pulseq-core"` for the non-white-label instance), even though white-label ships in Phase 3. Retrofitting tenant scoping later is expensive; adding an unused field now is not.

### 3.1 `users/{userId}`
```ts
{
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'editor' | 'admin' | 'institution_admin';
  tenantId: string;
  faculty: string;
  academicYear: number;          // 1-6, or 'intern' as a separate field if needed
  modules: string[];             // module IDs the student is currently studying
  isPremium: boolean;             // true once the EGP 150/mo upgrade is active. Removes ads AND the daily usage
                                   // caps in Section 7 — this flag has real functional consequences, not just
                                   // cosmetic ones, so (unlike a purely-cosmetic flag) it must be treated as
                                   // security-sensitive: read server-side wherever caps are enforced (Section 7.3),
                                   // never trusted from a client-supplied value.
  premiumExpiresAt: Timestamp | null;
  locale: 'en' | 'ar';
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}
```
Role is also mirrored into a Firebase custom claim (`role`, `tenantId`) via `functions/src/auth/setCustomClaims.ts`, triggered on user doc create/update. **Never trust `role` read from the Firestore document alone for authorization** — Firestore security rules and any server-side check must read `request.auth.token.role`, the custom claim, not the document field. This directly replaces the old "God Mode" client-side role injection flagged as a security risk in the product PRD.

### 3.2 `questions/{questionId}`

This schema is derived directly from the real content-production spreadsheets already in use (see Section 5.5.1 for the exact source format — a sample file `Copy_of_End_round_IM_193.xlsx` is provided alongside this document). Do not invent a simpler shape; the per-option explanation and hierarchical tag fields below exist because the actual authoring workflow produces them.

```ts
{
  tenantId: string;
  stem: string;                  // "Question" column. Supports basic markdown. Often a multi-sentence clinical vignette.
  stemAr?: string;

  options: {
    id: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;                 // "Option{A..E}_Text" — E is optional, most questions use 4 options
    explanation?: string;         // "Option{A..E}_Explain" — per-option rationale, shown when that option is selected.
                                   // Populated for wrong options far more often than for the correct one (see correctExplanation below).
    textAr?: string;
  }[];

  correctOptionId: 'A' | 'B' | 'C' | 'D' | 'E';   // "Answer" column
  correctExplanation: string;    // "CorrectOption_Explanation" — the fuller rationale for the right answer,
                                  // shown in the ExplanationPanel regardless of which option the student picked.
  correctExplanationAr?: string;

  reference?: string;            // not present as its own column in the source sheets today; keep the field for
                                  // future content but do not require it at import time (see 5.5.3 validation rules).

  imageUrl?: string;             // Firebase Storage path. Source sheets seen so far are text-only (no image column);
                                  // treat as optional and unrelated to the bulk-upload path in 5.5.

  subject: string;               // Derived from Tags[0] — e.g. "Internal Medicine". Also mirrors the sheet's own
                                  // "Chapter" column, which in practice duplicates Tags[0] (one sheet = one subject).
  topic: string;                 // Derived from Tags[1] — e.g. "Cardiology", "Hepatology", "Chest", "Endocrine".
  subtopic?: string;             // Derived from Tags[2] — e.g. "Hypertension", "NAFLD", "COPD".
  skillTag?: string;             // Derived from Tags[3] — e.g. "Management of hypertension", "Diagnosis of NAFLD".
                                  // This is the finest-grained label and is closest to a "learning objective."
  tagsRaw: string;               // The original, unparsed "Tags" cell verbatim, kept for audit/re-parsing if the
                                  // taxonomy splitting logic (5.5.2) needs revisiting later.

  difficulty: 1 | 2 | 3;         // Not present in the source sheets today (all rows use "Score" = 1, which is exam
                                  // weight, not difficulty). Default every imported question to 2 (medium) and let
                                  // editors adjust manually post-import — do not fabricate a difficulty signal from
                                  // question length or any other heuristic.
  examWeight?: number;           // "Score" column, carried through as-is in case exam-mode scoring needs it later.

  status: 'draft' | 'in_review' | 'published' | 'retired';
  sourceReviewed: boolean;       // "Reviewed" column from the sheet — the *author's own* pre-import review flag.
                                  // This is distinct from and does not satisfy the platform's own author≠reviewer
                                  // publish rule (Section 5.6) — an imported row with sourceReviewed: true still
                                  // enters the platform at status: 'draft', never 'published', regardless of this flag.
  authorNote?: string;           // "Comment" column — internal editorial note (e.g. "don't know how to tag this",
                                  // "b?"). Never rendered to students under any circumstance. Surfaced only in the
                                  // admin review UI (Section 5.6) as a flag for the reviewer's attention.

  authorId: string;
  reviewedById?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

A row carrying a non-empty `authorNote` (`Comment` column) is a signal that the original author was unsure of the tagging or answer — surface these prominently (e.g. a visible badge) in the admin review queue so they get human attention before publishing, rather than being silently imported as ordinary draft questions.

### 3.3 `sessions/{sessionId}`
A session is either a practice ("tutor") session or a timed exam.
```ts
{
  tenantId: string;
  userId: string;
  mode: 'tutor' | 'timed_exam';
  questionIds: string[];         // fixed order at session creation
  answers: {
    [questionId: string]: {
      selectedOptionId: string | null;
      isCorrect: boolean | null;
      flaggedForReview: boolean;
      timeSpentSeconds: number;
    }
  };
  filters: {                     // what was selected in the session builder
    subjects?: string[];
    topics?: string[];
    difficulty?: number[];
    status?: 'unseen' | 'incorrect' | 'flagged';
  };
  durationSeconds?: number;      // set for timed_exam
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  score?: { correct: number; total: number };
}
```

### 3.4 `userQuestionStats/{userId}_{questionId}`
Denormalized per-user-per-question record, updated on every answer, to drive weak-area analytics without scanning all sessions.
```ts
{
  userId: string;
  questionId: string;
  subject: string;
  topic: string;
  timesSeen: number;
  timesCorrect: number;
  lastSeenAt: Timestamp;
  bookmarked: boolean;
}
```

### 3.5 `userTopicStats/{userId}_{topic}`
Rolled-up aggregate, recomputed by a Cloud Function (`recomputeTopicStats.ts`) triggered on `userQuestionStats` writes, to make the dashboard a cheap single-document read per topic rather than an aggregation query at render time.
```ts
{
  userId: string;
  subject: string;
  topic: string;
  questionsAnswered: number;
  accuracy: number;              // 0-1
  status: 'strong' | 'watch' | 'weak';  // derived: >=75% / 50-74% / <50%
  updatedAt: Timestamp;
}
```

### 3.6 `errorReports/{reportId}`
```ts
{
  tenantId: string;
  questionId: string;
  reportedByUserId: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  resolvedByUserId?: string;
}
```

### 3.7 `tenants/{tenantId}` (white-label, built now, used from Phase 3)
```ts
{
  name: string;
  domain?: string;
  branding: { logoUrl?: string; primaryColor?: string };
  createdAt: Timestamp;
}
```

### Indexes
Define composite indexes in `firestore.indexes.json` for:
- `questions`: `(tenantId, status, subject, topic)`
- `questions`: `(tenantId, status, createdAt desc)` — for the admin review queue
- `sessions`: `(userId, completedAt desc)` — for session history
- `userTopicStats`: `(userId, accuracy asc)` — for weak-area sorting

---

## 4. Design system integration

### 4.1 Source of truth
`css/tokens.css` in the delivered `pulseq-site.zip` defines every color, spacing, radius, and shadow value for both dark (default) and light themes, keyed off `[data-theme="dark"]` / `[data-theme="light"]` on `<html>`. Copy these CSS custom properties verbatim into `src/styles/globals.css`, and reference them from `tailwind.config.ts` using Tailwind's `extend.colors` with `var(--token-name)` values, so classes like `bg-accent`, `text-primary`, `border-subtle` resolve to the design tokens rather than hardcoded hex values anywhere in component code.

### 4.2 Theme toggle
Port `js/theme.js` logic into a small client component (`components/ui/ThemeToggle.tsx`) using the same approach: read/write `localStorage`, fall back to `prefers-color-scheme`, toggle `data-theme` on `<html>`. Inject a blocking inline script in the root layout's `<head>` (same pattern as the static reference) to avoid a flash of the wrong theme on load.

### 4.3 Component porting
Each static HTML page maps to specific components — build these once, reuse across routes:
- `index.html` → `components/marketing/*` (Hero, FeatureGrid, HowItWorks, Showcase, TestimonialGrid, PricingGrid, FAQList, CTABand) composed in `app/(marketing)/page.tsx`.
- `pages/app-question.html` → `components/quiz/*` (ProgressStrip, QuestionRail, QuestionCard, OptionRow, ExplanationPanel) composed in `app/(app)/practice/[sessionId]/page.tsx`. This same component set is reused for `app/(app)/exams/[sessionId]/page.tsx` with `mode="timed_exam"` (hides ExplanationPanel until submission, shows a countdown timer instead of the flag/bookmark toolbar being the focus).
- `pages/dashboard.html` → `components/dashboard/*` (StatCard, TopicAccuracyTable, SessionHistoryTable) composed in `app/(app)/dashboard/page.tsx`, with the mock data replaced by live reads from `userTopicStats` and `sessions`.
- New (not in the static mockups, since monetization was specced after the visual design): `components/ads/AdSlot.tsx`, placed on the dashboard (below the stat cards, above "Accuracy by topic" is a reasonable default position — match the design system's existing card spacing/rhythm rather than the ad feeling bolted on) and on the practice/exam session-builder screens. Style its container with the same `card` treatment (border, radius, background) used elsewhere in `css/base.css` so it reads as part of the page rather than a jarring ad-network default unit.

### 4.4 Charts
Style Recharts to match the muted palette: use `--accent`, `--warning`, `--danger` as bar/line colors matching the accuracy-by-topic bars already shown in the static dashboard mock (green ≥75%, amber 50–74%, red <50%). Reference the app's own `dataviz` conventions if the build environment has that skill/guide available; otherwise match the static mockup's bar styling exactly (rounded track, muted track background at 12–16% opacity of the text color).

### 4.5 RTL and Arabic
Every component must render correctly with `dir="rtl"` when `locale === 'ar'`. Use Tailwind's logical properties (`ms-`, `me-`, `ps-`, `pe-` instead of `ml-`/`mr-`/`pl-`/`pr-`) throughout so RTL flips automatically rather than requiring parallel RTL-specific stylesheets. Arabic UI can ship as a Phase 5 toggle (see Section 10) with English as the only shipped locale for Phases 1–4 — the *architecture* (locale field, RTL-safe utility classes, `stemAr`/`explanationAr` fields) must exist from Phase 1 so it is not retrofitted.

---

## 5. Core user flows (build these exactly)

### 5.1 Sign-up → onboarding
1. Firebase Auth email/password or Google sign-in.
2. On first sign-in, redirect to `/onboarding` (blocking — cannot reach `/dashboard` without completing it).
3. Onboarding form (react-hook-form + zod): faculty (select), academic year (select), modules (multi-select, populated from a `modules` reference collection or hardcoded list for v1).
4. On submit, create/update the `users/{uid}` document, trigger the custom-claims Cloud Function, redirect to `/dashboard`.

### 5.2 Practice session (tutor mode)
1. `/practice` shows the session builder: subject/topic/difficulty/status filters (chips or checkboxes matching the design system's `tag` component), a question-count selector, "Start" button.
2. On start, a server action queries `questions` where `status == 'published'` and filters match, selects N question IDs (random or least-recently-seen — least-recently-seen preferred, using `userQuestionStats.lastSeenAt`), creates a `sessions` document with `mode: 'tutor'`, redirects to `/practice/[sessionId]`.
3. The question screen (port of `app-question.html`): selecting an option immediately reveals correct/incorrect styling and the matching `ExplanationPanel`, writes to `sessions.answers[questionId]` and upserts `userQuestionStats`. Next/Previous navigate within `questionIds`; the question rail reflects answered-correct/answered-incorrect/current/unanswered state exactly as in the static mock.
4. Session auto-saves on every answer (no explicit "save" step needed beyond the existing "Save & exit" link, which simply navigates away — data is already persisted).

### 5.3 Timed exam
Same flow as 5.2 but: `mode: 'timed_exam'`, a duration is set at session creation, a visible countdown timer runs client-side (synced against `startedAt + durationSeconds` server timestamp so refreshing doesn't reset it), no `ExplanationPanel` or correct/incorrect styling shown until the exam is submitted or time expires, at which point a results/review screen (list of all questions with correct/incorrect + explanations, reusing `QuestionCard` in a read-only "reviewed" state) is shown.

### 5.4 Dashboard
Server-rendered read of `userTopicStats` (sorted by accuracy ascending to surface weak areas first) and the 5 most recent `sessions`, rendered via `StatCard` and `TopicAccuracyTable`/`SessionHistoryTable`. "Practise weak topics" button pre-fills the `/practice` session builder with the lowest-accuracy topic(s).

### 5.5 Admin: bulk question upload

#### 5.5.1 Source format (build against this exactly — do not invent a template)

Content is authored today in `.xlsx` workbooks with a single sheet, one question per row, header row exactly as follows (a real example, `Copy_of_End_round_IM_193.xlsx`, is provided alongside this document — parse against it directly rather than a hypothetical schema):

```
Question | Chapter | Score | OptionA_Text | OptionA_Explain | OptionB_Text | OptionB_Explain |
OptionC_Text | OptionC_Explain | OptionD_Text | OptionD_Explain | OptionE_Text | OptionE_Explain |
Answer | CorrectOption_Explanation | Tags | Reviewed | Comment
```

Observed characteristics the importer must handle, taken from the real sample file (50 populated rows out of 1000 sheet rows — trailing rows are blank, not an error):
- `OptionE_Text`/`OptionE_Explain` are usually empty — most questions have 4 options (A–D). A question is valid with as few as 2 populated options, but `correctOptionId` must reference a populated option.
- Per-option `*_Explain` cells are frequently empty for the *correct* option specifically (its rationale lives in `CorrectOption_Explanation` instead) and are sometimes empty for a wrong option too (author didn't get to it yet) — empty `*_Explain` on a non-correct option is a **warning**, not a hard validation failure, so it doesn't block import, but it should be visibly flagged in the row-preview report (Section 5.5.3) so reviewers know which options still need a rationale before publishing.
- `Tags` is a single free-text cell, comma-separated, broad-to-specific (e.g. `"Internal Medicine, Cardiology, Hypertension, Management of hypertension"`). This is the entire taxonomy source — there are no separate subject/topic columns to fall back on.
- `Chapter` duplicates the first tag segment in every observed row (both say "Internal Medicine"). Treat `Chapter` as a fallback/sanity-check for `subject`, not the primary source — `Tags` is authoritative.
- `Score` is exam weight (observed constant `1` across all rows), not difficulty — do not map it to `difficulty`.
- `Reviewed` is a boolean the *content author* set before handing off the sheet — maps to `sourceReviewed` (Section 3.2), and must never be treated as equivalent to platform publish-approval.
- `Comment` is populated on a meaningful minority of rows (6 of 50 in the sample) with editorial uncertainty notes (e.g. `"don't know how to tag this"`, `"b?"`, `"or c?"`) — maps to `authorNote`, must never reach students, must be surfaced to reviewers.
- `Answer` is not always a clean single letter. The sample file contains at least one row where `Answer` is the malformed value `"(A - selected as best clinical sign *among the options*)"` instead of `"A"`. The parser must extract a single leading `A`–`E` letter from this field with a tolerant regex (e.g. first standalone `[A-E]` character), and any row where that extraction is ambiguous or fails must be rejected in the validation report with the raw cell value shown, not silently defaulted to a guess.
- Tag text has inconsistent casing and stray whitespace across rows from the same sheet (e.g. `"Internal medicine"` vs `"Internal Medicine"`, trailing spaces after subtopic values like `"NAFLD "`). Normalize on import: trim whitespace on every tag segment, and title-case-normalize `subject`/`topic` specifically for grouping purposes (so `"Internal medicine"` and `"Internal Medicine"` collapse into one subject in the dashboard/filter UI) — but preserve `tagsRaw` unmodified for audit.
- No image column exists in sheets seen so far — do not build the bulk-upload path around an image-per-row assumption; if/when an image-bearing sheet appears, treat it as a schema variant to detect (presence of an `Image` or `ImageFilename` column) rather than assuming every sheet has one.

#### 5.5.2 Tag-to-taxonomy mapping

Split the `Tags` cell on commas, trim each segment, and map positionally:
- segment[0] → `subject`
- segment[1] → `topic`
- segment[2] → `subtopic`
- segment[3] → `skillTag`
- any additional segments beyond index 3 → append to `skillTag` joined with `" — "` rather than discarding them (some rows may carry a 5th segment).

A row with fewer than 2 tag segments (no clear subject+topic) fails validation — subject and topic are required for the practice-session filters to function at all. A row with exactly 2 or 3 segments is valid; `subtopic`/`skillTag` are optional.

#### 5.5.3 Upload flow

1. `/admin/upload`: an admin uploads an `.xlsx` file matching the header row in 5.5.1 directly — there is no separate "download our template first" step, since the format is already standardized by the existing authoring process. Validate the header row on upload and reject immediately (before parsing any data rows) if required columns are missing.
2. Cloud Function `bulkUploadQuestions.ts` parses every populated row (stop at the first fully-blank row rather than iterating to the sheet's physical end) and validates each via `validateQuestionRow.ts` against the `question` zod schema plus the sheet-specific rules in 5.5.1–5.5.2.
3. Return a per-row validation report **before writing anything to Firestore** — this is a required preview-then-confirm flow, not a one-shot import, per the product PRD's "preview before commit" requirement. The report must show, per row: row number, overall pass/fail/warning, the parsed `subject`/`topic`/`subtopic`/`skillTag`, and specific flags for: malformed `Answer`, missing per-option explanations (warning, not blocking), non-empty `Comment` (warning, not blocking), fewer than 2 tag segments (blocking).
4. The admin can deselect individual rows before confirming (e.g. to exclude rows they want to fix in the source sheet first and re-upload later).
5. On confirm, accepted rows are written as `questions` documents with `status: 'draft'` — always draft, regardless of the sheet's own `Reviewed` value — requiring a second admin to move them through `in_review` to `published` via the question review UI (`/admin/questions`), where rows with a non-empty `authorNote` are visibly flagged (Section 3.2).
6. Images: not required for the primary bulk-upload path (Section 5.5.1). If a future sheet variant includes image references, handle as a separate, explicitly-detected code path rather than building it into the v1 importer speculatively.

### 5.6 Admin: review queue
`/admin/questions` lists questions filterable by `status`. An editor/admin can open any question, edit it inline, and change its status. A question can only reach `published` from `in_review`, and the reviewer (`reviewedById`) must differ from the author (`authorId`) — enforce this in a Firestore security rule or a Cloud Function trigger, not just client-side, since this is the core content-quality guarantee from the product PRD.

### 5.7 Error reports
Students can report an error from any `QuestionCard` (small "Report an issue" affordance near the bookmark/flag icons). This creates an `errorReports` document. `/admin/reports` lists open reports with a link to the flagged question for quick editing, and a resolve/dismiss action.

---

## 6. Authentication & authorization rules

Firestore security rules (`firestore.rules`) must enforce, at minimum:
- A user can read/write their own `users/{uid}` document only (except `role`, `isPremium`, `premiumExpiresAt`, which are Cloud-Function-only writes).
- A user can read `questions` only where `status == 'published'` and `tenantId` matches their own claim — except `editor`/`admin` roles, who can read/write all statuses within their tenant.
- A user can read/write only their own `sessions`, `userQuestionStats`.
- A user can **read** their own `dailyUsage/{userId}_{date}` document (so the settings/session-builder UI can show "42/100 today"), but cannot write to it directly — all writes happen server-side via the answer-submission path (Section 7.2).
- `errorReports` are createable by any authenticated user, but only readable/updatable by `editor`/`admin`.
- All role checks read `request.auth.token.role` (the custom claim), never a Firestore field. `isPremium`/`premiumExpiresAt` follow the same pattern as role: readable by the owning user, writable only by Cloud Functions — a client cannot set its own account to premium any more than it can grant itself an admin role.

Write and commit a `firestore.rules.test.ts` (using the Firebase Rules Unit Testing library) covering at minimum: a student cannot read draft questions, a student cannot write another student's session, an editor cannot publish their own authored question, cross-tenant reads are denied, a user cannot set their own `isPremium` field or write to another user's (or their own) `dailyUsage` document.

---

## 7. Monetization: ads + daily caps, with a paid unlimited/ad-free upgrade (Phase 6)

The product PRD's monetization model gates *volume*, never *content*: every registered user, paying or not, can see every subject, topic and question type. A free (non-`isPremium`) user is additionally subject to two daily caps — 100 answered questions and 60 minutes of timed-exam mode — and sees ad units on the dashboard and session-builder screens. Paying EGP 150/month (`isPremium: true`) removes both the ads and the caps in one upgrade. Because the caps have a real functional effect (unlike a purely cosmetic ad toggle), `isPremium` must be enforced server-side wherever a cap applies — never trust a client-reported value for anything that actually blocks or allows an action.

### 7.1 Ad placement
- Ad units render only on the dashboard (`app/(app)/dashboard/page.tsx`) and the practice/exam session-builder screens (`app/(app)/practice/page.tsx`, `app/(app)/exams/page.tsx`) — never on the question/answer screen itself (`[sessionId]/page.tsx` for either mode) and never during an active timed exam. This is a hard rule, not a default: the practice and exam-taking experience must render identically whether `isPremium` is `true` or `false`, minus the ad slot itself.
- Build a single reusable `components/ads/AdSlot.tsx` component that: renders nothing if `user.isPremium === true`; otherwise renders a banner ad unit in a fixed-size container (to avoid cumulative layout shift — reserve the space even while the ad script loads); fails gracefully to an empty, zero-visual-impact state if the ad network's script fails to load or is blocked by an ad blocker (never a broken layout, a console-error-driven crash, or a visible placeholder that looks broken).
- Provider: Google Ad Manager / AdSense. Integrate via their standard JS snippet, loaded asynchronously and only on pages that have an `AdSlot`, not globally in the root layout — this keeps the ad script off the marketing site, auth flow, and the question/exam screens entirely.
- `AdSlot` reads `isPremium` from the authenticated user's own document client-side — for *ad display only* this is fine to read client-side (a user spoofing "I'm premium" to see fewer ads client-side costs nothing but a wasted ad impression), but this client read must never be the same code path that decides whether a cap-limited action is allowed (Section 7.3).

### 7.2 Daily usage caps
- Track daily usage in a `dailyUsage/{userId}_{yyyy-mm-dd}` document (server timezone: use UTC-day boundaries for simplicity in v1, or Africa/Cairo local-day boundaries if that proves confusing to users near midnight — note the choice in `DECISIONS.md`):
  ```ts
  {
    userId: string;
    date: string;              // "2026-09-28"
    questionsAnswered: number; // incremented on each answer written in tutor OR exam mode
    examSeconds: number;       // incremented as timed-exam mode is used, independent of questionsAnswered
    updatedAt: Timestamp;
  }
  ```
- A non-`isPremium` user is capped at `questionsAnswered <= 100` and `examSeconds <= 3600` (60 minutes) per calendar day. These are independent counters — reaching one cap does not block the other mode.
- Both counters increment via the same server-side write path that already persists answers to `sessions.answers` (Section 5.2/5.3) — do this as part of the same Cloud Function/server action, not a separate client-triggered call, so a client cannot answer questions while skipping the counter update.

### 7.3 Cap enforcement (server-side, hard stop)
- Before creating a new practice session (`/practice`, Section 5.2) or starting/continuing a timed exam (`/exams`, Section 5.3), the server action checks the caller's `isPremium` flag (read via the Firebase Admin SDK from a trusted server context, never accepted as a parameter from the client) and, if `false`, checks today's `dailyUsage` document.
- If `questionsAnswered >= 100` and the user tries to start or continue a tutor-mode session: block the action server-side (the API/server action returns a specific "cap reached" result, not a generic error) and the UI shows a clear message — "You've hit today's 100-question limit — resets at midnight, or go unlimited for EGP 150/month" — with a direct link to the upgrade flow (Section 7.4).
- If `examSeconds >= 3600` and the user tries to start a new timed exam: same hard-stop pattern, message adapted to the exam-time cap. An exam already in progress when the cap is crossed mid-session is allowed to finish (do not cut off an exam the student is actively sitting) — the cap only blocks *starting* a new timed-exam session once the day's 60 minutes are already used up.
- This is a hard stop, not a soft warning: once a cap is reached, the blocked mode is fully unavailable until the next day resets it (or the user upgrades), per the product PRD's explicit choice of hard-stop behavior over a soft nudge.
- Firestore security rules must independently prevent a client from writing to its own `dailyUsage` document directly (writes only via the trusted server path in 7.2) and from writing `isPremium`/`premiumExpiresAt` on its own `users` document (Section 6) — the enforcement in this section is only meaningful if both of those are also closed off; a client that could self-report `isPremium: true` or reset its own `dailyUsage` counters would bypass this entirely.

### 7.4 Payment flow (removes ads + caps together)
- Provider: research and pick one aggregator supporting Fawry, Vodafone Cash, InstaPay and cards for Egypt (e.g. Paymob or Fawaterak — evaluate both against the product PRD's stated methods and note the choice + reasoning in `DECISIONS.md`; do not hardcode a specific provider without confirming API availability at build time).
- `createCheckout.ts` Cloud Function creates a checkout session/intent for a fixed EGP 150/month recurring charge (or the provider's closest equivalent to a recurring subscription — some Egyptian payment aggregators support tokenized recurring charges, others require a monthly manual re-charge flow; confirm which at build time and note the choice in `DECISIONS.md`) and returns a redirect URL.
- `webhookHandler.ts` verifies the provider's webhook signature, then sets `users/{uid}.isPremium = true` and `premiumExpiresAt` on successful payment; a scheduled Cloud Function (or the webhook itself, on a renewal/expiry event) flips `isPremium` back to `false` when `premiumExpiresAt` passes without a renewal — at which point both ads and the daily caps resume applying to that user going forward.
- A settings page (`app/(app)/settings/page.tsx`) shows the user's current status (free, with today's usage against both caps shown as a simple progress indicator — e.g. "42 / 100 questions today" — so a free user always knows where they stand before hitting the wall) and a "Go unlimited — EGP 150/mo" call to action if not currently premium, or "Unlimited until [date]" plus a cancel option if premium.

---

## 8. Non-functional requirements (engineering translation)

| Product PRD requirement | Engineering implementation |
|---|---|
| Question page load <2s on 4G | Server-render question data; lazy-load images with `next/image` and explicit width/height to avoid layout shift; keep the question bundle route-split from admin/marketing bundles. |
| No answer loss on connection drop | Write each answer optimistically to local state immediately, queue the Firestore write, retry with exponential backoff on failure; show a subtle "syncing…" indicator matching the design system's `tag` component if a write is pending >2s. |
| 99.5% availability | Inherent to Firebase/Vercel managed infra — no custom action needed beyond standard error boundaries and not self-hosting anything stateful. |
| 10,000 concurrent users | Avoid any query pattern that scans the full `questions` or `sessions` collection; every list view must be paginated and filtered by indexed fields (Section 3, indexes). |
| RTL + Arabic | Section 4.5. |
| Security (replace "God Mode") | Section 3.1, Section 6 — custom claims only, never a client-trusted role field. |
| Ads must not block/delay question or exam rendering | `AdSlot` loads asynchronously, is entirely absent from question/exam screens, and reserves fixed layout space to avoid shift (Section 7.1). |
| Graceful ad-block/ad-network-failure degradation | `AdSlot` fails to an empty container, never an error state or broken layout (Section 7.1). |

---

## 9. Testing requirements

- **Unit tests** (Vitest or Jest): zod schemas, `computeTopicAccuracy.ts`, session-scoring logic.
- **Firestore rules tests**: as specified in Section 6.
- **E2E tests** (Playwright): sign-up → onboarding → start a practice session → answer a question → see it reflected on the dashboard, as one full happy-path test. A second E2E test for the admin bulk-upload preview/confirm flow.
- Definition of done for any phase below includes: relevant tests written and passing, `pnpm build` succeeds with zero TypeScript errors, no `any` types introduced without a `// TODO` justification.

---

## 10. Build phases (execute in this order)

### Phase 1 — Foundation
- Repo scaffold per Section 2.
- Firebase project wiring (`lib/firebase/client.ts`, `admin.ts`), `firestore.rules` v1 (Section 6), `firestore.indexes.json`.
- Design tokens ported into `globals.css` + `tailwind.config.ts` (Section 4.1).
- Auth flow: sign-up, sign-in, onboarding (Section 5.1).
- `DECISIONS.md` created.
- **Done when:** a new user can sign up, complete onboarding, and land on an empty `/dashboard` shell; `firestore.rules.test.ts` passing for auth-related rules.

### Phase 2 — Core practice loop
- `questions`, `sessions`, `userQuestionStats` collections live.
- Seed script (`scripts/seed-firestore.ts`) loading ~50 sample published questions across 3–4 subjects for dev/testing.
- Practice session builder + question screen (Section 5.2), full port of `app-question.html` components.
- **Done when:** a student can start a tutor-mode session, answer all questions, see correct/incorrect state and explanations exactly matching the static design reference, and the session is marked `completedAt`.

### Phase 3 — Analytics & dashboard
- `userTopicStats` + `recomputeTopicStats.ts` Cloud Function.
- Dashboard page (Section 5.4), full port of `dashboard.html`.
- **Done when:** the dashboard reflects real accuracy data from at least one completed session, "Practise weak topics" correctly pre-fills the session builder.

### Phase 4 — Timed exams
- Timed exam mode (Section 5.3): countdown, deferred feedback, review screen.
- **Done when:** a full timed exam can be started, timed out or submitted early, and reviewed with all explanations visible.

### Phase 5 — Admin & content pipeline
- Question CRUD, review queue with author≠reviewer enforcement (Section 5.6).
- Excel bulk upload with preview/confirm (Section 5.5), built and tested against the real sample file `Copy_of_End_round_IM_193.xlsx` provided alongside this document — not a hypothetical template.
- Error reports queue (Section 5.7).
- **Done when:** the provided sample file (50 real questions) can be uploaded end-to-end: the validation preview correctly extracts subject/topic/subtopic/skillTag from the `Tags` column for all 50 rows, correctly flags the one row with a malformed `Answer` cell, correctly surfaces the 6 rows carrying a `Comment`, the admin can confirm the import, and the resulting draft questions can be reviewed and published by a different admin account.

### Phase 6 — Monetization: ads, daily caps, and the paid upgrade
- `AdSlot` component and Google Ad Manager/AdSense integration on the dashboard and session-builder screens only (Section 7.1).
- `dailyUsage` tracking wired into the existing answer-submission path, with server-side cap enforcement on session/exam start (Section 7.2, 7.3).
- Payment flow and webhook setting `isPremium`/`premiumExpiresAt` (Section 7.4).
- **Done when:** a newly registered (free) user sees ad units on the dashboard and session-builder screens but never on the question/exam screens, even mid-timed-exam; that same user is hard-blocked from starting a new tutor session after 100 questions answered in a day and from starting a new timed exam after 60 minutes of exam-mode use that day, with a clear message and upgrade link in both cases; an exam already in progress when the 60-minute cap is crossed is allowed to finish; a test payment (provider's sandbox/test mode) sets `isPremium: true` and both the ads and both caps are removed immediately with no other functional change; simulating an ad-block extension or a failed ad-script load leaves the layout intact with no visible breakage; a rules-test attempt to set `isPremium: true` or write to `dailyUsage` directly from a non-admin client is rejected.

### Phase 7 — Marketing site
- Full port of `index.html` (Section 4.3) as the logged-out `/` route.
- **Done when:** the marketing page matches the static reference pixel-for-pixel in both themes at desktop and mobile breakpoints.

### Phase 8 — Polish: RTL/Arabic, white-label scaffolding
- Arabic locale toggle, RTL verification across all Phase 1–7 screens.
- `tenants` collection wired (even if only one tenant exists in practice); confirm every query is tenant-scoped.
- **Done when:** switching locale to Arabic renders every built screen correctly in RTL with no visual breakage; a second tenant can theoretically be created without a data migration.

---

## 11. Explicit non-goals for this build

Do not build, even if it seems like an obvious add:
- Native mobile apps.
- Video/lecture content or any LMS features.
- AI-generated question authoring pipeline (manual/human-reviewed only, per product PRD Section 8).
- Multi-language content beyond English/Arabic.
- Social features (leaderboards beyond the percentile stat already specced, friend systems, chat).

---

## 12. Handoff artifacts expected from this build

- A running Next.js app connected to a Firebase project (dev/staging).
- `DECISIONS.md` fully filled in with every judgment call made.
- `firestore.rules.test.ts` and the Playwright E2E suite, both passing in CI (add a minimal GitHub Actions workflow running `pnpm build`, unit tests, and rules tests on every push).
- A short `SETUP.md` explaining how to point the app at a new Firebase project (env vars needed, Firestore indexes to deploy, Cloud Functions to deploy).

---

## 13. Open questions (do not block on these — flag and continue)

Carried over from the product PRD, still unresolved:
1. Final payment provider choice for the paid upgrade (Section 7.4).
2. Whether the chosen provider supports true recurring/tokenized billing for the EGP 150/month charge, or requires a manual monthly re-charge flow (Section 7.4) — this materially affects the churn/renewal UX and must be confirmed before building the payment flow, not assumed.
3. Ad frequency/density and exact placement within the dashboard and session-builder layouts (product PRD Section 12) — build `AdSlot` as a single reusable, easily-repositioned component (Section 4.3) so this can be tuned post-launch without a structural change.
4. Whether a white-label faculty tenant sees ads and daily caps at all (product PRD Section 12) — the `tenants` schema (Section 3.7) may need an `adsEnabled`/`capsEnabled` field once this is decided; not required for the Phase 1–7 build.
5. Whether the exact cap numbers (100 questions/day, 60 minutes exam-mode/day) hold up post-launch or need tuning (product PRD Section 6.6) — build the limits as named constants in one place (e.g. `lib/constants/limits.ts`), not scattered magic numbers, so they're a one-line change to adjust.
6. Whether Arabic ships at initial launch or follows in a fast-follow (architecture must support it either way — Section 4.5).

Note: check the pricing section of `index.html` in the delivered `pulseq-site.zip` against the current model before porting it in Phase 7 (Section 4.3) — it currently shows a two-card Free/Ad-free layout but predates the 100-question/60-minute daily caps being added, so its copy undersells what the paid tier removes (caps, not just ads). Update the copy to mention both when porting, rather than porting it verbatim.
