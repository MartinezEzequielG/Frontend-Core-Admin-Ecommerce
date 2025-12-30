export type OrderStatus =
  | 'CREATED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export default function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const raw = String(status || 'PENDING').toUpperCase();
  const s = raw === 'CANCELLED' ? 'CANCELED' : raw; // compat
  return <span className={`badge badge--order badge--${s}`}>{s}</span>;
}