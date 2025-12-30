'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  admin: 'Admin',
  products: 'Productos',
  categories: 'Categorías',
  orders: 'Órdenes',
  users: 'Usuarios',
  coupons: 'Cupones',
  content: 'Contenido',
  new: 'Nuevo',
};

function labelFor(seg: string) {
  if (LABELS[seg]) return LABELS[seg];
  if (/^\d+$/.test(seg)) return `#${seg}`;
  return seg;
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  // asegura que arranque en /admin
  if (parts[0] !== 'admin') return null;

  const crumbs = parts.map((seg, idx) => {
    const href = '/' + parts.slice(0, idx + 1).join('/');
    return { seg, href, label: labelFor(seg) };
  });

  return (
    <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.href} className="admin-breadcrumbs__item">
            {last ? (
              <span aria-current="page" className="admin-breadcrumbs__current">{c.label}</span>
            ) : (
              <Link href={c.href} className="admin-breadcrumbs__link">{c.label}</Link>
            )}
            {!last ? <span className="admin-breadcrumbs__sep">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}