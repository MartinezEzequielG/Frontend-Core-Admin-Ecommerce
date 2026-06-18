'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

type Img = { id: number; url: string; position?: number | null };

function move<T>(arr: T[], from: number, to: number) {
  const copy = arr.slice();
  const [it] = copy.splice(from, 1);
  copy.splice(to, 0, it);
  return copy;
}

export default function ImagesClient({
  productId,
  images,
}: {
  productId: number;
  images: Img[];
}) {
  const initial = useMemo(() => {
    const sorted = [...(images || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return sorted;
  }, [images]);

  const [items, setItems] = useState<Img[]>(initial);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  useEffect(() => setItems(initial), [initial]);

  async function persistOrder(next: Img[]) {
    const orders = next.map((im, idx) => ({ id: im.id, position: idx }));

    const res = await fetch(`/api/admin/products/${productId}/images/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
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
      setDragIdx(overIdx);
      return next;
    });
  }

  function onDragEnd() {
    setDragIdx(null);
    const snapshot = items;

    startTransition(async () => {
      try {
        await persistOrder(snapshot);
      } catch (e) {
        console.error(e);
        setItems(initial);
        alert('No se pudo guardar el orden. Intentá nuevamente.');
      }
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const presignRes = await fetch('/api/admin/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          folder: 'products',
        }),
      });

      if (!presignRes.ok) {
        const t = await presignRes.text().catch(() => 'Error presign');
        throw new Error(t);
      }

      const { uploadUrl, publicUrl } = (await presignRes.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      if (!uploadUrl || !publicUrl) throw new Error('Presign inválido (faltan urls)');

      const upRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });

      if (!upRes.ok) throw new Error(`Error subiendo a S3 (status ${upRes.status})`);

      const position = items.length;

      const addRes = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: publicUrl, position }),
      });

      if (!addRes.ok) {
        const t = await addRes.text().catch(() => 'Error asociando imagen');
        throw new Error(t);
      }

      let created: Img | null = null;
      try {
        created = (await addRes.json()) as Img;
      } catch {
        created = null;
      }

      if (created?.id) {
        setItems((prev) => [
          ...prev,
          { id: created!.id, url: created!.url, position: created!.position ?? position },
        ]);
      } else {
        setItems((prev) => [...prev, { id: Date.now(), url: publicUrl, position }]);
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(img: Img) {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}/images/${img.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const t = await res.text().catch(() => 'Error');
        throw new Error(t);
      }

      setItems((prev) => prev.filter((i) => i.id !== img.id));
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la imagen');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading || pending} />
        {(uploading || pending) && (
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            {uploading ? 'Subiendo imagen…' : 'Guardando cambios…'}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
        {items.map((img, idx) => (
          <div
            key={img.id}
            draggable={!pending && !uploading}
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
            style={{
              border: dragIdx === idx ? '2px solid #0ea5e9' : '1px solid rgba(148,163,184,0.35)',
              borderRadius: 10,
              padding: 8,
              background: 'white',
              cursor: pending || uploading ? 'not-allowed' : 'grab',
              opacity: pending || uploading ? 0.7 : 1,
              position: 'relative',
            }}
          >
            <img
              src={img.url}
              alt=""
              style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
            />
            <div style={{ fontSize: 11, textAlign: 'center', opacity: 0.7 }}>#{idx + 1}</div>

            <button
              type="button"
              className="btn btn-danger"
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 6,
                zIndex: 2,
              }}
              onClick={() => handleDelete(img)}
              disabled={pending || uploading}
            >
              🗑️
            </button>

            {(pending || uploading) && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.45)',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
