import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const api = process.env.BACKEND_API_URL!;
  const formData = await req.formData();

  const res = await fetch(`${api}/admin/uploads/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const text = await res.text();
  if (!res.ok) return NextResponse.json({ message: text || 'Upload failed' }, { status: res.status });
  return new NextResponse(text, { headers: { 'Content-Type': 'application/json' } });
}