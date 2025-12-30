import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

type AdminStats = {
  salesToday: number;
  ordersPending: number;
  lowStock: number;
  newUsersToday: number;
};

type OrderRow = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
};

type OrdersResponse = {
  items: OrderRow[];
};

function formatCurrencyARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es-AR');
  } catch {
    return value;
  }
}

function StatusBadge({ status }: { status: string }) {
  // Reutiliza tus clases .badge + .badge.<STATUS>
  return <span className={`badge ${status}`}>{status}</span>;
}

function KpiCard({
  title,
  value,
  href,
  icon,
  variant = 'default',
  hint,
}: {
  title: string;
  value: string;
  href: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  hint?: string;
}) {
  const className = `dashboard-kpi dashboard-kpi--${variant}`;

  return (
    <Link href={href} className={className}>
      <div className="dashboard-kpi__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="dashboard-kpi__info">
        <div className="dashboard-kpi__title">{title}</div>
        <div className="dashboard-kpi__value">{value}</div>
        {hint ? <div className="dashboard-kpi__hint">{hint}</div> : null}
      </div>
    </Link>
  );
}

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([
    backendFetch<AdminStats>('/admin/stats'),
    backendFetch<OrdersResponse>('/admin/orders?limit=6&sort=createdAt:desc'),
  ]);

  return (
    <div className="admin-page">
      {/* Header de página consistente */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">
            Resumen operativo de hoy y accesos rápidos.
          </p>
        </div>

        <div className="page-header__actions">
          <Link href="/admin/products/new" className="btn btn-primary">
            Nuevo producto
          </Link>
          <Link href="/admin/orders" className="btn btn-outline">
            Ver órdenes
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <section className="dashboard-kpis" aria-label="Indicadores clave">
        <KpiCard
          title="Ventas hoy"
          value={formatCurrencyARS(Number(stats.salesToday || 0))}
          href="/admin/orders?tab=today"
          icon={<span className="dashboard-emoji">💸</span>}
          variant="default"
          hint="Total cobrado (hoy)"
        />

        <KpiCard
          title="Órdenes pendientes"
          value={String(stats.ordersPending || 0)}
          href="/admin/orders?status=PENDING_PAYMENT"
          icon={<span className="dashboard-emoji">⏳</span>}
          variant={stats.ordersPending > 0 ? 'warning' : 'success'}
          hint="Esperando pago"
        />

        <KpiCard
          title="Stock bajo"
          value={String(stats.lowStock || 0)}
          href="/admin/products?filter=lowStock"
          icon={<span className="dashboard-emoji">⚠️</span>}
          variant={stats.lowStock > 0 ? 'danger' : 'success'}
          hint="Revisar reposición"
        />

        <KpiCard
          title="Nuevos usuarios"
          value={String(stats.newUsersToday || 0)}
          href="/admin/users?tab=today"
          icon={<span className="dashboard-emoji">🧑‍💻</span>}
          variant="success"
          hint="Altas de hoy"
        />
      </section>

      {/* Grid de contenido */}
      <section className="dashboard-grid" aria-label="Actividad y accesos rápidos">
        {/* Órdenes recientes */}
        <div className="card dashboard-panel">
          <div className="dashboard-panel__head">
            <div>
              <h2 className="section-title">Órdenes recientes</h2>
              <p className="section-help">Últimas {recentOrders.items?.length ?? 0} registradas.</p>
            </div>
            <Link href="/admin/orders" className="btn btn-outline">
              Ver todo
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table order-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.items?.length ? (
                  recentOrders.items.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 800 }}>#{o.id}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrencyARS(Number(o.total || 0))}
                      </td>
                      <td>{formatDateTime(o.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/admin/orders/${o.id}`} className="btn btn-outline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state__title">No hay órdenes todavía</div>
                        <div className="empty-state__desc">
                          Cuando ingresen compras, las verás listadas aquí.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="card dashboard-panel">
          <div className="dashboard-panel__head">
            <div>
              <h2 className="section-title">Accesos rápidos</h2>
              <p className="section-help">Operaciones comunes del día a día.</p>
            </div>
          </div>

          <div className="dashboard-actions">
            <Link href="/admin/products/new" className="btn btn-primary">
              Crear producto
            </Link>
            <Link href="/admin/categories/new" className="btn btn-outline">
              Crear categoría
            </Link>
            <Link href="/admin/orders?status=PENDING_PAYMENT" className="btn btn-outline">
              Revisar pendientes
            </Link>
            <Link href="/admin/content" className="btn btn-outline">
              Editar contenido
            </Link>
          </div>

          <div className="dashboard-divider" />

          <div className="dashboard-health">
            <div className="dashboard-health__item">
              <div className="dashboard-health__label">Pendientes de pago</div>
              <div className="dashboard-health__value">{stats.ordersPending || 0}</div>
            </div>
            <div className="dashboard-health__item">
              <div className="dashboard-health__label">Stock bajo</div>
              <div className="dashboard-health__value">{stats.lowStock || 0}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
