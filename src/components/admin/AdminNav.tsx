'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

type IconProps = { className?: string };
type NavItem = { href: string; label: string; icon: (p: IconProps) => React.ReactNode };
type NavGroup = { label: string; items: readonly NavItem[] };

function isActive(pathname: string, href: string) {
  const p = pathname || '/admin';
  if (href === '/admin') return p === '/admin';
  return p === href || p.startsWith(href + '/');
}

/** Íconos simples (SVG) */
const IconGrid = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconBox = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 7.5 12 3l9 4.5-9 4.5L3 7.5Z" stroke="currentColor" strokeWidth="2" />
    <path d="M3 7.5V17l9 4 9-4V7.5" stroke="currentColor" strokeWidth="2" />
    <path d="M12 12v9" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconTag = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 13 13 20l-9-9V4h7l9 9Z" stroke="currentColor" strokeWidth="2" />
    <path d="M7.5 7.5h.01" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const IconLayers = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3 2 9l10 6 10-6-10-6Z" stroke="currentColor" strokeWidth="2" />
    <path d="M2 15l10 6 10-6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconReceipt = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" stroke="currentColor" strokeWidth="2" />
    <path d="M9 7h6M9 11h6M9 15h6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconUsers = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2" />
    <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconImage = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 5h16v14H4V5Z" stroke="currentColor" strokeWidth="2" />
    <path d="M8.5 10.5h.01" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M20 16l-5-5-5 6-2-2-4 4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const groups: readonly NavGroup[] = [
  { label: 'General', items: [{ href: '/admin', label: 'Dashboard', icon: IconGrid }] },
  {
    label: 'Catálogo',
    items: [
      { href: '/admin/products', label: 'Productos', icon: IconBox },
      { href: '/admin/categories', label: 'Categorías', icon: IconLayers },
    ],
  },
  { label: 'Ventas', items: [{ href: '/admin/orders', label: 'Órdenes', icon: IconReceipt }] },
  { label: 'Clientes', items: [{ href: '/admin/users', label: 'Usuarios', icon: IconUsers }] },
  {
    label: 'Marketing / Store',
    items: [
      { href: '/admin/coupons', label: 'Cupones', icon: IconTag },
      { href: '/admin/content', label: 'Contenido', icon: IconImage },
    ],
  },
] as const;

export default function AdminNav() {
  const pathname = usePathname() || '/admin';

  const closeSidebarIfOpen = useCallback(() => {
    document.body.classList.remove('sidebar-open');
  }, []);

  return (
    <nav className="admin-nav" aria-label="Navegación admin">
      {groups.map((g) => (
        <div key={g.label} className="admin-nav-group">
          <div className="admin-nav-group__label">{g.label}</div>

          <div className="admin-nav-group__items">
            {g.items.map((it) => {
              const active = isActive(pathname, it.href);
              const Icon = it.icon;

              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={closeSidebarIfOpen}
                  className={active ? 'active' : undefined}
                  aria-current={active ? 'page' : undefined}
                  title={it.label} // tooltip útil en collapsed
                >
                  <span className="admin-nav__icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="admin-nav__label">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
