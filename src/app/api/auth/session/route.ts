import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';

const SESSION_COOKIE_NAME = 'session';
const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function POST(request: Request) {
  const { idToken } = await request.json();
  if (typeof idToken !== 'string' || !idToken) {
    return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
  }

  try {
    // Reject stale tokens before minting a long-lived session cookie from them.
    await getAdminAuth().verifyIdToken(idToken);
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
  }
}

export async function DELETE() {
  cookies().delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
