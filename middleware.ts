import { NextResponse, type NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/server/session';

const PUBLIC = ['/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Published articles are readable without a session.
  if (PUBLIC.includes(pathname) || pathname.startsWith('/p/'))
    return NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token && (await verifySession(token))) return NextResponse.next();
  if (pathname.startsWith('/api/'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.png$).*)',
  ],
};
