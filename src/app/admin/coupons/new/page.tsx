import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import PageHeader from '@/components/admin/ui/PageHeader';

export default function NewCouponPage() {
  const create = async (fd: FormData) => {
  'use server';

  const token = (await cookies()).get('token')?.value;

  const expiresAtRaw = String(fd.get('expiresAt') || '').trim();

  const body = {
    code: String(fd.get('code') || '').trim().toUpperCase(),
    type: String(fd.get('type') || 'PERCENT'),
    value: Number(fd.get('value') || 0),
    active: fd.get('active') ? true : false,
    ...(expiresAtRaw
      ? { expiresAt: new Date(`${expiresAtRaw}T00:00:00.000Z`).toISOString() }
      : {}),
  };

  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (res.status === 401) redirect('/login');

  if (!res.ok) {
    revalidatePath('/admin/coupons');
    redirect('/admin/coupons/new?error=1');
  }

  revalidatePath('/admin/coupons');
  redirect('/admin/coupons?saved=1');
};

  return (
    <main className="admin-page">
      <PageHeader title="Nuevo cupón" subtitle="Creá un cupón y definí su validez." />

      <section className="card" style={{ maxWidth: 520 }}>
        <form action={create} style={{ display: 'grid', gap: 10 }}>
          <input name="code" placeholder="CODE123" required className="input" />

          <select name="type" defaultValue="PERCENT" className="select">
            <option value="PERCENT">PERCENT</option>
            <option value="FIXED">FIXED</option>
          </select>

          <input name="value" type="number" step="0.01" placeholder="Valor" required className="input" />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" name="active" defaultChecked /> Activo
          </label>

          <input name="expiresAt" type="date" className="input" />

          <button type="submit" className="btn btn-primary">
            Crear
          </button>
        </form>
      </section>
    </main>
  );
}