import Link from 'next/link';
import PageHeader from '@/components/admin/ui/PageHeader';
import EmptyState from '@/components/admin/ui/EmptyState';
import ErrorState from '@/components/admin/ui/ErrorState';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import type { AdminProductSummary } from '@/lib/types/admin';
import { backendFetch } from '@/lib/backend';

type SP = Promise<{ q?: string; page?: string; active?: string; inStock?: string; categoryId?: string; sort?: string }>;

export default async function ProductsList({ searchParams }: { searchParams: SP }) {
  try {
    const { q = '', page = '1', active = '', inStock = '', categoryId = '', sort = 'createdAt:desc' } = await searchParams;
    const qs = new URLSearchParams({ limit: '20', page, sort });
    if (q) qs.set('search', q);
    if (active) qs.set('active', active);
    if (inStock) qs.set('inStock', inStock);
    if (categoryId) qs.set('categoryId', categoryId);

    const items = await backendFetch<any[]>(`/admin/products?${qs.toString()}`);
    if (!items) return <main style={{ padding: 24 }}><p>Acceso denegado.</p></main>;
    const exportUrl = `${process.env.BACKEND_API_URL}/admin/products/export`;

    const typedItems = items as AdminProductSummary[];

    return (
      <main className="admin-page">
        <PageHeader
          title="Productos"
          subtitle="Gestioná catálogo, stock y precios."
          actions={
            <>
              <a href={exportUrl} className="btn btn-outline">
                Export CSV
              </a>
              <Link href="/admin/products/new" className="btn btn-primary">
                + Nuevo
              </Link>
            </>
          }
        />

        {/* Filtros */}
        <form className="card filters-card">
          <div className="filters-top">
            <input name="q" defaultValue={q} placeholder="Buscar por nombre, slug o SKU..." className="input" />
            <button type="submit" className="btn btn-outline">Aplicar</button>
            <Link href="/admin/products" className="btn btn-outline">Limpiar</Link>
          </div>

          <div className="filters-advanced">
            <select name="active" defaultValue={active} className="select">
              <option value="">Estado: todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <select name="inStock" defaultValue={inStock} className="select">
              <option value="">Stock: todos</option>
              <option value="true">Con stock</option>
              <option value="false">Sin stock</option>
            </select>

            <input name="categoryId" defaultValue={categoryId} placeholder="CategoryId" className="input" />

            <select name="sort" defaultValue={sort} className="select">
              <option value="createdAt:desc">Más recientes</option>
              <option value="createdAt:asc">Más antiguos</option>
              <option value="basePrice:asc">Precio: menor a mayor</option>
              <option value="basePrice:desc">Precio: mayor a menor</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={exportUrl} className="btn btn-outline">Export CSV</a>
            <Link href="/admin/products/new" className="btn btn-primary">+ Nuevo</Link>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--admin-muted)' }}>
              {items.length} productos
            </span>
          </div>
        </form>

        {typedItems.length === 0 ? (
          <EmptyState
            title="No hay productos para mostrar"
            description="Probá ajustar los filtros o creá un producto nuevo."
            action={
              <Link href="/admin/products/new" className="btn btn-primary">
                + Crear producto
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Oferta</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {typedItems.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>
                      <div className="cell-stack">
                        <div className="cell-title-row">
                          <span className="cell-title">{p.name}</span>
                          {p.featured ? (
                            <span className="badge" style={{ borderColor: 'var(--admin-accent)' }}>
                              Featured
                            </span>
                          ) : null}
                        </div>
                        <div className="cell-meta">
                          {p.slug} {p.sku ? `· SKU: ${p.sku}` : ''}
                        </div>
                      </div>
                    </td>
                    <td>{p.category?.name ?? '—'}</td>
                    <td>{p.totalStock ?? 0}</td>
                    <td>${Number(p.basePrice).toFixed(2)}</td>
                    <td>{p.salePrice != null ? `$${Number(p.salePrice).toFixed(2)}` : '-'}</td>
                    <td>
                      <StatusBadge active={!!p.active} />
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="btn btn-outline">Editar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <nav style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Link
            href={`/admin/products?page=${Math.max(1, Number(page) - 1)}&q=${encodeURIComponent(
              q,
            )}&active=${active}&inStock=${inStock}&categoryId=${categoryId}&sort=${sort}`}
            className="btn btn-outline"
          >
            Prev
          </Link>
          <Link
            href={`/admin/products?page=${Number(page) + 1}&q=${encodeURIComponent(
              q,
            )}&active=${active}&inStock=${inStock}&categoryId=${categoryId}&sort=${sort}`}
            className="btn btn-outline"
          >
            Next
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