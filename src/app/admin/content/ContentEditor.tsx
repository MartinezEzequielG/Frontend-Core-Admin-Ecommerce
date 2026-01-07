'use client';

import { useState } from 'react';

type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  active?: boolean;
  order?: number;
};

type SocialLink = {
  id: string; // Instagram, WhatsApp, etc.
  label: string;
  url: string;
};

export default function ContentEditor({
  initial,
  saveAction,
}: {
  initial: {
    banners?: any[];
    socialLinks?: any[];
    whatsappNumber?: string;
    address?: string;
    logoUrl?: string | null;
    // ✅ agregar
    checkoutMode?: 'CATALOG' | 'CART';
  };
  saveAction: (fd: FormData) => void;
}) {
  const [banners, setBanners] = useState<Banner[]>(
    (initial.banners || []).map((b: any) => ({
      id: String(b.id ?? crypto.randomUUID()),
      title: b.title ?? '',
      subtitle: b.subtitle ?? '',
      imageUrl: b.imageUrl ?? '',
      linkUrl: b.linkUrl ?? '',
      active: b.active ?? true,
      order: Number(b.order ?? 0),
    })),
  );

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    (initial.socialLinks || []).map((s: any) => ({
      id: String(s.id ?? crypto.randomUUID()),
      label: s.label ?? '',
      url: s.url ?? '',
    })),
  );

  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber ?? '');
  const [address, setAddress] = useState(initial.address ?? '');
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? '');
  const [logoUploading, setLogoUploading] = useState(false);

  const [bannerUploadingId, setBannerUploadingId] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'CATALOG' | 'CART'>(
    (initial.checkoutMode as any) || 'CATALOG',
  );

  async function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const presignRes = await fetch('/admin/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'branding',
        }),
      });
      if (!presignRes.ok) {
        const txt = await presignRes.text().catch(() => '');
        throw new Error(`Error al pedir presign: ${presignRes.status} ${txt}`);
      }
      const { uploadUrl, publicUrl } = await presignRes.json();

      const upRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!upRes.ok) {
        throw new Error(`Error al subir logo (status ${upRes.status})`);
      }
      setLogoUrl(publicUrl);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  }

  async function onBannerFile(e: React.ChangeEvent<HTMLInputElement>, bannerId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploadingId(bannerId);
    try {
      const presignRes = await fetch('/admin/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'banners',
        }),
      });
      if (!presignRes.ok) {
        const txt = await presignRes.text().catch(() => '');
        throw new Error(`Error al pedir presign: ${presignRes.status} ${txt}`);
      }
      const { uploadUrl, publicUrl } = await presignRes.json();

      const upRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!upRes.ok) {
        throw new Error(`Error al subir banner (status ${upRes.status})`);
      }

      setBanners((prev) =>
        prev.map((b) => (b.id === bannerId ? { ...b, imageUrl: publicUrl } : b)),
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBannerUploadingId(null);
      e.target.value = '';
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const bannersSorted = [...banners]
      .map((b, idx) => ({ ...b, order: Number.isFinite(b.order) ? b.order : idx }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const payload = {
      banners: bannersSorted,
      socialLinks,
      whatsappNumber,
      address,
      logoUrl,
      checkoutMode,
    };

    const fd = new FormData();
    fd.set('payload', JSON.stringify(payload));
    saveAction(fd);
  }

  return (
    <form onSubmit={onSubmit} className="card form-grid">
      {/* BRANDING / LOGO */}
      <section className="card form-grid">
        <h2 className="section-title">Branding</h2>
        <p className="section-help">Subí el logo de tu tienda o pegá una URL pública.</p>

        <div className="form-cols-2" style={{ alignItems: 'center' }}>
          <div>
            <label className="text-sm">Logo (URL)</label>
            <input
              className="input"
              placeholder="https://.../logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <p className="section-help">Podés pegar una URL de S3 o usar el botón de subir.</p>
            <div style={{ marginTop: 8 }}>
              <input
                type="file"
                accept="image/*"
                onChange={onLogoFile}
                disabled={logoUploading}
              />
              {logoUploading && (
                <p className="section-help">Subiendo logo...</p>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <label className="text-sm">Preview</label>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                border: '1px solid var(--admin-border)',
                background: 'white',
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                  Todavía no hay logo
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Datos de contacto */}
      <section className="card form-grid">
        <h2 className="section-title">Datos de contacto</h2>
        <div>
          <label className="text-sm">WhatsApp</label>
          <input
            className="input"
            placeholder="+54..."
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Dirección del local</label>
          <input
            className="input"
            placeholder="Calle 123, Ciudad"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </section>

      {/* Banners */}
      <section className="card form-grid">
        <h2 className="section-title">Banners</h2>
        <p className="section-help">
          Podés subir la imagen a S3 o pegar directamente una URL pública.
        </p>

        <div className="row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setBanners((p) => [
                ...p,
                {
                  id: crypto.randomUUID(),
                  title: '',
                  subtitle: '',
                  imageUrl: '',
                  linkUrl: '',
                  active: true,
                  order: p.length,
                },
              ])
            }
          >
            + Agregar banner
          </button>
        </div>

        {banners.map((b) => (
          <div key={b.id} className="card form-grid" style={{ background: 'var(--admin-surface-2)' }}>
            <div className="form-cols-2">
              <div>
                <label className="text-sm">Título</label>
                <input
                  className="input"
                  value={b.title || ''}
                  onChange={(e) =>
                    setBanners((p) =>
                      p.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x)),
                    )
                  }
                />
              </div>
              <div>
                <label className="text-sm">Subtítulo</label>
                <input
                  className="input"
                  value={b.subtitle || ''}
                  onChange={(e) =>
                    setBanners((p) =>
                      p.map((x) => (x.id === b.id ? { ...x, subtitle: e.target.value } : x)),
                    )
                  }
                />
              </div>
            </div>

            <div className="form-cols-2">
              <div>
                <label className="text-sm">URL imagen</label>
                <input
                  className="input"
                  value={b.imageUrl || ''}
                  onChange={(e) =>
                    setBanners((p) =>
                      p.map((x) => (x.id === b.id ? { ...x, imageUrl: e.target.value } : x)),
                    )
                  }
                />
                <div style={{ marginTop: 8 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onBannerFile(e, b.id)}
                    disabled={bannerUploadingId === b.id}
                  />
                  {bannerUploadingId === b.id && (
                    <p className="section-help">Subiendo imagen...</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm">Link (opcional)</label>
                <input
                  className="input"
                  value={b.linkUrl || ''}
                  onChange={(e) =>
                    setBanners((p) =>
                      p.map((x) => (x.id === b.id ? { ...x, linkUrl: e.target.value } : x)),
                    )
                  }
                />
              </div>
            </div>

            <div className="row">
              <label className="text-sm row">
                <input
                  type="checkbox"
                  checked={!!b.active}
                  onChange={(e) =>
                    setBanners((p) =>
                      p.map((x) => (x.id === b.id ? { ...x, active: e.target.checked } : x)),
                    )
                  }
                />{' '}
                Activo
              </label>

              <label className="text-sm row">
                Orden
                <input
                  type="number"
                  className="input"
                  style={{ width: 110 }}
                  value={Number(b.order ?? 0)}
                  onChange={(e) =>
                    setBanners((p) =>
                      p.map((x) => (x.id === b.id ? { ...x, order: Number(e.target.value) } : x)),
                    )
                  }
                />
              </label>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setBanners((p) => p.filter((x) => x.id !== b.id))}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Redes sociales */}
      <section className="card form-grid">
        <h2 className="section-title">Redes sociales</h2>

        <div className="row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setSocialLinks((p) => [...p, { id: crypto.randomUUID(), label: 'Instagram', url: '' }])
            }
          >
            + Agregar red
          </button>
        </div>

        {socialLinks.map((s) => (
          <div key={s.id} className="row">
            <input
              className="input"
              style={{ width: 160 }}
              value={s.label}
              onChange={(e) =>
                setSocialLinks((p) =>
                  p.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)),
                )
              }
            />
            <input
              className="input"
              placeholder="https://..."
              value={s.url}
              onChange={(e) =>
                setSocialLinks((p) =>
                  p.map((x) => (x.id === s.id ? { ...x, url: e.target.value } : x)),
                )
              }
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSocialLinks((p) => p.filter((x) => x.id !== s.id))}
            >
              Eliminar
            </button>
          </div>
        ))}
      </section>

      {/* Modo de tienda */}
      <section className="card form-grid">
        <h2 className="section-title">Modo de tienda</h2>
        <p className="section-help">Podés publicar como catálogo y habilitar compra más adelante.</p>

        <div className="row" style={{ alignItems: 'center', gap: 10 }}>
          <label className="text-sm" style={{ width: 180 }}>Checkout</label>
          <select
            className="select"
            value={checkoutMode}
            onChange={(e) => setCheckoutMode(e.target.value as any)}
            style={{ maxWidth: 260 }}
          >
            <option value="CATALOG">Catálogo (sin carrito)</option>
            <option value="CART">Carrito (habilitado)</option>
          </select>
        </div>
      </section>

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary">
          Guardar cambios
        </button>
      </div>
    </form>
  );
}