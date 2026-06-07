import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from '@/helpers/env';

export type SessionUser = { userId: string; email: string };
const COOKIE = 'session';
const key = () => new TextEncoder().encode(env.authSecret());

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(key());
}
export async function verifySession(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    return { userId: String(payload.userId), email: String(payload.email) };
  } catch {
    return null;
  }
}
export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}
export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verifySession(token) : null;
}
export const SESSION_COOKIE = COOKIE;
