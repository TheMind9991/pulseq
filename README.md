# PulseQ

A curriculum-aligned question bank and exam-practice platform for Egyptian medical students,
built around the Kasr Al Ainy curriculum.

See `PulseQ_PRD.md` (product) and `PulseQ_Engineering_PRD.md` (engineering build spec) for the
full requirements. `DECISIONS.md` logs judgment calls made where the spec left a choice open.

## Status

Phases 1-2 of the 8-phase build plan (engineering spec Section 10) are in place: auth,
onboarding, design tokens, Firestore security rules, and the tutor-mode practice loop (session
builder, question screen, scoring, `userQuestionStats`). Subsequent phases (analytics/dashboard,
timed exams, admin/content pipeline, monetization, marketing site, i18n/white-label) are not yet
built.

## Tech stack

- Next.js 14 (App Router), TypeScript (strict)
- Firebase: Firestore, Auth, Storage, Cloud Functions
- Tailwind CSS
- react-hook-form + zod (shared client/server validation)
- Vitest (unit + Firestore rules tests), Playwright (e2e)
- pnpm

## Getting started

See `SETUP.md` for the full checklist (Firebase project, env vars, indexes, functions deploy).
Quick start once `.env.local` is filled in from `.env.example`:

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `next lint` |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:rules` | Firestore security rules tests (spins up the Firestore emulator) |
| `pnpm test:e2e` | Playwright e2e tests (needs the Firebase emulators running — see SETUP.md) |
| `pnpm seed` | Seed dev-only sample questions into Firestore (real project or emulator) |

Cloud Functions live in `functions/` as a separate package — see `functions/package.json` and
`SETUP.md` for building/deploying them.
