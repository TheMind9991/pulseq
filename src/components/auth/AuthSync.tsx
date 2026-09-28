'use client';

import { useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { clearSessionCookie, establishSessionCookie } from '@/lib/auth/session';

// Mounted once in the root layout. Keeps the httpOnly session cookie aligned with Firebase's
// client-side auth state: refreshes it whenever the ID token is renewed (Firebase does this
// automatically ~hourly), and clears it on sign-out. The initial post-sign-in cookie is set
// directly by the sign-in/sign-up forms (awaited before navigating) to avoid a race with this
// listener's async firing.
export function AuthSync() {
  useEffect(() => {
    return onIdTokenChanged(auth, (user) => {
      if (user) {
        void establishSessionCookie(user);
      } else {
        void clearSessionCookie();
      }
    });
  }, []);

  return null;
}
