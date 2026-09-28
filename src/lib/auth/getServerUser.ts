import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { UserRole } from '@/lib/schemas/user';
import type { UserDoc } from '@/types';

export interface ServerUser {
  uid: string;
  email: string | undefined;
  role: UserRole | undefined; // undefined until the setCustomClaims function has run
  tenantId: string | undefined;
}

// Server-only. Reads the httpOnly session cookie set by /api/auth/session and verifies it
// against Firebase Auth — this, not any Firestore field, is the trusted source for role and
// tenantId (Section 6: "All role checks read request.auth.token.role... never a Firestore
// field"). Returns null for a missing/expired/revoked session rather than throwing, so callers
// can treat it as "signed out." Wrapped in React's `cache()` so every server component/action
// invoked while handling one request shares a single verification instead of re-checking the
// cookie per call.
export const getServerUser = cache(async (): Promise<ServerUser | null> => {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role as UserRole | undefined,
      tenantId: decoded.tenantId as string | undefined,
    };
  } catch {
    return null;
  }
});

export interface CurrentProfile {
  uid: string;
  profile: UserDoc;
}

// Checked directly against Firestore (trusted admin-SDK read, bypasses rules) rather than the
// role/tenantId custom claim, since the claim may not have propagated yet immediately after
// onboarding writes the doc (setCustomClaims.ts runs async on its Cloud Function trigger).
// Returns null if signed out OR not yet onboarded (no users/{uid} doc) — callers under (app)
// can treat either as "redirect", since AppLayout already guarantees both before rendering.
// Also `cache()`-wrapped: (app)/layout.tsx and every page/action under it that needs the
// profile share one Firestore read per request instead of each re-fetching it.
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const serverUser = await getServerUser();
  if (!serverUser) return null;

  const snapshot = await getAdminDb().collection('users').doc(serverUser.uid).get();
  if (!snapshot.exists) return null;

  return { uid: serverUser.uid, profile: snapshot.data() as UserDoc };
});
