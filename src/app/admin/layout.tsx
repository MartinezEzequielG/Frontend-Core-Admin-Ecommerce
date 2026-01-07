import type { Metadata } from 'next';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import AdminNav from '@/components/admin/AdminNav';
import AdminSidebarToggle from '@/components/admin/AdminSidebarToggle';
import AdminSidebarOverlay from '@/components/admin/AdminSidebarOverlay';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import AdminBrandToggle from '@/components/admin/AdminBrandToggle';
import InnovaBrand from '@/components/admin/ui/InnovaBrand';
import './admin.css';

export const metadata: Metadata = {
  title: {
    default: 'SupleFsa Admin',
    template: '%s | SupleFsa Admin',
  },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();

  function toggleCollapsed() {
    const body = document.body;
    const next = !body.classList.contains('sidebar-collapsed');
    body.classList.toggle('sidebar-collapsed', next);
    try {
      localStorage.setItem('admin.sidebar.collapsed', String(next));
    } catch {}
  }

  return (
    <div className="admin-shell">
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
          © {year} SuplementacionFsa Admin by <InnovaBrand />
        </footer>
      </section>
    </div>
  );
}
