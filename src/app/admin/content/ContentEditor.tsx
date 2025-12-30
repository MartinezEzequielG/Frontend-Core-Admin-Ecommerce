'use client';

import { useMemo, useState } from 'react';

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
  id: string;
  label: string; // Instagram, WhatsApp, etc.
  url: string;
};

export default function ContentEditor({
  initial,
  saveAction,
}: {
  initial: { banners?: any[]; socialLinks?: any[] };
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

  const payload = useMemo(
    () => ({
      banners: [...banners]
        .map((b, idx) => ({ ...b, order: Number.isFinite(b.order) ? b.order : idx }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      socialLinks,
    }),
    [banners, socialLinks],
  );

  return (
    <form action={saveAction} className="form-grid">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <section className="card form-grid">
        <h2 className="section-title">Banners</h2>
        <p className="section-help">Pegá una URL de imagen (luego lo conectamos a uploads si querés).</p>

        <div className="row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setBanners((p) => [
                ...p,
                { id: crypto.randomUUID(), title: '', subtitle: '', imageUrl: '', linkUrl: '', active: true, order: p.length },
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
                <input className="input" value={b.title || ''} onChange={(e) => setBanners((p) => p.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x)))} />
              </div>
              <div>
                <label className="text-sm">Subtítulo</label>
                <input className="input" value={b.subtitle || ''} onChange={(e) => setBanners((p) => p.map((x) => (x.id === b.id ? { ...x, subtitle: e.target.value } : x)))} />
              </div>
            </div>

            <div className="form-cols-2">
              <div>
                <label className="text-sm">URL imagen</label>
                <input className="input" value={b.imageUrl || ''} onChange={(e) => setBanners((p) => p.map((x) => (x.id === b.id ? { ...x, imageUrl: e.target.value } : x)))} />
              </div>
              <div>
                <label className="text-sm">Link (opcional)</label>
                <input className="input" value={b.linkUrl || ''} onChange={(e) => setBanners((p) => p.map((x) => (x.id === b.id ? { ...x, linkUrl: e.target.value } : x)))} />
              </div>
            </div>

            <div className="row">
              <label className="text-sm row">
                <input
                  type="checkbox"
                  checked={!!b.active}
                  onChange={(e) => setBanners((p) => p.map((x) => (x.id === b.id ? { ...x, active: e.target.checked } : x)))}
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
                  onChange={(e) => setBanners((p) => p.map((x) => (x.id === b.id ? { ...x, order: Number(e.target.value) } : x)))}
                />
              </label>

              <button type="button" className="btn btn-outline" onClick={() => setBanners((p) => p.filter((x) => x.id !== b.id))}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="card form-grid">
        <h2 className="section-title">Redes sociales</h2>

        <div className="row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setSocialLinks((p) => [...p, { id: crypto.randomUUID(), label: 'Instagram', url: '' }])}
          >
            + Agregar red
          </button>
        </div>

        {socialLinks.map((s) => (
          <div key={s.id} className="row">
            <input className="input" style={{ width: 160 }} value={s.label} onChange={(e) => setSocialLinks((p) => p.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))} />
            <input className="input" placeholder="https://..." value={s.url} onChange={(e) => setSocialLinks((p) => p.map((x) => (x.id === s.id ? { ...x, url: e.target.value } : x)))} />
            <button type="button" className="btn btn-outline" onClick={() => setSocialLinks((p) => p.filter((x) => x.id !== s.id))}>
              Eliminar
            </button>
          </div>
        ))}
      </section>

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary">Guardar cambios</button>
      </div>
    </form>
  );
}