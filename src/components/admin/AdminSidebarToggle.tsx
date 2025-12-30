'use client';

import { useCallback, useEffect } from 'react';

export default function AdminSidebarToggle({
  className,
  label = 'Menú',
  close = false,
}: {
  className?: string;
  label?: string;
  close?: boolean;
}) {
  const setOpen = useCallback((open: boolean) => {
    document.body.classList.toggle('sidebar-open', open);
  }, []);

  const toggle = useCallback(() => {
    const body = document.body;
    const next = !body.classList.contains('sidebar-open');
    body.classList.toggle('sidebar-open', next);
  }, []);

  // Cerrar con Escape (solo cuando está abierto)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  return (
    <button
      type="button"
      className={className}
      aria-label={close ? 'Cerrar menú' : 'Abrir menú'}
      onClick={() => (close ? setOpen(false) : toggle())}
    >
      {label}
    </button>
  );
}
