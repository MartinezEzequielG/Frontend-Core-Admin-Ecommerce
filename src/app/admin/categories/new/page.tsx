import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

async function createCategory(formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const parentId = formData.get('parentId') ? Number(formData.get('parentId')) : null;

  if (!name) throw new Error('Nombre requerido');
  if (!slug) throw new Error('Slug requerido');

  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ name, slug, parentId }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await res.text());
  redirect('/admin/categories');
}

export default async function NewCategory({
  searchParams,
}: {
  searchParams?: { parentId?: string };
}) {
  const parentId = searchParams?.parentId ?? '';

  const categories = (await backendFetch<any[]>('/admin/categories').catch(() => [])) ?? [];

  return (
    <main className="admin-content">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Nueva categoría</h1>
        <Link href="/admin/categories" className="btn btn-outline">Volver</Link>
      </header>

      <form action={createCategory} className="card" style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="text-sm" htmlFor="name">Nombre</label>
            <input id="name" name="name" placeholder="Nombre" required className="input" />
            <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>Ej: Anteojos, Accesorios.</p>
          </div>
          <div>
            <label className="text-sm" htmlFor="slug">Slug</label>
            <input id="slug" name="slug" placeholder="slug-del-item" required className="input" />
            <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>Usa minúsculas y guiones.</p>
          </div>
        </div>

        <div>
          <label className="text-sm" htmlFor="parentId">Padre (opcional)</label>
          <select id="parentId" name="parentId" className="select" defaultValue={parentId || ''}>
            <option value="">Sin padre</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>Defínelo para crear una subcategoría.</p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary">Crear</button>
          <Link href="/admin/categories" className="btn btn-outline">Cancelar</Link>
        </div>
      </form>
    </main>
  );
}