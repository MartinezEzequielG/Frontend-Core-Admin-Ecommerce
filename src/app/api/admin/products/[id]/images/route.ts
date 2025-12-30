import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params; // importante: await
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const api = process.env.BACKEND_API_URL!;
  const body = await req.json().catch(() => ({} as any));
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const position = Number(body?.position ?? 0);

  if (!url) return NextResponse.json({ message: 'Missing url' }, { status: 400 });

  const productId = Number(id);
  if (!Number.isFinite(productId)) return NextResponse.json({ message: 'Invalid product id' }, { status: 400 });

  const res = await fetch(`${api}/admin/products/${productId}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url, position }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('Link image failed:', res.status, text);
    return NextResponse.json({ message: text || 'Link failed' }, { status: res.status });
  }
  return new NextResponse(text, { headers: { 'Content-Type': 'application/json' } });
}