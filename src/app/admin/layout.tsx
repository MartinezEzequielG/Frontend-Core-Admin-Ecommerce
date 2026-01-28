import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import LogoutButton from '@/components/LogoutButton';
import AdminNav from '@/components/admin/AdminNav';
import AdminSidebarToggle from '@/components/admin/AdminSidebarToggle';
import AdminSidebarOverlay from '@/components/admin/AdminSidebarOverlay';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import AdminBrandToggle from '@/components/admin/AdminBrandToggle';
import InnovaBrand from '@/components/admin/ui/InnovaBrand';
import Toast from '@/components/admin/ui/Toast';
import './admin.css';
import { backendFetch } from '@/lib/backend';

export const metadata: Metadata = {
  title: {
    default: 'Hamsa Admin',
    template: '%s | Hamsa Admin',
  },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Valida la sesión: si el token es inválido o falta, backendFetch redirige a /login
  await backendFetch('/auth/me');

  return (
    <div className="admin-shell">
      <Suspense fallback={null}>
        <Toast />
      </Suspense>

      {/* Accesibilidad */}
      <a href="#admin-main" className="sr-only sr-only-focusable">
        Saltar al contenido
      </a>

      <AdminSidebarOverlay />

      <aside className="admin-aside" aria-label="Navegación de administración">
        <div className="admin-aside-top">
          <AdminBrandToggle />

          {/* Mobile only */}
          <div className="admin-aside-top__actions">
            <AdminSidebarToggle
              className="btn btn-outline admin-aside-close"
              label="Cerrar"
              close
            />
          </div>
        </div>

        <AdminNav />

        <div className="admin-aside-footer">
          <LogoutButton />
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header" role="banner">
          <div className="admin-header-left">
            <AdminSidebarToggle
              className="btn btn-outline admin-sidebar-open"
              label="Menú"
            />
            <AdminBreadcrumbs />
          </div>
        </header>

        <main id="admin-main" className="admin-content" role="main">
          {children}
        </main>

        <footer className="admin-footer" role="contentinfo">
          © {new Date().getFullYear()} Hamsa Admin by <InnovaBrand />
        </footer>
      </section>
    </div>
  );
}
