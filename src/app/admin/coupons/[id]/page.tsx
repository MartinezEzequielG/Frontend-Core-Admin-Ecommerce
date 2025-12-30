import { backendFetch } from '@/lib/backend';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export default async function CouponDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await backendFetch(`/admin/coupons/${id}`);
  if (!c) return <main style={{ padding: 24 }}><p>Acceso denegado.</p></main>;
  return (
    <main style={{ padding: 24 }}>
      <h1>{c.code}</h1>
      <form action={update.bind(null, Number(id))} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <input name="code" defaultValue={c.code} required />
        <select name="type" defaultValue={c.type}>
          <option value="PERCENT">PERCENT</option>
          <option value="FIXED">FIXED</option>
        </select>
        <input name="value" type="number" step="0.01" defaultValue={c.value} required />
        <label><input type="checkbox" name="active" defaultChecked={c.active} /> Activo</label>
        <input name="expiresAt" type="date" defaultValue={c.expiresAt ? c.expiresAt.slice(0, 10) : ''} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit">Guardar</button>
          <form action={remove.bind(null, Number(id))}>
            <button type="submit" style={{ background: 'crimson', color: 'white' }}>Eliminar</button>
          </form>
        </div>
      </form>
    </main>
  );
}

async function update(id: number, fd: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const body = {
    code: String(fd.get('code') || '').trim(),
    type: String(fd.get('type') || 'PERCENT'),
    value: Number(fd.get('value') || 0),
    active: fd.get('active') ? true : false,
    expiresAt: fd.get('expiresAt') ? new Date(String(fd.get('expiresAt'))) : undefined,
  };
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/coupons/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath(`/admin/coupons/${id}`);
}

async function remove(id: number) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/coupons/${id}`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath('/admin/coupons');
}