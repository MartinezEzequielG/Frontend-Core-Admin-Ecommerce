import { NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001/api/V1';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const upstream = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || 'Invalid credentials' },
        { status: upstream.status },
      );
    }

    const resp = NextResponse.json({ user: data.user });

    // @ts-expect-error: getSetCookie no está tipado en todos los entornos
    const setCookies: string[] | undefined = upstream.headers.getSetCookie?.();

    if (setCookies?.length) {
      for (const c of setCookies) resp.headers.append('set-cookie', c);
    } else {
      const single = upstream.headers.get('set-cookie');
      if (single) resp.headers.append('set-cookie', single);
    }

    return resp;
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || 'Login route failed' },
      { status: 500 },
    );
  }
}