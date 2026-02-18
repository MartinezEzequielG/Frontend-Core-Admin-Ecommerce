import { NextRequest, NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001/api/v1';

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await ctx.params;

    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const productId = Number(id);
    const imgId = Number(imageId);

    if (!Number.isFinite(productId) || !Number.isFinite(imgId)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
    }

    // ✅ BACKEND REAL: PATCH /admin/products/:id con payload delete
    const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        images: {
          delete: { id: imgId },
        },
      }),
      cache: 'no-store',
    });

    const text = await res.text().catch(() => '');

    if (!res.ok) {
      return NextResponse.json(
        { message: text || 'Delete failed' },
        { status: res.status }
      );
    }

    // si backend devuelve JSON, lo pasamos, si no devolvemos ok
    return text
      ? new NextResponse(text, { headers: { 'Content-Type': 'application/json' } })
      : NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Internal error' }, { status: 500 });
  }
}
