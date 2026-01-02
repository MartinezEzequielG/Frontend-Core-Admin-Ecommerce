'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type IconProps = { className?: string };
type NavItem = { 
  href: string; 
  label: string; 
  icon: (p: IconProps) => React.ReactNode;
  badge?: () => Promise<number>; // opcional
};
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

const IconSettings = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const groups: readonly NavGroup[] = [
  {
    label: 'General',
    items: [
      { href: '/admin', label: 'Dashboard', icon: IconGrid },
      { href: '/admin/settings', label: 'Configuración', icon: IconSettings },
    ],
  },
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

  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadBadges() {
      const counts: Record<string, number> = {};
      for (const g of groups) {
        for (const it of g.items) {
          if (it.badge) {
            counts[it.href] = await it.badge();
          }
        }
      }
      setBadges(counts);
    }
    loadBadges();
  }, []);

  return (
    <nav className="admin-nav" aria-label="Navegación admin">
      {groups.map((g) => {
        const hasActiveItem = g.items.some(it => isActive(pathname, it.href));
        
        return (
          <div key={g.label} className="admin-nav-group" data-active={hasActiveItem || undefined}>
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
                    title={it.label}
                  >
                    <span className="admin-nav__icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <span className="admin-nav__label">{it.label}</span>
                    {badges[it.href] > 0 && (
                      <span className="admin-nav__badge">{badges[it.href]}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
