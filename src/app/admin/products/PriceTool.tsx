'use client';

import { useMemo, useState } from 'react';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function roundMoneyARS(n: number) {
  // Si querés centavos: return Math.round(n * 100) / 100;
  return Math.round(n);
}

export default function PriceTool({
  formId,
  defaultCoef = 0.8,
}: {
  formId: string;
  defaultCoef?: number;
}) {
  const [cash, setCash] = useState<string>(''); // “precio efectivo / transferencia”
  const [coef, setCoef] = useState<string>(String(defaultCoef)); // ej 0.8

  const parsed = useMemo(() => {
    const c = Number(coef);
    const t = Number(cash);
    const ok = Number.isFinite(c) && c > 0 && c < 1 && Number.isFinite(t) && t > 0;

    if (!ok) {
      return { ok: false as const, normal: 0, discountTransfer: 0 };
    }

    const normal = roundMoneyARS(t / c);
    const discountTransfer = clamp(Math.round((1 - t / normal) * 100), 0, 100);

    return { ok: true as const, normal, discountTransfer };
  }, [cash, coef]);

  function apply() {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form || !parsed.ok) return;

    const baseInput = form.querySelector<HTMLInputElement>('input[name="basePrice"]');
    const saleInput = form.querySelector<HTMLInputElement>('input[name="salePrice"]');
    const discTInput = form.querySelector<HTMLInputElement>('input[name="discountTransfer"]');

    if (baseInput) {
      baseInput.value = String(parsed.normal);
      baseInput.dispatchEvent(new Event('input', { bubbles: true }));
      baseInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Opcional: si usan salePrice como “precio online”, podés setearlo igual al basePrice
    if (saleInput && !saleInput.value) {
      saleInput.value = String(parsed.normal);
      saleInput.dispatchEvent(new Event('input', { bubbles: true }));
      saleInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (discTInput) {
      discTInput.value = String(parsed.discountTransfer);
      discTInput.dispatchEvent(new Event('input', { bubbles: true }));
      discTInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  return (
    <div
      className="card"
      style={{
        background: 'var(--admin-surface-2)',
        border: '1px solid var(--admin-border)',
        borderRadius: 12,
        padding: 12,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Calculadora (Transfer → Precio normal)</div>
          <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
            Ingresá el precio por transferencia y se completa base + % OFF.
          </div>
        </div>
        <button type="button" className="btn btn-outline" onClick={apply} disabled={!parsed.ok}>
          Aplicar
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '2fr 1fr' }}>
        <label className="text-sm" style={{ display: 'grid', gap: 6 }}>
          Precio transferencia (final deseado)
          <input
            className="input"
            inputMode="decimal"
            placeholder="28900"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </label>

        <label className="text-sm" style={{ display: 'grid', gap: 6 }}>
          Coef (ej 0.8)
          <input
            className="input"
            inputMode="decimal"
            placeholder="0.8"
            value={coef}
            onChange={(e) => setCoef(e.target.value)}
          />
        </label>
      </div>

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
          Precio normal sugerido
          <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--admin-text)' }}>
            {parsed.ok ? `$${parsed.normal}` : '—'}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
          % OFF Transferencia sugerido
          <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--admin-text)' }}>
            {parsed.ok ? `${parsed.discountTransfer}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}