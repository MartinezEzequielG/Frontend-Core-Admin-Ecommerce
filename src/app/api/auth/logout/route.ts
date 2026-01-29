import { NextResponse } from 'next/server';

function cookieBase() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax' as 'none' | 'lax',
  };
}

export async function POST() {
  const resp = NextResponse.json({ ok: true });

  resp.cookies.set('token', '', { ...cookieBase(), maxAge: 0 });
  resp.cookies.set('csrf', '', { ...cookieBase(), httpOnly: false, maxAge: 0 });

  return resp;
}
