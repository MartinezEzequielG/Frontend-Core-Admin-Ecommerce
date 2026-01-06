import { backendFetch } from '@/lib/backend';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  description?: string | null;
  imageUrl?: string | null;
};

export default async function CategoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cats = await backendFetch<AdminCategory[]>('/admin/categories');
  if (!cats) return <main className="admin-content"><p>Acceso denegado.</p></main>;

  const cat = cats.find((c) => c.id === Number(id));
  if (!cat) return <main className="admin-content"><p>No encontrada</p></main>;

  return (
    <main className="admin-content">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>{cat.name}</h1>
          <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>Slug: {cat.slug}</p>
        </div>
        <Link href="/admin/categories" className="btn btn-outline">Volver</Link>
      </header>

      <section className="card" style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <EditForm cat={cat} />
        <DeleteForm id={cat.id} />
      </section>
    </main>
  );
}

async function updateCategory(id: number, formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const body = {
    name: String(formData.get('name') || '').trim(),
    slug: String(formData.get('slug') || '').trim(),
    parentId: formData.get('parentId') ? Number(formData.get('parentId')) : null,
  };
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath(`/admin/categories/${id}`);
}

async function deleteCategory(id: number) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/categories/${id}`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath('/admin/categories');
}

function EditForm({ cat }: { cat: any }) {
  return (
    <form action={updateCategory.bind(null, cat.id)} className="card" style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label className="text-sm">Nombre</label>
          <input name="name" defaultValue={cat.name} required className="input" />
        </div>
        <div>
          <label className="text-sm">Slug</label>
          <input name="slug" defaultValue={cat.slug} className="input" />
        </div>
      </div>
      <div>
        <label className="text-sm">Padre</label>
        <input name="parentId" type="number" defaultValue={cat.parentId ?? ''} placeholder="ParentId (opcional)" className="input" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary">Guardar</button>
        <Link href="/admin/categories" className="btn btn-outline">Cancelar</Link>
      </div>
    </form>
  );
}

function DeleteForm({ id }: { id: number }) {
  return (
    <form action={deleteCategory.bind(null, id)} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>Esta acción no se puede deshacer.</span>
      <button type="submit" className="btn btn-outline" style={{ borderColor: '#fecaca' }}>Borrar</button>
    </form>
  );
}