'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { userConverter } from '@/lib/firebase/converters';
import type { UserDoc } from '@/types';

interface UseUserResult {
  user: User | null; // Firebase Auth identity
  profile: UserDoc | null; // users/{uid} Firestore document (null until onboarding completes)
  loading: boolean;
}

// Client hook for auth state + the live profile doc. Never used for authorization decisions —
// role/isPremium here are for UI display only; every enforced check happens server-side
// against the custom claim or a trusted server read (Section 6, 7.3).
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      if (!nextUser) {
        setProfile(null);
        setProfileLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    return onSnapshot(
      doc(db, 'users', user.uid).withConverter(userConverter),
      (snapshot) => {
        setProfile(snapshot.exists() ? snapshot.data() : null);
        setProfileLoading(false);
      },
      () => setProfileLoading(false),
    );
  }, [user]);

  return { user, profile, loading: authLoading || profileLoading };
}
