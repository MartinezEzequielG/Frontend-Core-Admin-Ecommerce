'use client';

import { useRef, useState } from 'react';

export default function ImagesClient({ productId }: { productId: number }) {
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    const fd = new FormData();
    fd.append('file', file);

    const urlUpload = `/api/admin/uploads/image`;
    const urlLink = `/api/admin/products/${productId}/images`;

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onreadystatechange = async () => {
        if (xhr.readyState === 4) {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              const j = JSON.parse(xhr.responseText || '{}');
              const url = typeof j?.url === 'string' ? j.url.trim() : '';
              if (!url) return reject(new Error('Upload sin URL'));
              const linkRes = await fetch(urlLink, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, position: 0 }),
              });
              if (!linkRes.ok) {
                const err = await linkRes.json().catch(() => ({}));
                return reject(new Error(err?.message || `HTTP ${linkRes.status}`));
              }
              resolve();
              location.reload();
            } else {
              const err = xhr.responseText || 'Error al subir';
              reject(new Error(err));
            }
          } catch (err: any) {
            reject(err);
          }
        }
      };
      xhr.open('POST', urlUpload);
      xhr.send(fd);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProgress(0);
    try {
      await upload(f);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
      setProgress(0);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} />
      {progress > 0 && <progress value={progress} max={100} />}
    </div>
  );
}