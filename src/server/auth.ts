import 'server-only';
import { cookies } from 'next/headers';
import { signSession, SESSION_COOKIE, type SessionUser } from './session';

export {
  signSession,
  verifySession,
  SESSION_COOKIE,
  type SessionUser,
} from './session';

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? (await import('./session')).verifySession(token) : null;
}
