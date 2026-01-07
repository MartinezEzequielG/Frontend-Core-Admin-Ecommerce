'use client';

import { useEffect, useState } from 'react';

export default function Toast({ message }: { message?: string }) {
  const [show, setShow] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    setShow(true);

    // ✅ borrar ?saved=1 para que no reaparezca al refrescar
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('saved');
      window.history.replaceState({}, '', url.toString());
    } catch {}

    const t = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(t);
  }, [message]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#111827',
        color: 'white',
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
        zIndex: 9999,
      }}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}