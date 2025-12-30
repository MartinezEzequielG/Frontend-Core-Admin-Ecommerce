'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'admin.sidebar.collapsed';

export default function AdminSidebarCollapseToggle({ className }: { className?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 900px)').matches;
  }, []);

  const applyCollapsed = useCallback((next: boolean) => {
    document.body.classList.toggle('sidebar-collapsed', next);
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  }, []);

  // Cargar preferencia (solo en cliente)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const next = raw === 'true';
      document.body.classList.toggle('sidebar-collapsed', next);
      setCollapsed(next);
    } catch {
      // ignore
    }
  }, []);

  // Si pasa a mobile, removemos collapsed (no tiene sentido en off-canvas)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => {
      if (mq.matches) {
        document.body.classList.remove('sidebar-collapsed');
        setCollapsed(false);
      } else {
        // al volver a desktop, re-aplicamos lo guardado
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const next = raw === 'true';
          document.body.classList.toggle('sidebar-collapsed', next);
          setCollapsed(next);
        } catch {
          // ignore
        }
      }
    };

    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <button
      type="button"
      className={className}
      onClick={() => applyCollapsed(!collapsed)}
      aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      disabled={isMobile}
      title={isMobile ? 'Disponible solo en desktop' : undefined}
    >
      {collapsed ? 'Expandir' : 'Colapsar'}
    </button>
  );
}
