'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '@/lib/firebase/client';
import { establishSessionCookie } from '@/lib/auth/session';
import { Button } from '@/components/ui/Button';

function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password.';
  }
  return 'Something went wrong. Please try again.';
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function afterSignIn(user: User) {
    await establishSessionCookie(user);
    router.push('/dashboard');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await afterSignIn(credential.user);
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  async function onGoogleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      await afterSignIn(credential.user);
    } catch {
      setError('Google sign-in failed. Please try again.');
      setSubmitting(false);
    }
  }

  async function onForgotPassword() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Enter your email above first, then click "Forgot password?"');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice('Password reset email sent.');
    } catch {
      setError('Could not send reset email. Check the address and try again.');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-medium text-primary">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-secondary">
            Email
          </label>
          <input
            id="email"
            type="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="text-sm text-secondary">
              Password
            </label>
            <button type="button" onClick={onForgotPassword} className="text-xs text-accent hover:underline">
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            dir="ltr"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {notice && <p className="text-sm text-success">{notice}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          Sign in
        </Button>
      </form>
      <div className="my-4 flex items-center gap-2 text-xs text-muted">
        <div className="h-px flex-1 bg-subtle" />
        or
        <div className="h-px flex-1 bg-subtle" />
      </div>
      <Button variant="secondary" onClick={onGoogleSignIn} disabled={submitting} className="w-full">
        Continue with Google
      </Button>
      <p className="mt-6 text-center text-sm text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
