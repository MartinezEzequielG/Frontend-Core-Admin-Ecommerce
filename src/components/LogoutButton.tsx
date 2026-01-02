'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className={className || 'logout-btn'}
      aria-label="Cerrar sesión"
      type="button"
    >
      {/* Ícono de salida SVG minimalista */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>{loading ? 'Saliendo...' : 'Salir'}</span>
    </button>
  );
}