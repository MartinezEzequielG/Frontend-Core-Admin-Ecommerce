'use client';

import Link from 'next/link';
import { useEffect, useCallback } from 'react';

const STORAGE_KEY = 'admin.sidebar.collapsed';

export default function AdminBrandToggle({ brandName }: { brandName?: string }) {
  const apply = useCallback((next: boolean) => {
    document.body.classList.toggle('sidebar-collapsed', next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    const next = !document.body.classList.contains('sidebar-collapsed');
    apply(next);
  }, [apply]);

  // Restaurar estado al cargar (solo desktop)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const next = raw === 'true';
      document.body.classList.toggle('sidebar-collapsed', next);
    } catch {}

    // En mobile no aplica collapsed
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => {
      if (mq.matches) {
        document.body.classList.remove('sidebar-collapsed');
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const next = raw === 'true';
          document.body.classList.toggle('sidebar-collapsed', next);
        } catch {}
      }
    };

    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Atajo: Ctrl/Cmd + B
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return; // ✅ Previene el error
      const key = e.key.toLowerCase();
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && key === 'b') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const label = `${brandName || 'Store'} ADMIN`;

  return (
    <div
      className="admin-brand"
      role="button"
      tabIndex={0}
      title="Doble click para colapsar / expandir (Ctrl/Cmd+B)"
      onDoubleClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') toggle();
      }}
    >
      <Link href="/admin" className="admin-brand__link" aria-label="Ir al dashboard">
        {label}
      </Link>
    </div>
  );
}
