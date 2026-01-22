'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ToastVariant = 'success' | 'default' | 'error' | 'info';
type ToastState = { msg: string; v: ToastVariant } | null;

function normalizeVariant(v?: string): ToastVariant {
  if (v === 'success' || v === 'default' || v === 'error' || v === 'info') return v;
  return 'default';
}

export default function Toast({
  message,
  variant,
  successParam = 'saved',
  errorParam = 'error',
  successMessage = 'Cambios guardados correctamente',
  errorMessage = 'No se pudo guardar. Intentá nuevamente.',
  durationMs = 2500,
}: {
  message?: string;
  variant?: ToastVariant;
  successParam?: string;
  errorParam?: string;
  successMessage?: string;
  errorMessage?: string;
  durationMs?: number;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Permite mensajes personalizados en ?error=...
  const errorVal = sp?.get(errorParam) ?? '';
  const savedVal = sp?.get(successParam) ?? '';

  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState<ToastState>(null);

  const timerRef = useRef<number | null>(null);
  const clearRef = useRef<number | null>(null);
  const lastTokenRef = useRef<string>('');

  useEffect(() => setMounted(true), []);

  // 1) Decide el “contenido” del toast a mostrar (por props o query params)
  useEffect(() => {
    let next: ToastState = null;

    // Mensaje explícito (prop)
    if (message) {
      next = { msg: message, v: normalizeVariant(variant) };
    }
    // Mensaje de éxito por query
    else if (savedVal === '1') {
      next = { msg: successMessage, v: 'success' };
    }
    // Mensaje de error por query (personalizado o genérico)
    else if (errorVal) {
      next = {
        msg: errorVal !== '1' ? errorVal : errorMessage,
        v: 'error',
      };
    }

    if (!next) return;

    // Evita mostrar el mismo toast repetido
    const token = `${pathname}:${next.msg}:${next.v}`;
    if (lastTokenRef.current === token) return;
    lastTokenRef.current = token;

    setCurrent(next);

    // Limpiar params de la URL solo si estaban presentes
    // (no hagas push, usá replace para no contaminar historial)
    try {
      const url = new URL(window.location.href);
      let changed = false;

      if (url.searchParams.has(successParam)) {
        url.searchParams.delete(successParam);
        changed = true;
      }
      if (url.searchParams.has(errorParam)) {
        url.searchParams.delete(errorParam);
        changed = true;
      }

      if (changed) {
        router.replace(`${pathname}${url.search}${url.hash}`, { scroll: false });
      }
    } catch {
      // noop
    }
  }, [
    pathname,
    router,
    message,
    variant,
    savedVal,
    errorVal,
    successParam,
    errorParam,
    successMessage,
    errorMessage,
  ]);

  // 2) Controla la “vida” del toast (animación + autocierre)
  useEffect(() => {
    if (!current) return;

    // Mostrar
    setShow(true);

    // Limpiar timers previos
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (clearRef.current) window.clearTimeout(clearRef.current);

    // Auto-hide
    timerRef.current = window.setTimeout(() => {
      setShow(false);
      clearRef.current = window.setTimeout(() => setCurrent(null), 180);
    }, durationMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (clearRef.current) window.clearTimeout(clearRef.current);
      timerRef.current = null;
      clearRef.current = null;
    };
  }, [current, durationMs]);

  // Cierre manual
  function handleClose() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (clearRef.current) window.clearTimeout(clearRef.current);
    timerRef.current = null;
    clearRef.current = null;

    setShow(false);
    clearRef.current = window.setTimeout(() => setCurrent(null), 180);
  }

  const styles = useMemo(() => {
    const base: React.CSSProperties = {
      position: 'fixed',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 14px',
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 800,
      zIndex: 2147483647,
      boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
      maxWidth: 'min(560px, calc(100vw - 24px))',
      textAlign: 'center',
      opacity: show ? 1 : 0,
      transition: 'opacity 180ms ease',
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    };

    if (current?.v === 'success') {
      return { ...base, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white' };
    }
    if (current?.v === 'error') {
      return { ...base, background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: 'white' };
    }
    if (current?.v === 'info') {
      return { ...base, background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', color: 'white' };
    }
    return { ...base, background: '#111827', color: 'white' };
  }, [current?.v, show]);

  if (!mounted || !current) return null;

  return createPortal(
    <div style={styles} role="status" aria-live="polite">
      <span style={{ flex: 1 }}>{current.msg}</span>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          fontSize: 18,
          fontWeight: 900,
          cursor: 'pointer',
          marginLeft: 4,
          opacity: 0.7,
          transition: 'opacity 0.15s',
          pointerEvents: 'auto',
        }}
        tabIndex={0}
      >
        ×
      </button>
    </div>,
    document.body,
  );
}