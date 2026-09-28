'use client';

import type { User } from 'firebase/auth';

// Bridges Firebase client-side auth state to an httpOnly session cookie so server
// components (getServerUser.ts) can gate routes without shipping the ID token to
// client-readable storage. Called directly after sign-in/sign-up (so navigation that
// depends on the cookie doesn't race it) and again on background token refresh /
// sign-out via AuthSync.tsx.
export async function establishSessionCookie(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error('Failed to establish session');
  }
}

export async function clearSessionCookie(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
}
