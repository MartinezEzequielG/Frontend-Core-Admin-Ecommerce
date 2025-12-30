'use client';

import { useEffect, useCallback } from 'react';

const STORAGE_KEY = 'admin.sidebar.collapsed';

export default function AdminSidebarCollapseHandler() {
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

  // Cargar preferencia (desktop)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const next = raw === 'true';
      document.body.classList.toggle('sidebar-collapsed', next);
    } catch {}

    // En mobile, colapso no aplica
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

  // Atajo: Ctrl+B (o Cmd+B) opcional
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  // Este componente no renderiza UI. Solo eventos globales.
  return null;
}
