import { NextRequest, NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001/api/V1';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const productId = Number(id);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ message: 'Invalid product id' }, { status: 400 });
    }

    const res = await fetch(`${API_BASE}/admin/products/${productId}/images/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ message: text || 'Link failed' }, { status: res.status });
    }

    return new NextResponse(text, { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Internal error' }, { status: 500 });
  }
}