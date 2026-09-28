'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, type User } from 'firebase/auth';
import { auth, googleAuthProvider } from '@/lib/firebase/client';
import { establishSessionCookie } from '@/lib/auth/session';
import { Button } from '@/components/ui/Button';

function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === 'auth/email-already-in-use') return 'An account with that email already exists.';
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  return 'Something went wrong. Please try again.';
}

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function afterSignIn(user: User) {
    await establishSessionCookie(user);
    router.push('/onboarding');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await afterSignIn(credential.user);
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  async function onGoogleSignUp() {
    setError(null);
    setSubmitting(true);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      await afterSignIn(credential.user);
    } catch {
      setError('Google sign-up failed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-medium text-primary">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-secondary">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-secondary">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          Sign up
        </Button>
      </form>
      <div className="my-4 flex items-center gap-2 text-xs text-muted">
        <div className="h-px flex-1 bg-subtle" />
        or
        <div className="h-px flex-1 bg-subtle" />
      </div>
      <Button variant="secondary" onClick={onGoogleSignUp} disabled={submitting} className="w-full">
        Continue with Google
      </Button>
      <p className="mt-6 text-center text-sm text-secondary">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
