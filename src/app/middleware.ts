import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) {
    const res = NextResponse.next();
    res.headers.set('x-mw', 'hit-non-admin');
    return res;
  }

  const token = req.cookies.get('token')?.value?.trim();

  if (!token) {
    const login = req.nextUrl.clone();
    login.pathname = '/login';
    login.searchParams.set('next', pathname);

    const res = NextResponse.redirect(login);
    res.headers.set('x-mw', 'redirect-no-token');
    return res;
  }

  const res = NextResponse.next();
  res.headers.set('x-mw', 'pass-has-token');
  return res;
}

export const config = { matcher: ['/admin', '/admin/:path*'] };