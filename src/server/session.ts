import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/helpers/env';

export type SessionUser = { userId: string; email: string };
export const SESSION_COOKIE = 'session';
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
