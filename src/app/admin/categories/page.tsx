import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
};

export default async function CategoriesPage() {
  const cats = await backendFetch<AdminCategory[]>('/admin/categories');
  if (!cats) return <main className="admin-content"><p>Acceso denegado.</p></main>;

  const byParent: Record<string, AdminCategory[]> = {};
  for (const c of cats) {
    const key = String(c.parentId ?? 'root');
    (byParent[key] ||= []).push(c);
  }

  function Tree({ parentId = 'root', level = 0 }: { parentId?: string | number; level?: number }) {
    const items = byParent[String(parentId)] || [];
    return (
      <ul style={{ marginLeft: level * 16, display: 'grid', gap: 6 }}>
        {items.map((c) => (
          <li key={c.id} className="card" style={{ padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Link href={`/admin/categories/${c.id}`} className="hover:text-(--admin-accent)" style={{ fontWeight: 600 }}>{c.name}</Link>
              <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>Slug: {c.slug}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/admin/categories/${c.id}`} className="btn btn-outline">Editar</Link>
              <Link href={`/admin/categories/new?parentId=${c.id}`} className="btn btn-primary">+ Subcategoría</Link>
            </div>
            <Tree parentId={c.id} level={level + 1} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="admin-content">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Categorías</h1>
        <Link href="/admin/categories/new" className="btn btn-primary">+ Nueva</Link>
      </header>

      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
          Organiza tu catálogo con categorías y subcategorías. Usa el botón “+ Subcategoría” para anidar.
        </p>
        <Tree />
      </section>
    </main>
  );
}