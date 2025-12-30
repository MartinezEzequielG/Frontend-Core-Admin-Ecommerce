'use client';

import { useEffect, useState } from 'react';

const items = [
  { href: '#basics', label: 'Básicos' },
  { href: '#options', label: 'Atributos' },
  { href: '#variants', label: 'Variantes' },
  { href: '#images', label: 'Imágenes' },
  { href: '#audit', label: 'Auditoría' },
] as const;

export default function ProductEditNav() {
  const [hash, setHash] = useState<string>('#basics');

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#basics');
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <nav className="product-edit-nav" aria-label="Secciones del producto">
      {items.map((it) => {
        const active = hash === it.href;
        return (
          <a key={it.href} href={it.href} className={`product-edit-tab ${active ? 'is-active' : ''}`}>
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}