'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut(auth); // AuthSync's onIdTokenChanged listener clears the session cookie
        router.push('/sign-in');
      }}
      className="text-sm text-secondary hover:text-primary"
    >
      Sign out
    </button>
  );
}
