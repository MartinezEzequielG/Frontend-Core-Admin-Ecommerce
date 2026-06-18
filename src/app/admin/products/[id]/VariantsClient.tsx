// src/app/admin/products/[id]/VariantsClient.tsx
'use client';

import React, { useMemo, useState, useTransition } from 'react';

function money(v: any) {
  const n = Number(v ?? 0);
  return `$${n.toFixed(2)}`;
}

// ✅ normalizador client-safe (sin depender de funciones del server)
function normalizeImg(raw?: string | null) {
  const r = (raw || '').trim();
  if (!r) return '/placeholder.svg';
  if (r.startsWith('http://') || r.startsWith('https://')) return r;
  if (r.startsWith('/uploads/')) return r;
  if (r.startsWith('uploads/')) return `/${r}`;
  return r.startsWith('/') ? r : `/${r}`;
}

type UpsertPayload = {
  sku?: string | null;
  price?: number | null;
  stock?: number;
  active?: boolean;
  optionValueIds?: number[];
  imageId?: number | null;
  arUrl?: string | null; // ✅ NUEVO
};

type AdminProductImage = { id: number; url: string; position?: number | null };

// ⚠️ Tenías 8 widths pero 9 columnas + acción.
// Dejo 9 columnas (sin la acción), y la acción queda sin col fijo (o podés agregar 10).
const VARIANT_COL_WIDTHS = [80, 520, 220, 190, 180, 120, 110, 360, 60] as const;

export default function VariantsClient(props: {
  productId: number;
  variants: any[];
  options: any[];
  images: AdminProductImage[];
  addVariantAction: () => Promise<any>;
  upsertVariantAction: (variant: { id: number } & UpsertPayload) => Promise<any>;
  deleteVariantAction: (id: number) => Promise<any>;
  basePrice?: number;
  salePrice?: number | null;
}) {
  const options = props.options || [];
  const images = props.images || [];
  const basePrice = Number(props.basePrice ?? 0);
  const salePrice = props.salePrice == null ? null : Number(props.salePrice);

  return (
    <div className="form-grid">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p className="section-help" style={{ margin: 0, maxWidth: 720 }}>
          <strong>Precio</strong> es <strong>opcional</strong>. Si está vacío, se usa el precio del producto.
          <br />
          <span style={{ fontSize: 11, opacity: 0.7 }}>
            Los cambios se guardan automáticamente al salir de cada campo (cuando la combinación es válida).
          </span>
        </p>

        <form action={props.addVariantAction}>
          <button type="submit" className="btn btn-outline">
            + Variante
          </button>
        </form>
      </div>

      {props.variants.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--admin-muted)' }}>
          No hay variantes aún. Creá una variante y asignale la combinación.
        </p>
      ) : (
<<<<<<< HEAD
        <div className="table-wrap">
          <table className="table variants-table">
            <colgroup>
              {VARIANT_COL_WIDTHS.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th>ID</th>
                <th>Combinación</th>
                <th>Imagen</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Activo</th>
                <th>AR URL</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {props.variants.map((v: any) => (
                <VariantRow
                  key={v.id}
                  v={v}
                  options={options}
                  images={images}
                  basePrice={basePrice}
                  salePrice={salePrice}
                  onSave={(data) => props.upsertVariantAction({ id: v.id, ...data })}
                  onDelete={() => props.deleteVariantAction(v.id)}
                />
              ))}
            </tbody>
          </table>
=======
        <div className="variants-list">
          {props.variants.map((v: any) => (
            <VariantCard
              key={v.id}
              v={v}
              options={options}
              images={images}
              basePrice={basePrice}
              salePrice={salePrice}
              onSave={(data) => props.upsertVariantAction({ id: v.id, ...data })}
              onDelete={() => props.deleteVariantAction(v.id)}
            />
          ))}
>>>>>>> 477d02b3b408a39c1b2f8d1b8c1d52deaa4fd19f
        </div>
      )}
    </div>
  );
}

