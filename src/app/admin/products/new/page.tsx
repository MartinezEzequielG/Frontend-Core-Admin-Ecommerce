import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { slugify } from '@/lib/slug';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { API, backendFetch } from '@/lib/backend';

type AdminCategory = { id: number; name: string; slug: string };

async function createProduct(formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const name = String(formData.get('name') || '').trim();
  const slugInput = String(formData.get('slug') || '');
  const slug = (slugInput ? slugify(slugInput) : slugify(name)) || '';
  const basePrice = Number(formData.get('basePrice') || 0);
  const salePrice = formData.get('salePrice') ? Number(formData.get('salePrice')) : null;
  const sku = formData.get('sku') ? String(formData.get('sku')) : null;
  const categoryId = formData.get('categoryId') ? Number(formData.get('categoryId')) : null;
  const featured = Boolean(formData.get('featured'));
  const active = Boolean(formData.get('active'));

  if (!name) throw new Error('Nombre requerido');
  if (!slug) throw new Error('Slug inválido');
  if (Number.isNaN(basePrice) || basePrice <= 0) throw new Error('Precio base inválido');

  const res = await fetch(`${API}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ name, slug, basePrice, salePrice, sku, categoryId, featured, active }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => 'Error al crear');
    throw new Error(msg);
  }

  const prod = await res.json();
  revalidatePath(`/admin/products/${prod.id}`);
  redirect(`/admin/products/${prod.id}`);
}

export default async function NewProductPage() {
  const categories =
    (await backendFetch<AdminCategory[]>('/admin/categories').catch(() => null)) ?? [];

  return (
    <main className="admin-content">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Nuevo producto</h1>
        <Link href="/admin/products" className="btn btn-outline">Volver</Link>
      </header>

      <form action={createProduct} className="card" style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="text-sm" htmlFor="name">Nombre</label>
            <input id="name" name="name" placeholder="Nombre" required className="input" />
            <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>Usá un nombre claro y único.</p>
          </div>
          <div>
            <label className="text-sm" htmlFor="slug">Slug</label>
            <input id="slug" name="slug" placeholder="Slug (opcional)" className="input" />
            <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>Se autogenera si lo dejás vacío.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div>
            <label className="text-sm" htmlFor="basePrice">Precio base</label>
            <input id="basePrice" name="basePrice" type="number" step="0.01" placeholder="0.00" required className="input" />
          </div>
          <div>
            <label className="text-sm" htmlFor="salePrice">Precio oferta</label>
            <input id="salePrice" name="salePrice" type="number" step="0.01" placeholder="Opcional" className="input" />
          </div>
          <div>
            <label className="text-sm" htmlFor="sku">SKU</label>
            <input id="sku" name="sku" placeholder="SKU (opcional)" className="input" />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr 1fr' }}>
          <div>
            <label className="text-sm" htmlFor="categoryId">Categoría</label>
            <select id="categoryId" name="categoryId" className="select" defaultValue="">
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="featured" /> Destacado
          </label>
          <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="active" defaultChecked /> Activo
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary">Crear producto</button>
          <Link href="/admin/products" className="btn btn-outline">Cancelar</Link>
        </div>

        <div className="card" style={{ background: '#f9fafb' }}>
          <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
            Tip: Podés subir imágenes y gestionar variantes después de crear el producto desde la vista de detalle.
          </p>
        </div>
      </form>
    </main>
  );
}