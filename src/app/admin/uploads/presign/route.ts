import { cookies } from 'next/headers';

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001/api/v1';

export async function POST(req: Request) {
  const token = (await cookies()).get('token')?.value; // cookie HttpOnly OK
  if (!token) return Response.json({ message: 'Missing token cookie' }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${API_BASE}/admin/uploads/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await res.text();
  const ct = res.headers.get('content-type') || '';

  if (!res.ok) {
    return new Response(text || 'Unauthorized', { status: res.status });
  }

  if (!ct.includes('application/json')) {
    return new Response(text, { status: 502 });
  }

  return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
}
