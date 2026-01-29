import { NextResponse } from 'next/server';

function normalizeBase(raw: string) {
  // quita trailing slash
  let base = (raw || '').trim().replace(/\/+$/, '');

  // corrige /api/V1 -> /api/v1
  base = base.replace(/\/api\/V1\b/g, '/api/v1');

  // si alguien pasó solo host (sin /api/v1), no lo invento acá
  return base;
}

const API_BASE = normalizeBase(
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.BACKEND_API_URL ??
    'http://localhost:3001/api/v1',
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const url = `${API_BASE}/auth/login`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
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

    // Forward set-cookie from backend if present (useful if backend sets refresh/session cookie)
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) resp.headers.append('set-cookie', setCookie);

    // token cookie used by your Next routes
    if (data?.access_token) {
      resp.cookies.set('token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        // maxAge is seconds (1 hour)
        maxAge: 60 * 60,
      });
    }

    return resp;
  } catch (e: any) {
    // opcional: log en dev para ver URL/errores reales
    if (process.env.NODE_ENV !== 'production') {
      console.error('[login route] failed', e);
      console.error('[login route] API_BASE =', API_BASE);
    }

    return NextResponse.json(
      { message: e?.message || 'Login route failed' },
      { status: 500 },
    );
  }
}
