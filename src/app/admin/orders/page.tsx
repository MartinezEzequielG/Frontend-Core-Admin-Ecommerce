import Link from 'next/link';
import { backendFetch } from '@/lib/backend';
import PageHeader from '@/components/admin/ui/PageHeader';
import EmptyState from '@/components/admin/ui/EmptyState';
import ErrorState from '@/components/admin/ui/ErrorState';
import OrderStatusBadge from '@/components/admin/ui/OrderStatusBadge';

function buildHref(params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  return `/admin/orders?${qs.toString()}`;
}

export default async function OrdersList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string; page?: string }>;
}) {
  try {
    const { status = '', from = '', to = '', page = '1' } = await searchParams;

    const qs = new URLSearchParams({ limit: '20', page, sort: 'createdAt:desc' });
    if (status) qs.set('status', status);
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);

    const { items, total } = await backendFetch<{ items: any[]; total: number }>(`/admin/orders?${qs.toString()}`);
    const exportUrl = `${process.env.BACKEND_API_URL}/admin/orders/export`;

    const tabs = [
      { k: '', label: 'Todas' },
      { k: 'CREATED', label: 'Creadas' },
      { k: 'PENDING_PAYMENT', label: 'Pendientes de pago' },
      { k: 'PAID', label: 'Pagadas' },
      { k: 'PROCESSING', label: 'Procesando' },
      { k: 'SHIPPED', label: 'Enviadas' },
      { k: 'DELIVERED', label: 'Entregadas' },
      { k: 'CANCELLED', label: 'Canceladas' },
    ];

    return (
      <main className="admin-page">
        <PageHeader
          title="Órdenes"
          subtitle={`Total: ${total}`}
          actions={
            <a href={exportUrl} className="btn btn-outline">
              Export CSV
            </a>
          }
        />

        <section className="card form-grid">
          <div className="orders-tabs">
            {tabs.map((t) => {
              const active = (status || '') === t.k;
              const href = buildHref({ page: '1', status: t.k, from, to });
              return (
                <Link key={t.k || 'all'} href={href} className={`orders-tab ${active ? 'is-active' : ''}`}>
                  {t.label}
                </Link>
              );
            })}
          </div>

          <form className="orders-filters">
            <select name="status" defaultValue={status} className="select">
              <option value="">Estado: todas</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="CANCELED">CANCELED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            <input type="date" name="from" defaultValue={from} className="input" />
            <input type="date" name="to" defaultValue={to} className="input" />

            <div className="orders-filters__actions">
              <button type="submit" className="btn btn-outline">
                Filtrar
              </button>
              <Link href="/admin/orders" className="btn btn-outline">
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        {items.length === 0 ? (
          <EmptyState
            title="No hay órdenes"
            description="Probá cambiar el estado o el rango de fechas."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((o: any) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td>
                      <div className="cell-stack" style={{ minWidth: 220 }}>
                        <span className="cell-title">
                          {o.user?.name ?? o.shippingAddress?.fullName ?? 'Invitado'}
                        </span>
                        <span className="cell-meta">
                          {o.user?.email ?? (o.userId ? `Usuario #${o.userId}` : 'Compra invitado')}
                        </span>
                      </div>
                    </td>
                    <td>${Number(o.total).toFixed(2)}</td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/admin/orders/${o.id}`} className="btn btn-outline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav className="row" style={{ justifyContent: 'flex-end' }}>
          <Link
            href={buildHref({ page: String(Math.max(1, Number(page) - 1)), status, from, to })}
            className="btn btn-outline"
          >
            Prev
          </Link>
          <Link
            href={buildHref({ page: String(Number(page) + 1), status, from, to })}
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