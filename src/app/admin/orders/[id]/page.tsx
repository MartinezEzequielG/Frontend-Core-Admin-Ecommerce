import { API, backendFetch } from '@/lib/backend';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import PageHeader from '@/components/admin/ui/PageHeader';
import OrderStatusBadge from '@/components/admin/ui/OrderStatusBadge';

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
    productVariant?: {
      sku?: string | null;
      options?: Array<{
        optionValue?: {
          value?: string | null;
          product?: { name?: string | null } | null;
        } | null;
      }>;
    } | null;
  }>;
};

async function ship(orderId: number, formData: FormData) {
  'use server';

  const token = (await cookies()).get('token')?.value;
  const trackingCode = String(formData.get('trackingCode') || '').trim();

  const res = await fetch(`${API}/admin/orders/${orderId}/ship`, {
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

  const res = await fetch(`${API}/admin/orders/${orderId}/deliver`, {
    method: 'PATCH',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await res.text());

  revalidatePath(`/admin/orders/${orderId}`);
}

async function markPaid(orderId: number) {
  'use server';

  const token = (await cookies()).get('token')?.value;

  const res = await fetch(`${API}/admin/orders/${orderId}/mark-paid`, {
    method: 'PATCH',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await res.text());

  revalidatePath(`/admin/orders/${orderId}`);
}

async function updateStatus(orderId: number, formData: FormData) {
  'use server';

  const token = (await cookies()).get('token')?.value;
  const status = String(formData.get('status') || 'PENDING_PAYMENT');

  const res = await fetch(`${API}/admin/orders/${orderId}`, {
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

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function dt(v: any) {
  if (!v) return '—';

  const d = new Date(v);

  if (Number.isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function getPaymentLabel(paymentMethod?: string | null) {
  const normalized = String(paymentMethod || '').toUpperCase();

  if (normalized === 'TRANSFER' || normalized === 'MP_TRANSFER') return 'Transferencia';
  if (normalized === 'MERCADOPAGO' || normalized === 'MP') return 'Mercado Pago';

  return paymentMethod || '—';
}

function getVariantLabel(item: NonNullable<AdminOrderDetail['items']>[number]) {
  const pairs =
    item.productVariant?.options
      ?.map((opt) => {
        const label = opt.optionValue?.product?.name;
        const value = opt.optionValue?.value;

        if (label && value) return `${label}: ${value}`;
        if (value) return value;

        return null;
      })
      .filter(Boolean) || [];

  return pairs.join(' / ');
}

function isPickupOrder(order: AdminOrderDetail) {
  return String(order.shippingAddress?.street || '')
    .toLowerCase()
    .includes('retiro en tienda');
}

function getDeliveryLabel(order: AdminOrderDetail) {
  return isPickupOrder(order) ? 'Retiro en tienda' : 'Coordinar envío';
}

function getAddressText(order: AdminOrderDetail) {
  const address = order.shippingAddress;

  if (!address) return 'Sin datos de entrega';

  return (
    [
      address.street,
      address.city,
      address.state,
      address.zip,
      address.country,
    ]
      .filter(Boolean)
      .join(', ') || 'Sin datos de entrega'
  );
}

function getOrderItemsText(items?: AdminOrderDetail['items']) {
  if (!items?.length) return 'Productos: No disponibles';

  const lines = items.map((item, index) => {
    const productName = item.productName ?? item.product?.name ?? 'Producto';
    const variantLabel = getVariantLabel(item);
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const subtotal = unitPrice * quantity;

    return [
      `${index + 1}. ${productName}`,
      variantLabel ? `   Variante: ${variantLabel}` : null,
      `   Cantidad: ${quantity}`,
      `   Precio unitario: ${money(unitPrice)}`,
      `   Subtotal: ${money(subtotal)}`,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return ['Productos:', ...lines].join('\n');
}

function buildCustomerWhatsappHref(order: AdminOrderDetail) {
  const phone = String(order.shippingAddress?.phone || '').replace(/\D/g, '');

  if (!phone) return '';

  const customerName = order.user?.name ?? order.shippingAddress?.fullName ?? 'cliente';
  const itemsText = getOrderItemsText(order.items);

  const text = [
    `Hola ${customerName}! Te escribimos por tu pedido #${order.id}.`,
    '',
    `Estado: ${order.status}`,
    `Método de pago: ${getPaymentLabel(order.paymentMethod)}`,
    `Entrega: ${getDeliveryLabel(order)}`,
    '',
    itemsText,
    '',
    `Envío: ${Number(order.shippingCost ?? 0) > 0 ? money(order.shippingCost) : 'A convenir'}`,
    `Total: ${money(order.total)}`,
    '',
    'Cualquier cosa coordinamos por acá. Gracias!',
  ].join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const o = await backendFetch<AdminOrderDetail>(`/admin/orders/${id}`);

  if (!o) {
    return (
      <main className="admin-content">
        <p>Acceso denegado.</p>
      </main>
    );
  }

  const customerName = o.user?.name ?? o.shippingAddress?.fullName ?? 'Invitado';
  const customerEmail = o.user?.email ?? o.shippingAddress?.fullName ? '—' : '—';
  const customerWhatsappHref = buildCustomerWhatsappHref(o);

  const paymentMethod = String(o.paymentMethod || '').toUpperCase();
  const isTransferOrder = paymentMethod === 'TRANSFER' || paymentMethod === 'MP_TRANSFER';
  const isPendingPayment = o.status === 'PENDING_PAYMENT';
  const isPickup = isPickupOrder(o);

  const canShip = !isPickup && ['PAID', 'PROCESSING'].includes(o.status);
  const canDeliver = ['PAID', 'PROCESSING', 'SHIPPED'].includes(o.status);
  const canCancel = !['CANCELLED', 'DELIVERED'].includes(o.status);
  const canMarkTransferPaid = isTransferOrder && isPendingPayment;

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
            <Link href="/admin/orders" className="btn btn-outline">
              Volver
            </Link>
          </>
        }
      />

      <div className="order-detail-grid">
        <div className="order-detail-main">
          <section className="card order-actions">
            <div style={{ display: 'grid', gap: 6 }}>
              <h2 className="section-title">Acciones</h2>
              <p className="section-help">
                Gestioná el estado operativo de la orden según el pago y la entrega.
              </p>
            </div>

            {canMarkTransferPaid ? (
              <form action={markPaid.bind(null, o.id)} style={{ marginTop: 16 }}>
                <button type="submit" className="btn btn-primary">
                  Marcar transferencia como pagada
                </button>
              </form>
            ) : null}

            {isPendingPayment ? (
              <p className="section-help" style={{ marginTop: 12 }}>
                Esta orden todavía está pendiente de pago. Evitá marcar envío o entrega antes de confirmar el cobro.
              </p>
            ) : null}

            <form
              action={updateStatus.bind(null, o.id)}
              className="order-status-form"
              style={{ marginTop: 16 }}
            >
              <select name="status" defaultValue={o.status} className="select order-status-select">
                <option value="CREATED">CREATED</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="PAID">PAID</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <button type="submit" className="btn btn-outline">
                Actualizar estado
              </button>
            </form>

            <div className="kv" style={{ marginTop: 18 }}>
              <div className="kv-row">
                <span className="kv-key">Tracking</span>
                <span className="kv-val">{o.trackingCode ?? '—'}</span>
              </div>

              {canShip ? (
                <form action={ship.bind(null, o.id)} className="order-ship-form">
                  <input
                    name="trackingCode"
                    placeholder="Código de seguimiento"
                    defaultValue={o.trackingCode ?? ''}
                    className="input"
                  />
                  <button type="submit" className="btn btn-primary">
                    Marcar como enviado
                  </button>
                </form>
              ) : null}

              {canDeliver ? (
                <form action={deliver.bind(null, o.id)} className="row">
                  <button type="submit" className="btn btn-outline">
                    Marcar como entregado
                  </button>
                </form>
              ) : null}

              {canCancel ? (
                <form action={updateStatus.bind(null, o.id)} className="row">
                  <input type="hidden" name="status" value="CANCELLED" />
                  <button type="submit" className="btn btn-outline">
                    Cancelar orden
                  </button>
                </form>
              ) : null}
            </div>
          </section>

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
                  {(o.items || []).map((it) => {
                    const variantLabel = getVariantLabel(it);

                    return (
                      <tr key={it.id}>
                        <td>
                          <div className="cell-stack" style={{ minWidth: 260 }}>
                            <span className="cell-title">
                              {it.productName ?? it.product?.name ?? '-'}
                            </span>

                            {variantLabel ? (
                              <span className="cell-meta">
                                Variante: <strong>{variantLabel}</strong>
                              </span>
                            ) : null}

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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="order-detail-side">
          <section className="card">
            <h2 className="section-title">Resumen</h2>

            <div className="kv" style={{ marginTop: 10 }}>
              <div className="kv-row">
                <span className="kv-key">Estado</span>
                <span className="kv-val">
                  <OrderStatusBadge status={o.status} />
                </span>
              </div>

              <div className="kv-row">
                <span className="kv-key">Subtotal</span>
                <span className="kv-val">
                  {money(Number(o.total) - Number(o.shippingCost ?? 0))}
                </span>
              </div>

              <div className="kv-row">
                <span className="kv-key">Envío</span>
                <span className="kv-val">
                  {Number(o.shippingCost ?? 0) > 0 ? money(o.shippingCost) : 'A convenir'}
                </span>
              </div>

              <div className="kv-row">
                <span className="kv-key">Total</span>
                <span className="kv-val" style={{ fontWeight: 800 }}>
                  {money(o.total)}
                </span>
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

            {customerWhatsappHref ? (
              <a
                href={customerWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
              >
                Escribir al cliente por WhatsApp
              </a>
            ) : null}
          </section>

          <section className="card">
            <h2 className="section-title">Entrega</h2>

            {o.shippingAddress ? (
              <div className="kv" style={{ marginTop: 10 }}>
                <div className="kv-row">
                  <span className="kv-key">Método</span>
                  <span className="kv-val">{getDeliveryLabel(o)}</span>
                </div>

                {!isPickup ? (
                  <div className="kv-row">
                    <span className="kv-key">Dirección</span>
                    <span className="kv-val">{o.shippingAddress.street || '—'}</span>
                  </div>
                ) : null}

                <div className="kv-row">
                  <span className="kv-key">Ciudad</span>
                  <span className="kv-val">
                    {[o.shippingAddress.city, o.shippingAddress.state].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>

                <div className="kv-row">
                  <span className="kv-key">CP</span>
                  <span className="kv-val">{o.shippingAddress.zip || '—'}</span>
                </div>

                <div className="kv-row">
                  <span className="kv-key">País</span>
                  <span className="kv-val">{o.shippingAddress.country || '—'}</span>
                </div>
              </div>
            ) : (
              <p className="section-help" style={{ marginTop: 10 }}>
                Sin datos de entrega registrados.
              </p>
            )}
          </section>

          <section className="card">
            <h2 className="section-title">Pago</h2>

            <div className="kv" style={{ marginTop: 10 }}>
              <div className="kv-row">
                <span className="kv-key">Método</span>
                <span className="kv-val">{getPaymentLabel(o.paymentMethod)}</span>
              </div>

              <div className="kv-row">
                <span className="kv-key">Estado</span>
                <span className="kv-val">{o.paymentStatus || o.status || '—'}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}