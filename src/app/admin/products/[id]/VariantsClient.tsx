'use client';

import { useMemo, useState, useTransition } from 'react';

function money(v: any) {
  const n = Number(v ?? 0);
  return `$${n.toFixed(2)}`;
}

type UpsertPayload = {
  sku?: string | null;
  price?: number | null;
  stock?: number;
  active?: boolean;
  optionValueIds?: number[];
};

export default function VariantsClient(props: {
  productId: number;
  variants: any[];
  options: any[];
  addVariantAction: () => Promise<any>;
  upsertVariantAction: (variant: { id: number } & UpsertPayload) => Promise<any>;
  deleteVariantAction: (id: number) => Promise<any>;
  basePrice?: number;
  salePrice?: number | null;
}) {
  const options = props.options || [];
  const basePrice = Number(props.basePrice ?? 0);
  const salePrice = props.salePrice == null ? null : Number(props.salePrice);

  return (
    <div className="form-grid">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="section-help" style={{ margin: 0 }}>
          <strong>Precio</strong> es <strong>opcional</strong>. Si está vacío, se usa el precio del producto.
        </p>

        <button type="button" className="btn btn-outline" onClick={() => props.addVariantAction()}>
          + Variante
        </button>
      </div>

      {props.variants.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--admin-muted)' }}>
          No hay variantes aún. Creá una variante y asignale la combinación.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table variants-table">
            <colgroup>
              <col style={{ width: 80 }} />
              <col style={{ width: 520 }} />
              <col style={{ width: 190 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 210 }} />
            </colgroup>

            <thead>
              <tr>
                <th>ID</th>
                <th>Combinación</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {props.variants.map((v: any) => (
                <VariantRow
                  key={v.id}
                  v={v}
                  options={options}
                  basePrice={basePrice}
                  salePrice={salePrice}
                  onSave={(data) => props.upsertVariantAction({ id: v.id, ...data })}
                  onDelete={() => props.deleteVariantAction(v.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VariantRow({
  v,
  options,
  basePrice,
  salePrice,
  onSave,
  onDelete,
}: {
  v: any;
  options: any[];
  basePrice: number;
  salePrice: number | null;
  onSave: (data: UpsertPayload) => Promise<any>;
  onDelete: () => Promise<any>;
}) {
  const [pending, startTransition] = useTransition();

  const [sku, setSku] = useState<string>(v.sku ?? '');
  const [price, setPrice] = useState<string>(v.price != null ? String(v.price) : '');
  const [stock, setStock] = useState<number>(v.stock ?? 0);
  const [active, setActive] = useState<boolean>(v.active ?? true);

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

  const isComboValid = options.every((opt) => selectedValues[opt.id]);

  return (
    <tr>
      <td>#{v.id}</td>

      <td>
        <div className="variant-combo">
          <div className="cell-stack">
            <span className="cell-title">{comboLabel}</span>
            <span className="cell-meta">Asigná 1 valor por atributo</span>
          </div>

          <div className="variant-combo__selects">
            {(options || []).map((opt: any) => (
              <label key={opt.id} className="variant-select">
                <span className="variant-select__label">{opt.name}</span>
                <select
                  className="select"
                  value={selectedValues[opt.id]}
                  onChange={(e) =>
                    setSelectedValues((prev) => ({
                      ...prev,
                      [opt.id]: e.target.value ? Number(e.target.value) : '',
                    }))
                  }
                >
                  <option value="">—</option>
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
      </td>

      <td>
        <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
      </td>

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
            placeholder="—"
            aria-label="Precio de variante (opcional)"
          />
          <div className="variants-hint">Vacío = {money(fallback)}</div>
        </div>
      </td>

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
            placeholder="0"
            aria-label="Stock"
          />
        </div>
      </td>

      <td>
        <label className="row" style={{ alignItems: 'center' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Sí
        </label>
      </td>

      <td style={{ textAlign: 'right' }}>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || !isComboValid}
            onClick={() =>
              startTransition(() =>
                onSave({
                  sku: sku || null,
                  price: price.trim() ? Number(price) : null,
                  stock,
                  active,
                  optionValueIds,
                }),
              )
            }
          >
            Guardar
          </button>

          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => {
              if (!confirm('¿Eliminar esta variante?')) return;
              startTransition(() => onDelete());
            }}
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}