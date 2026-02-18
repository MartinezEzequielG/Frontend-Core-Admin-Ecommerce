'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

type Img = { id: number; url: string; position?: number | null };

function move<T>(arr: T[], from: number, to: number) {
  const copy = arr.slice();
  const [it] = copy.splice(from, 1);
  copy.splice(to, 0, it);
  return copy;
}

export default function ImagesClient({ productId, images }: { productId: number; images: Img[] }) {
  const initial = useMemo(() => {
    const sorted = [...(images || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return sorted;
  }, [images]);

  const [items, setItems] = useState<Img[]>(initial);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => setItems(initial), [initial]);

  async function persist(next: Img[]) {
    // usa el proxy (Solución A). Si elegiste B, apuntá a `${API}/...`
    const order = next.map((im) => im.id);

    const res = await fetch(`/api/admin/products/${productId}/images/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => 'Error');
      throw new Error(msg);
    }
  }

  function onDragStart(idx: number) {
    setDragIdx(idx);
  }

  function onDragOver(e: React.DragEvent, overIdx: number) {
    e.preventDefault();
    if (dragIdx == null) return;
    if (overIdx === dragIdx) return;

    setItems((prev) => {
      const next = move(prev, dragIdx, overIdx);
      // importantísimo: actualizar dragIdx para que el reorder sea “suave”
      setDragIdx(overIdx);
      return next;
    });
  }

  function onDragEnd() {
    setDragIdx(null);

    const snapshot = items;
    startTransition(async () => {
      try {
        await persist(snapshot);
      } catch (e) {
        // fallback simple: recargar orden original si falla
        setItems(initial);
        console.error(e);
        alert('No se pudo reordenar. Intentá nuevamente.');
      }
    });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
      {items.map((img, idx) => (
        <div
          key={img.id}
          draggable
          onDragStart={() => onDragStart(idx)}
          onDragOver={(e) => onDragOver(e, idx)}
          onDragEnd={onDragEnd}
          style={{
            border:
              dragIdx === idx
                ? '2px solid #0ea5e9'
                : '1px solid rgba(148,163,184,0.35)',
            borderRadius: 10,
            padding: 8,
            background: 'white',
            cursor: 'grab',
            opacity: pending ? 0.7 : 1,
            position: 'relative',
          }}
        >
          <img
            src={img.url}
            alt=""
            style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
          />

          <div style={{ fontSize: 11, textAlign: 'center', opacity: 0.7 }}>
            #{idx + 1}
          </div>

          {pending && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.6)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
