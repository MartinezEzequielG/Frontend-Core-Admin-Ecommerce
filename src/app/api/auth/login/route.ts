import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${process.env.BACKEND_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const data = await res.json(); // { access_token, user }
  const resp = NextResponse.json({ user: data.user });
  resp.cookies.set('token', data.access_token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  return resp;
}