# Setup

How to point this app at a (new or existing) Firebase project — or run entirely against the
local emulators with no Firebase project at all (see "Emulator-only local dev" below), useful
for trying out the app or running the practice-loop flow without any real credentials.

## 1. Create/select a Firebase project

In the [Firebase Console](https://console.firebase.google.com/), create a project (or use an
existing one) with:
- **Authentication** enabled, with the **Email/Password** and **Google** sign-in providers turned on.
- **Firestore** enabled (production mode).
- **Storage** enabled.

## 2. Client SDK env vars

Firebase Console → Project settings → General → "Your apps" → add a Web app (if none exists) →
copy the config values into `.env.local` (copy `.env.example` as a starting point):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These are safe to expose to the browser (that's what `NEXT_PUBLIC_` means) — they identify the
project, they don't grant access on their own.

## 3. Admin SDK env vars (server-only secret)

Firebase Console → Project settings → Service accounts → "Generate new private key" → downloads
a JSON file. From it, set:

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

`FIREBASE_PRIVATE_KEY` is the `private_key` field from the downloaded JSON, pasted as-is
(`src/lib/firebase/admin.ts` un-escapes literal `\n` sequences, which is how most env var
systems — including Vercel and most CI providers — store multi-line secrets). **Never commit
this value or the downloaded JSON file** — `.gitignore` already excludes `.env*`.

## 4. Deploy Firestore indexes and security rules

Requires the Firebase CLI (`firebase-tools`, already a devDependency — run via `pnpm exec
firebase` or install globally):

```bash
pnpm exec firebase login
pnpm exec firebase use --add   # select the project, give it an alias e.g. "default"
pnpm exec firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 5. Deploy Cloud Functions

```bash
cd functions
pnpm install
pnpm build
cd ..
pnpm exec firebase deploy --only functions
```

## 6. Run locally

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000`. Sign up, complete onboarding, and you should land on an empty
`/dashboard`. Check the Cloud Functions logs (`pnpm exec firebase functions:log`, or the Firebase
Console) to confirm `setCustomClaims` ran and set the `role`/`tenantId` custom claim after
onboarding.

## 7. Testing

- `pnpm test` — unit tests, no Firebase project needed.
- `pnpm test:rules` — Firestore security rules tests. Runs entirely against the **local Firestore
  emulator** (no real project needed), but requires Java (the emulator's runtime) to be
  installed.
- `pnpm test:e2e` — Playwright e2e tests (not yet added as of Phase 1).

## Emulator-only local dev (no Firebase project needed)

Useful for trying the app out, or for running the practice loop end-to-end, without setting up
any real Firebase project or credentials:

```bash
# terminal 1 — starts Firestore + Auth + Storage emulators
pnpm exec firebase emulators:start

# terminal 2 — seed dev questions into the emulator, then run the app against it
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-pulseq pnpm seed
pnpm dev
```

With `.env.local` set as shown commented-out in `.env.example` (`NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`
plus the placeholder `NEXT_PUBLIC_FIREBASE_API_KEY`/`NEXT_PUBLIC_FIREBASE_PROJECT_ID` and the two
`*_EMULATOR_HOST` vars), both the client SDK (`src/lib/firebase/client.ts`) and the admin SDK
(`src/lib/firebase/admin.ts`) automatically route to the emulators instead of a real project —
sign-up, onboarding, and practice sessions all work against emulator-local data that resets when
the emulator stops. The Firebase Auth emulator accepts any email/password (no real email
delivery, no Google sign-in popup — use the emulator UI at `http://127.0.0.1:4000` if you need to
inspect users directly).

## Notes

- The design tokens in `src/styles/globals.css` / `tailwind.config.ts` are currently
  placeholders — see `DECISIONS.md` for what to replace once the real `pulseq-site.zip` design
  system is available.
- Default tenant is `"pulseq-core"` (Section 3 of the engineering spec) — every document written
  today uses it; white-label multi-tenancy is a later phase.
