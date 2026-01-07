'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
  variant?: 'success' | 'default' | 'error';
  successParam?: string;
  errorParam?: string;
  successMessage?: string;
  errorMessage?: string;
  durationMs?: number;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ valores primitivos (no dependemos del objeto searchParams)
  const savedVal = sp?.get(successParam) ?? '';
  const errorVal = sp?.get(errorParam) ?? '';

  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState<{ msg: string; v: 'success' | 'default' | 'error' } | null>(null);

  const timerRef = useRef<number | null>(null);
  const lastTokenRef = useRef<string>('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const saved = savedVal === '1';
    const error = errorVal === '1';

    const next =
      message
        ? { msg: message, v: variant ?? 'default' }
        : saved
          ? { msg: successMessage, v: 'success' }
          : error
            ? { msg: errorMessage, v: 'error' }
            : null;

    if (!next) return;

    // ✅ token único por evento (incluye ruta + params)
    const token = message
      ? `m:${pathname}:${message}:${variant ?? 'default'}`
      : saved
        ? `saved:${pathname}`
        : `error:${pathname}`;

    // ✅ si es el mismo evento, NO reiniciar timer
    if (lastTokenRef.current === token) return;
    lastTokenRef.current = token;

    setCurrent(next);
    setShow(true);

    // ✅ limpiar params (una sola vez) para que no reaparezca
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete(successParam);
      url.searchParams.delete(errorParam);
      router.replace(`${pathname}${url.search}${url.hash}`, { scroll: false });
    } catch {
      // noop
    }

    // ✅ asegurar auto-hide
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setShow(false);
      window.setTimeout(() => setCurrent(null), 180);
    }, durationMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
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
    durationMs,
  ]);

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
      pointerEvents: 'none',
    };

    if (current?.v === 'success') {
      return { ...base, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white' };
    }
    if (current?.v === 'error') {
      return { ...base, background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: 'white' };
    }
    return { ...base, background: '#111827', color: 'white' };
  }, [current?.v, show]);

  if (!mounted || !current) return null;

  return createPortal(
    <div style={styles} role="status" aria-live="polite">
      {current.msg}
    </div>,
    document.body,
  );
}