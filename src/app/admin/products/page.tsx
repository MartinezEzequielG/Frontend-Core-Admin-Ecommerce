import Link from 'next/link';
import PageHeader from '@/components/admin/ui/PageHeader';
import EmptyState from '@/components/admin/ui/EmptyState';
import ErrorState from '@/components/admin/ui/ErrorState';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import ConfirmDeleteForm from '@/components/admin/ui/ConfirmDeleteForm';
import type { AdminProductSummary } from '@/lib/types/admin';
import { backendFetch, API, imageUrl } from '@/lib/backend';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type SP = Promise<{
  q?: string;
  page?: string;
  active?: string;
  inStock?: string;
  categoryId?: string;
  sort?: string;
}>;

async function deleteProduct(id: number) {
  'use server';
  const token = (await cookies()).get('token')?.value;

  const res = await fetch(`${API}/admin/products/${id}`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });

  if (!res.ok) {
    let msg = 'No se pudo eliminar el producto.';
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {
      msg = await res.text().catch(() => msg);
    }
    revalidatePath('/admin/products');
    redirect(`/admin/products?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath('/admin/products');
  redirect('/admin/products?saved=1');
}

export default async function ProductsList({ searchParams }: { searchParams: SP }) {
  try {
    const {
      q = '',
      page = '1',
      active = '',
      inStock = '',
      categoryId = '',
      sort = 'featured:desc,position:asc,createdAt:desc',
    } = await searchParams;

    const pageNum = Number(page) || 1;
    const limit = 24;

    const qs = new URLSearchParams({
      limit: String(limit),
      page: String(pageNum),
      sort,
    });

    if (q) qs.set('search', q);
    if (active) qs.set('active', active);
    if (inStock) qs.set('inStock', inStock);
    if (categoryId) qs.set('categoryId', categoryId);

    const items = await backendFetch<AdminProductSummary[]>(`/admin/products?${qs.toString()}`);
    if (!items) return <main className="admin-page"><p>Acceso denegado.</p></main>;

    const categories = await backendFetch<any[]>('/admin/categories');
    const typedItems = items as AdminProductSummary[];

    const exportUrl = `${process.env.BACKEND_API_URL}/admin/products/export`;
    const hasNextPage = typedItems.length === limit;

    return (
      <main className="admin-page">
        <PageHeader
          title="Productos"
          subtitle="Gestión del catálogo: destacados, orden, stock y precios."
          actions={
            <>
              <a href={exportUrl} className="btn btn-outline">Export CSV</a>
              <Link href="/admin/products/new" className="btn btn-primary">+ Nuevo</Link>
            </>
          }
        />

        {/* Filtros (server-safe) */}
        <form className="card filters-card" style={{ gap: 12, padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
          <div className="filters-top" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 0 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar productos…"
                className="input"
                style={{
                  paddingLeft: 36,
                  borderRadius: 8,
                  border: '1px solid var(--admin-border)',
                  background: '#fff',
                  fontSize: 15,
                  height: 38,
                }}
                autoComplete="off"
              />
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#b6b8c3',
                  pointerEvents: 'none',
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-3.5-3.5" />
                </svg>
              </span>
            </div>
            <button type="submit" className="btn btn-primary" style={{ minWidth: 38, height: 38, padding: 0 }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-3.5-3.5" />
              </svg>
            </button>
            <Link href="/admin/products" className="btn btn-outline" style={{ minWidth: 38, height: 38, padding: 0 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Link>
          </div>

          <div
            className="filters-advanced"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <select name="active" defaultValue={active} className="select">
              <option value="">Estado: Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <select name="inStock" defaultValue={inStock} className="select">
              <option value="">Stock: Todos</option>
              <option value="true">Con stock</option>
              <option value="false">Sin stock</option>
            </select>

            <select name="categoryId" defaultValue={categoryId} className="select">
              <option value="">Categoría: Todas</option>
              {(categories || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select name="sort" defaultValue={sort} className="select">
              <option value="featured:desc,position:asc,createdAt:desc">Destacados / Orden / Recientes</option>
              <option value="createdAt:desc">Más recientes</option>
              <option value="createdAt:asc">Más antiguos</option>
              <option value="basePrice:asc">Precio menor</option>
              <option value="basePrice:desc">Precio mayor</option>
            </select>
          </div>

          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="section-help">Mostrando {typedItems.length} productos (página {pageNum})</span>
            <a href={exportUrl} className="btn btn-outline">Export CSV</a>
          </div>
        </form>

        {typedItems.length === 0 ? (
          <EmptyState
            title="No hay productos"
            description="Probá ajustar los filtros o creá un producto nuevo."
            action={<Link href="/admin/products/new" className="btn btn-primary">+ Nuevo</Link>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table premium-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>#</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'right' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Precio</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Creado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {typedItems.map((p, idx) => (
                  <tr key={p.id}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1 + (pageNum - 1) * limit}</td>
                    <td>
                      <div className="cell-stack">
                        <div className="cell-title-row">
                          <span className="cell-title">{p.name}</span>
                          {p.featured ? (
                            <span className="badge" style={{ borderColor: 'var(--admin-accent)' }}>
                              Destacado
                            </span>
                          ) : null}
                        </div>
                        <div className="cell-meta">
                          {p.slug} {p.sku ? `· SKU: ${p.sku}` : ''}
                        </div>
                      </div>
                    </td>
                    <td>{p.category?.name ?? '—'}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {p.totalStock ?? 0}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      ${Number(p.basePrice).toFixed(2)}
                    </td>
                    <td>{p.sku || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusBadge active={!!p.active} />
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--admin-muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <Link href={`/admin/products/${p.id}`} className="btn btn-outline">
                          Editar
                        </Link>
                        <ConfirmDeleteForm
                          action={deleteProduct.bind(null, p.id)}
                          confirmText={`¿Seguro que querés eliminar "${p.name}"? Esta acción no se puede deshacer.`}
                        >
                          <button type="button" className="btn btn-danger">
                            Borrar
                          </button>
                        </ConfirmDeleteForm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            href={`/admin/products?page=${Math.max(1, pageNum - 1)}&q=${encodeURIComponent(q)}&active=${active}&inStock=${inStock}&categoryId=${categoryId}&sort=${encodeURIComponent(sort)}`}
            className={`btn btn-outline ${pageNum <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
            aria-disabled={pageNum <= 1}
          >
            ← Prev
          </Link>

          <span className="section-help">Página {pageNum}</span>

          <Link
            href={`/admin/products?page=${pageNum + 1}&q=${encodeURIComponent(q)}&active=${active}&inStock=${inStock}&categoryId=${categoryId}&sort=${encodeURIComponent(sort)}`}
            className={`btn btn-outline ${hasNextPage ? '' : 'opacity-50 pointer-events-none'}`}
            aria-disabled={!hasNextPage}
          >
            Next →
          </Link>
        </nav>
      </main>
    );
  } catch (e: any) {
    return (
      <main className="admin-page">
        <ErrorState message={e?.message || 'Error desconocido'} />
      </main>
    );
  }
}