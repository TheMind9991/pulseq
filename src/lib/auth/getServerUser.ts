import 'server-only';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import type { UserRole } from '@/lib/schemas/user';

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
// can treat it as "signed out."
export async function getServerUser(): Promise<ServerUser | null> {
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
}
