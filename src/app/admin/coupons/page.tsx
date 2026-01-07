import Link from 'next/link';
import { API, backendFetch } from '@/lib/backend';

type AdminCoupon = {
  id: number;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  active: boolean;
  expiresAt?: string | null;
  createdAt?: string;
};

export default async function CouponsList() {
  const items = await backendFetch<AdminCoupon[]>(
    '/admin/coupons?limit=20&page=1&sort=createdAt:desc',
  );

  if (!items) {
    return (
      <main style={{ padding: 24 }}>
        <p>Acceso denegado.</p>
      </main>
    );
  }

  const exportUrl = `${API}/admin/coupons/export`;

  return (
    <main style={{ padding: 24 }}>
      <h1>Cupones</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Link href="/admin/coupons/new">+ Nuevo</Link>
        <a href={exportUrl}>Export CSV</a>
      </div>

      <ul style={{ marginTop: 12 }}>
        {items.map((c) => (
          <li key={c.id}>
            <Link href={`/admin/coupons/${c.id}`}>{c.code}</Link> — {c.type} — {c.value} —{' '}
            {c.active ? 'Activo' : 'Inactivo'}
          </li>
        ))}
      </ul>
    </main>
  );
}