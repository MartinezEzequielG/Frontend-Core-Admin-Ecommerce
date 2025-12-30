'use client';

import { useCallback, useEffect } from 'react';

export default function AdminSidebarOverlay() {
  const close = useCallback(() => {
    document.body.classList.remove('sidebar-open');
  }, []);

  // Cerrar con Escape por si el usuario no toca el toggle
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return (
    <button
      type="button"
      className="admin-overlay"
      aria-label="Cerrar menú"
      onClick={close}
    />
  );
}