function VariantCard({
  v,
  options,
  images,
  basePrice,
  salePrice,
  onSave,
  onDelete,
}: {
  v: any;
  options: any[];
  images: AdminProductImage[];
  basePrice: number;
  salePrice: number | null;
  onSave: (data: UpsertPayload) => Promise<any>;
  onDelete: () => Promise<any>;
}) {
  const [pending, startTransition] = useTransition();

  const [sku, setSku] = useState<string>(v.sku ?? '');
  const [price, setPrice] = useState<string>(v.price != null ? String(v.price) : '');
  const [stock, setStock] = useState<number>(Number(v.stock ?? 0));
  const [active, setActive] = useState<boolean>(v.active ?? true);

  // ✅ imagen por variante
  const [imageId, setImageId] = useState<number | null>(v.imageId ?? null);

  // ✅ AR por variante
  const [arUrl, setArUrl] = useState<string>(v.arUrl ?? '');
  const [arSaveTimer, setArSaveTimer] = useState<any>(null);

  function scheduleAutoSave(next: string) {
    if (arSaveTimer) clearTimeout(arSaveTimer);
    const t = setTimeout(() => {
      autoSave();
    }, 600);
    setArSaveTimer(t);
  }

  const initialSelected: Record<number, number | ''> = useMemo(() => {
    const out: Record<number, number | ''> = {};
    for (const opt of options || []) {
      const match = (v.options || []).find((vo: any) => vo?.optionValue && vo.optionValue.optionId === opt.id);
      out[opt.id] = match?.optionValue?.id ?? '';
    }
    return out;
  }, [options, v.options]);

  const [selectedValues, setSelectedValues] = useState<Record<number, number | ''>>(initialSelected);

  const optionValueIds = Object.values(selectedValues).filter((x): x is number => typeof x === 'number');

  const comboLabel =
    (options || [])
      .map((opt: any) => {
        const valueId = selectedValues[opt.id];
        const value = (opt.values || []).find((vv: any) => vv.id === valueId);
        return value?.value ?? null;
      })
      .filter(Boolean)
      .join(' / ') || 'Sin combinación';

  const fallback = salePrice ?? basePrice;
  const isComboValid = (options || []).every((opt) => selectedValues[opt.id]);

  const selectedImage = imageId ? images.find((im) => im.id === imageId) : null;
  const previewUrl = normalizeImg(selectedImage?.url ?? v.imageUrl ?? null);

  const autoSave = () => {
    if (pending) return;
    if (!isComboValid) return;

    const changed =
      Number(stock) !== Number(v.stock ?? 0) ||
      String(v.sku ?? '') !== String(sku) ||
      String(v.price != null ? String(v.price) : '') !== String(price.trim()) ||
      Boolean(v.active ?? true) !== Boolean(active) ||
      JSON.stringify(initialSelected) !== JSON.stringify(selectedValues) ||
      (v.imageId ?? null) !== imageId ||
      String(v.arUrl ?? '') !== String(arUrl ?? ''); // ✅ IMPORTANTÍSIMO (antes faltaba)

    if (!changed) return;

    startTransition(() =>
      onSave({
        sku: sku || null,
        price: price.trim() ? Number(price) : null,
        stock,
        active,
        optionValueIds,
        imageId: imageId ?? null,
        arUrl: arUrl?.trim() || null, // ✅
      }),
    );
  };

  return (
    <article className="variant-card" style={{ opacity: pending ? 0.75 : 1 }}>
      <header className="variant-card__header">
        <div className="variant-card__titleblock">
          <div className="variant-card__eyebrow">Variante #{v.id}</div>
          <h3 className="variant-card__title">{comboLabel}</h3>
          <p className="variant-card__meta">
            {isComboValid
              ? 'Combinación lista. Los cambios se guardan al salir de cada campo.'
              : 'Falta completar la combinación para guardar.'}
          </p>
        </div>

<<<<<<< HEAD
      {/* COMBINACIÓN */}
      <td>
        <div className="variant-combo">
          <div className="cell-stack">
            <span className="cell-title">{comboLabel}</span>
            <span className="cell-meta">Asigná 1 valor por atributo {isComboValid ? '' : '· Falta completar'}</span>
          </div>

=======
        <div className="variant-card__status">
          <span className={`variant-status ${active ? 'is-active' : 'is-inactive'}`}>
            {active ? 'Activa' : 'Oculta'}
          </span>
        </div>
      </header>

      <section className="variant-card__section">
        <div className="variant-combo">
>>>>>>> 477d02b3b408a39c1b2f8d1b8c1d52deaa4fd19f
          <div className="variant-combo__selects">
            {(options || []).map((opt: any) => (
              <label key={opt.id} className="variant-select">
                <span className="variant-select__label">{opt.name}</span>
                <select
                  className="select"
                  value={selectedValues[opt.id]}
                  onChange={(e) => {
                    setSelectedValues((prev) => ({
                      ...prev,
                      [opt.id]: e.target.value ? Number(e.target.value) : '',
                    }));
                  }}
                  onBlur={autoSave}
                >
                  <option value="">Seleccionar</option>
                  {(opt.values || []).map((val: any) => (
                    <option key={val.id} value={val.id}>
                      {val.value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* IMAGEN */}
      <td>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                objectFit: 'cover',
                border: '1px solid rgba(15,23,42,0.12)',
                background: '#fff',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--admin-muted)', lineHeight: 1.2 }}>
              {imageId ? `ID imagen: #${imageId}` : 'Sin imagen'}
              <div style={{ opacity: 0.7 }}>Se verá en la tienda para esta variante</div>
=======
      <section className="variant-card__body">
        <div className="variant-card__left">
          <div className="variant-media-card">
            <div className="variant-media-card__preview">
              <img
                src={previewUrl}
                alt=""
                className="variant-media-card__img"
              />
              <div className="variant-media-card__info">
                <strong>{imageId ? `Imagen #${imageId}` : 'Sin imagen asignada'}</strong>
                <span>Se mostrará para esta variante en la tienda.</span>
              </div>
>>>>>>> 477d02b3b408a39c1b2f8d1b8c1d52deaa4fd19f
            </div>

            <label className="variant-field">
              <span className="variant-field__label">Imagen</span>
              <select
                className="select"
                value={imageId ?? ''}
                onChange={(e) => setImageId(e.target.value ? Number(e.target.value) : null)}
                onBlur={autoSave}
              >
                <option value="">Sin imagen</option>
                {(images || [])
                  .slice()
                  .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
                  .map((im) => (
                    <option key={im.id} value={im.id}>
                      #{im.position ?? 0} · id {im.id}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="variant-commercial-grid">
            <label className="variant-field">
              <span className="variant-field__label">SKU</span>
              <input
                className="input"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                onBlur={autoSave}
                placeholder="SKU"
              />
            </label>

            <label className="variant-field">
              <span className="variant-field__label">Precio</span>
              <input
                className="input input--sm input--num"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={autoSave}
                placeholder="—"
                aria-label="Precio de variante (opcional)"
              />
              <span className="variants-hint">Vacío = {money(fallback)}</span>
            </label>
          </div>
        </div>

<<<<<<< HEAD
      {/* SKU */}
      <td>
        <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} onBlur={autoSave} placeholder="SKU" />
      </td>

      {/* PRECIO */}
      <td>
        <div className="variants-num">
          <input
            className="input input--sm input--num"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={autoSave}
            placeholder="—"
            aria-label="Precio de variante (opcional)"
          />
          <div className="variants-hint">Vacío = {money(fallback)}</div>
        </div>
      </td>

      {/* STOCK */}
      <td>
        <div className="variants-num">
          <input
            className="input input--sm input--num"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value || 0))}
            onBlur={autoSave}
            placeholder="0"
            aria-label="Stock"
          />
        </div>
      </td>

      {/* ACTIVO */}
      <td>
        <label className="row" style={{ alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => {
              setActive(e.target.checked);
              // guardado “suave”
              setTimeout(autoSave, 60);
            }}
          />{' '}
          Sí
        </label>
      </td>

      {/* AR URL */}
      <td>
        <div style={{ display: 'grid', gap: 6 }}>
          <input
            className="input"
            type="url"
            value={arUrl}
            onChange={(e) => {
              const next = e.target.value;
              setArUrl(next);
              scheduleAutoSave(next);
            }}
            onBlur={autoSave}
            placeholder="https://..."
          />
          <div style={{ fontSize: 11, color: 'var(--admin-muted)', opacity: 0.85 }}>
            Link del probador AR para esta variante.
          </div>
        </div>
      </td>

      {/* DELETE */}
      <td style={{ textAlign: 'center' }}>
        <form
          action={async () => {
            if (!confirm('¿Eliminar esta variante?')) return;
            startTransition(() => onDelete());
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="btn-icon-delete"
            aria-label="Eliminar variante"
            title="Eliminar variante"
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: pending ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!pending) e.currentTarget.style.background = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </form>
      </td>
    </tr>
=======
        <div className="variant-card__right">
          <div className="variant-stock-card">
            <span className="variant-field__label">Stock disponible</span>
            <input
              className="input variant-stock-card__input"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value || 0))}
              onBlur={autoSave}
              placeholder="0"
              aria-label="Stock"
            />
            <span className="variant-stock-card__hint">
              Valor actual listo para publicar
            </span>
          </div>

          <label className="variant-toggle-card">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => {
                setActive(e.target.checked);
                setTimeout(autoSave, 60);
              }}
            />
            <div>
              <strong>{active ? 'Visible en tienda' : 'Oculta en tienda'}</strong>
              <span>{active ? 'La variante se puede vender.' : 'No aparece para compra.'}</span>
            </div>
          </label>

          <form
            action={async () => {
              if (!confirm('¿Eliminar esta variante?')) return;
              startTransition(() => onDelete());
            }}
          >
            <button
              type="submit"
              disabled={pending}
              className="variant-delete-btn"
              aria-label="Eliminar variante"
              title="Eliminar variante"
            >
              Eliminar variante
            </button>
          </form>
        </div>
      </section>
    </article>
>>>>>>> 477d02b3b408a39c1b2f8d1b8c1d52deaa4fd19f
  );
}
