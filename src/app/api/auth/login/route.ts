import { NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001/api/V1';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        { message: text || 'Invalid credentials' },
        { status: res.status },
      );
    }

    const data = await res.json(); // { access_token, user }
    const resp = NextResponse.json({ user: data.user });

    resp.cookies.set('token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return resp;
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || 'Login route failed' },
      { status: 500 },
    );
  }
}