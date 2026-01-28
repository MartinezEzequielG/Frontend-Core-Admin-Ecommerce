'use client';

import './login.css';
import { useState } from 'react';
import InnovaBrand from '@/components/admin/ui/InnovaBrand';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        window.location.href = '/admin';
        return;
      }

      const j = await res.json().catch(() => ({}));
      setError(j?.message || 'Login failed');
    } catch {
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card" aria-label="Admin login">
        <div className="login-brand">
          <h1 className="login-title">Panel de administración</h1>
          <p className="login-subtitle">Ingresá con tu email y contraseña para gestionar la tienda.</p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label className="login-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="login-actions">
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </section>

      <footer className="login-footer-outside">
        Hecho por <InnovaBrand />
      </footer>
    </div>
  );
}