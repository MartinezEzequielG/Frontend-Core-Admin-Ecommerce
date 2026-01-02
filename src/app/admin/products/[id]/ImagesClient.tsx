'use client';

import { useRef, useState } from 'react';

export default function ImagesClient({ productId }: { productId: number }) {
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function getCookie(name: string) {
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith(name + '='))
      ?.split('=')[1];
  }

  async function uploadToS3(file: File) {
    const token = getCookie('token');

    const presignRes = await fetch('/admin/uploads/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        folder: 'products',
      }),
    });

    if (!presignRes.ok) {
      const txt = await presignRes.text().catch(() => '');
      throw new Error(`Error al pedir presign: ${presignRes.status} ${txt}`);
    }

    const { uploadUrl, publicUrl } = await presignRes.json();

    // PUT directo a S3
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    return new Promise<string>((resolve, reject) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) resolve(publicUrl);
          else reject(new Error(`Error al subir a S3 (status ${xhr.status})`));
        }
      };
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProgress(0);
    try {
      // Nuevo flujo: subir a S3 y guardar la URL en el producto
      const publicUrl = await uploadToS3(f);
      const urlLink = `/api/admin/products/${productId}/images`;
      const linkRes = await fetch(urlLink, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: publicUrl, position: 0 }),
      });
      if (!linkRes.ok) {
        const err = await linkRes.json().catch(() => ({}));
        throw new Error(err?.message || `HTTP ${linkRes.status}`);
      }
      location.reload();
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