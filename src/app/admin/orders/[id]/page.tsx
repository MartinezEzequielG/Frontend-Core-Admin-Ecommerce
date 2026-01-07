import { backendFetch } from '@/lib/backend';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import PageHeader from '@/components/admin/ui/PageHeader';
import OrderStatusBadge from '@/components/admin/ui/OrderStatusBadge';

// ✅ tipo mínimo para lo que usás en esta página
type AdminOrderDetail = {
  id: number;
  status: string;
  total: number;
  shippingCost?: number | null;
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  trackingCode?: string | null;

  paymentMethod?: string | null;
  paymentStatus?: string | null;

  userId?: number | null;
  user?: { id: number; email: string; name?: string | null } | null;

  shippingAddress?: {
    fullName?: string | null;
    phone?: string | null;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;

  items?: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    productName?: string | null;
    variantSku?: string | null;
    product?: { id: number; name: string; slug: string } | null;
    productVariant?: { sku?: string | null } | null;
  }>;
};

async function ship(orderId: number, formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const trackingCode = String(formData.get('trackingCode') || '').trim();

  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/orders/${orderId}/ship`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ trackingCode }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath(`/admin/orders/${orderId}`);
}

async function deliver(orderId: number) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/orders/${orderId}/deliver`, {
    method: 'PATCH',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath(`/admin/orders/${orderId}`);
}

async function updateStatus(orderId: number, formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const status = String(formData.get('status') || 'PENDING');

  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await res.text());
  revalidatePath(`/admin/orders/${orderId}`);
}

function money(v: any) {
  const n = Number(v ?? 0);
  return `$${n.toFixed(2)}`;
}

function dt(v: any) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ✅ tipar respuesta
  const o = await backendFetch<AdminOrderDetail>(`/admin/orders/${id}`);
  if (!o) return <main className="admin-content"><p>Acceso denegado.</p></main>;

  const customerName = o.user?.name ?? o.shippingAddress?.fullName ?? 'Invitado';
  const customerEmail = o.user?.email ?? '—';

  return (
    <main className="admin-page">
      <PageHeader
        title={`Orden #${o.id}`}
        subtitle={
          <span className="order-meta">
            <span>Creada: {dt(o.createdAt)}</span>
            {o.shippedAt ? <span>Enviada: {dt(o.shippedAt)}</span> : null}
            {o.deliveredAt ? <span>Entregada: {dt(o.deliveredAt)}</span> : null}
          </span>
        }
        actions={
          <>
            <span style={{ alignSelf: 'center' }}>
              <OrderStatusBadge status={o.status} />
            </span>
            <Link href="/admin/orders" className="btn btn-outline">Volver</Link>
          </>
        }
      />

      <div className="order-detail-grid">
        {/* MAIN */}
        <div className="order-detail-main">
          {/* Acciones */}
          <section className="card order-actions">
            <h2 className="section-title">Acciones</h2>

            <form action={updateStatus.bind(null, o.id)} className="order-status-form">
              <select name="status" defaultValue={o.status} className="select order-status-select">
                <option value="CREATED">CREATED</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="PAID">PAID</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <button type="submit" className="btn btn-outline">Actualizar estado</button>
            </form>

            <div className="kv">
              <div className="kv-row">
                <span className="kv-key">Tracking</span>
                <span className="kv-val">{o.trackingCode ?? '—'}</span>
              </div>

              <form action={ship.bind(null, o.id)} className="order-ship-form">
                <input
                  name="trackingCode"
                  placeholder="Código de seguimiento"
                  defaultValue={o.trackingCode ?? ''}
                  className="input"
                />
                <button type="submit" className="btn btn-primary">Marcar como enviado</button>
              </form>

              <form action={deliver.bind(null, o.id)} className="row">
                <button type="submit" className="btn btn-outline">Marcar como entregado</button>
              </form>
            </div>
          </section>

          {/* Items */}
          <section className="card" style={{ display: 'grid', gap: 12 }}>
            <div className="order-items-title">
              <h2 className="section-title">Items</h2>
              <span className="order-items-note">{(o.items || []).length} ítems</span>
            </div>

            <div className="table-wrap">
              <table className="table order-items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Cant.</th>
                    <th>Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(o.items || []).map((it: any) => (
                    <tr key={it.id}>
                      <td>
                        <div className="cell-stack" style={{ minWidth: 260 }}>
                          <span className="cell-title">{it.productName ?? it.product?.name ?? '-'}</span>
                          {it.product?.id ? (
                            <span className="cell-meta">
                              <Link href={`/admin/products/${it.product.id}`} className="admin-link">
                                Ver producto #{it.product.id}
                              </Link>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{it.variantSku ?? it.productVariant?.sku ?? '—'}</td>
                      <td>{it.quantity}</td>
                      <td>{money(it.unitPrice)}</td>
                      <td>{money(Number(it.unitPrice) * Number(it.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* SIDE */}
        <aside className="order-detail-side">
          <section className="card">
            <h2 className="section-title">Resumen</h2>
            <div className="kv" style={{ marginTop: 10 }}>
              <div className="kv-row">
                <span className="kv-key">Estado</span>
                <span className="kv-val"><OrderStatusBadge status={o.status} /></span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Subtotal</span>
                <span className="kv-val">{money(Number(o.total) - Number(o.shippingCost ?? 0))}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Envío</span>
                <span className="kv-val">{money(o.shippingCost)}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Total</span>
                <span className="kv-val" style={{ fontWeight: 800 }}>{money(o.total)}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">Cliente</h2>
            <div className="kv" style={{ marginTop: 10 }}>
              <div className="kv-row">
                <span className="kv-key">Nombre</span>
                <span className="kv-val">{customerName}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Email</span>
                <span className="kv-val">{customerEmail}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Teléfono</span>
                <span className="kv-val">{o.shippingAddress?.phone ?? '—'}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">Dirección</h2>
            {o.shippingAddress ? (
              <div className="kv" style={{ marginTop: 10 }}>
                <div className="kv-row">
                  <span className="kv-key">Calle</span>
                  <span className="kv-val">{o.shippingAddress.street}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Ciudad</span>
                  <span className="kv-val">{o.shippingAddress.city}, {o.shippingAddress.state}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">CP</span>
                  <span className="kv-val">{o.shippingAddress.zip || '—'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">País</span>
                  <span className="kv-val">{o.shippingAddress.country}</span>
                </div>
              </div>
            ) : (
              <p className="section-help" style={{ marginTop: 10 }}>Sin dirección registrada</p>
            )}
          </section>

          <section className="card">
            <h2 className="section-title">Pago</h2>
            <div className="kv" style={{ marginTop: 10 }}>
              <div className="kv-row">
                <span className="kv-key">Método</span>
                <span className="kv-val">{o.paymentMethod || '—'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Estado</span>
                <span className="kv-val">{o.paymentStatus || '—'}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}