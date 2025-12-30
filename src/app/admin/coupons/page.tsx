import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

export default async function CouponsList() {
  const items = await backendFetch('/admin/coupons?limit=20&page=1&sort=createdAt:desc');
  if (!items) return <main style={{ padding: 24 }}><p>Acceso denegado.</p></main>;
  const exportUrl = `${process.env.BACKEND_API_URL}/admin/coupons/export`;
  return (
    <main style={{ padding: 24 }}>
      <h1>Cupones</h1>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <a href="/admin/coupons/new">+ Nuevo</a>
        <a href={exportUrl}>Export CSV</a>
      </div>
      <ul style={{ marginTop: 12 }}>
        {items.map((c: any) => (
          <li key={c.id}>
            <a href={`/admin/coupons/${c.id}`}>{c.code}</a> — {c.type} — {c.value} — {c.active ? 'Activo' : 'Inactivo'}
          </li>
        ))}
      </ul>
    </main>
  );
}