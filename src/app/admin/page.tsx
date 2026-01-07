import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

type AdminStats = {
  ordersToday: number;
  salesToday: number;
  users: number;
  productsActive: number;
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
    return new Date(value).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

// Íconos SVG minimalistas
function IconDollar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
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
  const variantStyles = {
    default: {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      iconBg: '#e2e8f0',
      iconColor: '#64748b',
      border: '#e2e8f0',
    },
    success: {
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      iconBg: '#bbf7d0',
      iconColor: '#16a34a',
      border: '#bbf7d0',
    },
    warning: {
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      iconBg: '#fde68a',
      iconColor: '#d97706',
      border: '#fde68a',
    },
    danger: {
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      iconBg: '#fecaca',
      iconColor: '#dc2626',
      border: '#fecaca',
    },
  };

  const style = variantStyles[variant];

  return (
    <Link
      href={href}
      className="kpi-card"
      style={{
        background: style.bg,
        borderColor: style.border,
      }}
    >
      <div
        className="kpi-card__icon"
        style={{
          background: style.iconBg,
          color: style.iconColor,
        }}
      >
        {icon}
      </div>
      <div className="kpi-card__content">
        <div className="kpi-card__label">{title}</div>
        <div className="kpi-card__value">{value}</div>
        {hint && <div className="kpi-card__hint">{hint}</div>}
      </div>
    </Link>
  );
}

export default async function AdminDashboard() {
  const [statsRaw, recentOrdersRaw] = await Promise.all([
    backendFetch<AdminStats>('/admin/stats').catch(() => null),
    backendFetch<OrdersResponse>('/admin/orders?limit=6&sort=createdAt:desc').catch(() => null),
  ]);

  const stats: AdminStats =
    statsRaw ?? { ordersToday: 0, salesToday: 0, users: 0, productsActive: 0 };

  const recentOrders: OrdersResponse =
    recentOrdersRaw ?? { items: [] };

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">
            Resumen operativo y accesos rápidos
          </p>
        </div>

        <div className="page-header__actions">
          <Link href="/admin/products/new" className="btn btn-primary">
            + Nuevo producto
          </Link>
          <Link href="/admin/orders" className="btn btn-outline">
            Ver órdenes
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <section className="kpi-grid" aria-label="Indicadores clave">
        <KpiCard
          title="Ventas de hoy"
          value={formatCurrencyARS(Number(stats.salesToday || 0))}
          href={`/admin/orders?from=${todayStr}&to=${todayStr}`}
          icon={<IconDollar />}
          variant={stats.salesToday > 0 ? 'success' : 'default'}
          hint="Total cobrado"
        />

        <KpiCard
          title="Órdenes de hoy"
          value={String(stats.ordersToday || 0)}
          href={`/admin/orders?from=${todayStr}&to=${todayStr}`}
          icon={<IconClock />}
          variant={stats.ordersToday > 0 ? 'warning' : 'default'}
          hint="Registradas hoy"
        />

        <KpiCard
          title="Productos activos"
          value={String(stats.productsActive || 0)}
          href="/admin/products?active=1"
          icon={<IconBox />}
          variant={stats.productsActive > 0 ? 'success' : 'default'}
          hint="Visibles en tienda"
        />

        <KpiCard
          title="Total usuarios"
          value={String(stats.users || 0)}
          href="/admin/users"
          icon={<IconUsers />}
          variant="default"
          hint="Cuentas registradas"
        />
      </section>

      {/* Grid de contenido */}
      <section className="dashboard-grid" aria-label="Actividad y accesos rápidos">
        {/* Órdenes recientes */}
        <div className="card dashboard-panel">
          <div className="dashboard-panel__head">
            <div>
              <h2 className="section-title">Órdenes recientes</h2>
              <p className="section-help">Últimas {recentOrders.items?.length ?? 0} registradas</p>
            </div>
            <Link href="/admin/orders" className="btn btn-outline">
              Ver todas
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.items?.length ? (
                  recentOrders.items.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>#{o.id}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                        {formatCurrencyARS(Number(o.total || 0))}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                        {formatDateTime(o.createdAt)}
                      </td>
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
              <p className="section-help">Operaciones frecuentes</p>
            </div>
          </div>

          <div className="dashboard-actions">
            <Link href="/admin/products/new" className="btn btn-primary">
              + Crear producto
            </Link>
            <Link href="/admin/categories/new" className="btn btn-outline">
              + Nueva categoría
            </Link>
            <Link href="/admin/orders?status=PENDING_PAYMENT" className="btn btn-outline">
              Pendientes de pago
            </Link>
            <Link href="/admin/content" className="btn btn-outline">
              Editar contenido
            </Link>
          </div>

          <div className="dashboard-divider" />

          <div className="dashboard-health">
            <div className="dashboard-health__item">
              <div className="dashboard-health__label">Órdenes de hoy</div>
              <div className="dashboard-health__value">{stats.ordersToday || 0}</div>
            </div>
            <div className="dashboard-health__item">
              <div className="dashboard-health__label">Productos activos</div>
              <div className="dashboard-health__value">{stats.productsActive || 0}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
