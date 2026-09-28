'use client';

import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, GoogleAuthProvider, connectAuthEmulator, getAuth } from 'firebase/auth';
import { type Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { type FirebaseStorage, connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

// 'use client' modules are still evaluated once during SSR/static prerendering (to produce the
// initial HTML), but every consumer here only ever touches auth/db/storage inside a useEffect
// or an event handler — i.e. strictly after the browser has mounted. Guarding construction to
// the browser avoids Auth's eager apiKey-format validation (`auth/invalid-api-key`) from
// crashing the server render/build before NEXT_PUBLIC_FIREBASE_* env vars are configured.
const isBrowser = typeof window !== 'undefined';

export const auth: Auth = isBrowser ? getAuth(firebaseApp) : (undefined as unknown as Auth);
export const db: Firestore = isBrowser ? getFirestore(firebaseApp) : (undefined as unknown as Firestore);
export const storage: FirebaseStorage = isBrowser
  ? getStorage(firebaseApp)
  : (undefined as unknown as FirebaseStorage);
export const googleAuthProvider = new GoogleAuthProvider();

// Local dev against `firebase emulators:start`, no real Firebase project needed — see SETUP.md.
// Mirrors src/lib/firebase/admin.ts's FIRESTORE_EMULATOR_HOST/FIREBASE_AUTH_EMULATOR_HOST
// detection on the server side. Guarded against Next.js Fast Refresh re-running this module and
// calling connect*Emulator twice on the same instance, which throws.
if (isBrowser && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  const globalWithFlag = globalThis as typeof globalThis & { __pulseqEmulatorsConnected?: boolean };
  if (!globalWithFlag.__pulseqEmulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    globalWithFlag.__pulseqEmulatorsConnected = true;
  }
}
