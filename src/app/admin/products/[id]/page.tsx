import { API, backendFetch } from '@/lib/backend';
import ImagesClient from './ImagesClient';
import VariantsClient from './VariantsClient';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import Link from 'next/link';
import ProductEditNav from './ProductEditNav';
import { redirect } from 'next/navigation'; // ✅ agregar

function normalizeBase(raw: string) {
  const base = raw.replace(/\/+$/, '');
  return base.replace(/\/api\/v1$/i, '');
}

const RAW_BASE =
  process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL ??
  process.env.BACKEND_PUBLIC_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001';

const ASSETS_BASE = normalizeBase(RAW_BASE);
const ASSETS_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_ASSETS_BASE?.replace(/\/+$/, '') || '';

function adminImageUrl(raw?: string | null): string {
  const r = (raw || '').trim();
  if (!r) return '/placeholder.svg';

  // 1) URL absoluta
  if (r.startsWith('http://') || r.startsWith('https://')) return r;

  // 2) key de S3 (ej: "products/xxx.jpg")
  if (ASSETS_PUBLIC_BASE && !r.startsWith('/') && !r.startsWith('uploads/')) {
    return `${ASSETS_PUBLIC_BASE}/${r}`;
  }

  // 3) legacy uploads
  if (r.startsWith('/uploads/')) return `${ASSETS_BASE}${r}`;
  if (r.startsWith('uploads/')) return `${ASSETS_BASE}/${r}`;

  if (r.startsWith('/api/')) return `${ASSETS_BASE}${r.replace(/\/api\/v1/i, '')}`;

  return `${ASSETS_BASE}/uploads/${r.replace(/^\/+/, '')}`;
}

// Server Action para asignar categoría
async function setCategory(productId: number, formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const categoryId = formData.get('categoryId') ? Number(formData.get('categoryId')) : null;
  const res = await fetch(`${API}/admin/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ categoryId }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath(`/admin/products/${productId}`);
}

// NUEVO: Server Action para flags activo/destacado
async function updateFlags(productId: number, formData: FormData) {
  'use server';
  const active = formData.get('active') === 'on';
  const featured = formData.get('featured') === 'on';
  await patchProduct(productId, { active, featured });
}

type AdminCategory = { id: number; name: string; slug: string };

type AdminProductOptionValue = { id: number; value: string };
type AdminProductOption = { id: number; name: string; values?: AdminProductOptionValue[] };

type AdminProductImage = { id: number; url: string; position?: number | null };

type AdminProductVariant = {
  id: number;
  sku?: string | null;
  price?: number | null;
  active?: boolean;
  stock?: any; // en tu backend lo estás mapeando desde onHand; lo dejamos flexible
  options?: any[];
};

type AdminProductDetail = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  salePrice?: number | null;
  sku?: string | null;
  active?: boolean;
  featured?: boolean;
  categoryId?: number | null;

  images?: AdminProductImage[];
  options?: AdminProductOption[];
  variants?: AdminProductVariant[];

  discountTransfer?: number | null;
  discountMp?: number | null;
  isNew?: boolean;
  isHot?: boolean;
  freeShipping?: boolean;
};

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const p = await backendFetch<AdminProductDetail>(`/admin/products/${id}`);
  if (!p) return <main className="admin-content"><p>Acceso denegado.</p></main>;

  const categories = await backendFetch<AdminCategory[]>('/admin/categories');

  const audits =
    (await backendFetch<any[]>(`/admin/products/${id}/audits`).catch(() => null)) ?? [];

  const hasOptions = (p.options || []).length > 0;

  return (
    <main className="admin-page">
      {/* Header sticky con acciones siempre visibles */}
      <header className="product-edit-header" style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--admin-bg)', paddingTop: 12, paddingBottom: 12 }}>
        <div>
          <h1 className="product-edit-title">{p.name}</h1>
          <p className="product-edit-subtitle">ID #{p.id} · {p.slug}</p>
          <ProductEditNav />
        </div>

        <div className="product-edit-actions">
          <button type="submit" form="product-basics-form" className="btn btn-primary">
            💾 Guardar cambios
          </button>
          <Link href="/admin/products" className="btn btn-outline">
            ← Volver al listado
          </Link>
        </div>
      </header>

      <div className="product-edit-grid">
        {/* Columna principal */}
        <div className="product-edit-main">
          
          {/* ✅ 1. BÁSICOS: Más compacto y visual */}
          <section id="basics" className="card form-grid">
            <div className="section-header">
              <div>
                <h2 className="section-title">📝 Datos básicos</h2>
                <p className="section-help">Nombre, precio base y descripción del producto</p>
              </div>
            </div>
            <EditBasics product={p} formId="product-basics-form" />
          </section>

          {/* ✅ 2. IMÁGENES: Más arriba y con vista previa grande */}
          <section id="images" className="card form-grid">
            <div className="section-header">
              <div>
                <h2 className="section-title">🖼️ Imágenes del producto</h2>
                <p className="section-help">
                  Arrastrá para reordenar • Primera imagen = principal
                </p>
              </div>
              <ImagesClient productId={p.id} />
            </div>
            <ImagesGrid product={p} />
          </section>

          {/* ✅ 3. VARIANTES: Simplificado con acordeón */}
          <details id="variants" className="card" open={hasOptions}>
            <summary className="section-header" style={{ cursor: 'pointer', padding: 16, userSelect: 'none' }}>
              <div>
                <h2 className="section-title">🎨 Variantes (Color, Talle, Sabor)</h2>
                <p className="section-help">
                  {hasOptions 
                    ? `${(p.variants || []).length} variante${(p.variants || []).length !== 1 ? 's' : ''} activa${(p.variants || []).length !== 1 ? 's' : ''}`
                    : 'Opcional: Creá variantes si tu producto tiene opciones'}
                </p>
              </div>
            </summary>

            <div className="form-grid" style={{ paddingTop: 0 }}>
              {!hasOptions ? (
                <div style={{ padding: '16px 16px 0' }}>
                  <div className="card" style={{ background: '#f0f9ff', border: '1px solid #bfdbfe', padding: 12 }}>
                    <p className="section-help" style={{ margin: 0 }}>
                      💡 <strong>Tip:</strong> Si tu producto tiene variantes (ej. diferentes sabores o talles), primero agregá los atributos abajo.
                    </p>
                  </div>
                </div>
              ) : null}

              <div id="options" style={{ padding: '0 16px' }}>
                <h3 className="text-sm" style={{ fontWeight: 700, marginBottom: 8 }}>Atributos disponibles</h3>
                <OptionsEditor product={p} />
              </div>

              {hasOptions && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--admin-border)' }}>
                  <VariantsClient
                    productId={p.id}
                    variants={p.variants || []}
                    options={p.options || []}
                    basePrice={Number(p.basePrice ?? 0)}
                    salePrice={p.salePrice == null ? null : Number(p.salePrice)}
                    addVariantAction={addVariant.bind(null, p.id)}
                    upsertVariantAction={upsertVariant.bind(null, p.id)}
                    deleteVariantAction={deleteVariant.bind(null, p.id)}  // <-- aquí
                  />

                  <form action={generateVariants.bind(null, p.id)} className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="submit" className="btn btn-outline">
                      ⚡ Generar todas las combinaciones
                    </button>
                  </form>
                </div>
              )}
            </div>
          </details>

          {/* ✅ 4. AUDITORÍA: Colapsado por defecto */}
          <details id="audit" className="card">
            <summary className="section-header" style={{ cursor: 'pointer', padding: 16, userSelect: 'none' }}>
              <h2 className="section-title">📊 Historial de cambios</h2>
            </summary>
            <div style={{ padding: '0 16px 16px' }}>
              {audits.length ? (
                <ul style={{ fontSize: 12, display: 'grid', gap: 6, margin: 0, paddingLeft: 16 }}>
                  {audits.map((a: any) => (
                    <li key={a.id} className="row" style={{ justifyContent: 'space-between' }}>
                      <span>{a.action}</span>
                      <span style={{ color: 'var(--admin-muted)' }}>{new Date(a.createdAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="section-help">Sin eventos registrados</p>
              )}
            </div>
          </details>
        </div>

        {/* ✅ Columna lateral: más compacta */}
        <aside className="product-edit-side">
          <section className="card form-grid" style={{ position: 'sticky', top: 80 }}>
            <h2 className="section-title">⚙️ Configuración rápida</h2>

            {/* Estado visual con toggles */}
            <form action={updateFlags.bind(null, p.id)} className="form-grid" style={{ gap: 12 }}>
              <label className="toggle-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: 12,
                border: '1px solid var(--admin-border)',
                borderRadius: 10,
                cursor: 'pointer',
                background: p.active ? '#f0fdf4' : 'var(--admin-surface)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>✅ Producto activo</div>
                  <div style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Visible en la tienda</div>
                </div>
                <input type="checkbox" name="active" defaultChecked={p.active} />
              </label>

              <label className="toggle-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: 12,
                border: '1px solid var(--admin-border)',
                borderRadius: 10,
                cursor: 'pointer',
                background: p.featured ? '#fef3c7' : 'var(--admin-surface)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>⭐ Destacado</div>
                  <div style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Aparece en home</div>
                </div>
                <input type="checkbox" name="featured" defaultChecked={p.featured} />
              </label>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Guardar estado
              </button>
            </form>

            {/* Categoría */}
            <form action={setCategory.bind(null, p.id)} className="form-grid" style={{ gap: 8, paddingTop: 12, borderTop: '1px solid var(--admin-border)' }}>
              <label className="text-sm" style={{ fontWeight: 600 }}>📂 Categoría</label>
              <select name="categoryId" defaultValue={p.categoryId ?? ''} className="select">
                <option value="">Sin categoría</option>
                {(categories || []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-outline" style={{ width: '100%' }}>
                Actualizar categoría
              </button>
            </form>

            {/* Quick stats */}
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--admin-border)', fontSize: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--admin-muted)' }}>Stock total:</span>
                <span style={{ fontWeight: 700 }}>
                  {(p.variants || []).reduce((sum: number, v: any) => sum + (v?.stock?.available || 0), 0)} unidades
                </span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--admin-muted)' }}>Imágenes:</span>
                <span style={{ fontWeight: 700 }}>{(p.images || []).length}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--admin-muted)' }}>Variantes:</span>
                <span style={{ fontWeight: 700 }}>{(p.variants || []).length}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

async function patchProduct(id: number, body: any) {
  'use server';
  const token = (await (await import('next/headers')).cookies()).get('token')?.value;
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(await res.text().catch(() => 'Error'));
  }

  // si este server action actualiza algo del producto, normalmente revalida:
  revalidatePath(`/admin/products/${id}`);
}

// Variantes (server actions usadas por VariantsClient)
export async function upsertVariant(
  productId: number,
  variant: {
    id: number;
    sku?: string | null;
    price?: number | null;
    stock?: number;
    active?: boolean;
    optionValueIds?: number[];
  },
) {
  'use server';
  console.log('upsertVariant payload', variant); // <--- agrega esto

  const token = (await cookies()).get('token')?.value;

  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/${productId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({
      id: variant.id,
      sku: variant.sku ?? null,
      price: variant.price ?? null,
      stock: variant.stock ?? 0,
      active: variant.active ?? true,
      optionValueIds: variant.optionValueIds ?? [], // ✅ enviar
    }),
    cache: 'no-store',
  });

  if (res.status === 401) redirect('/admin/login');
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error al guardar variante'));

  revalidatePath(`/admin/products/${productId}`);
}

export async function addVariant(productId: number) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/${productId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({
      sku: `VAR-${productId}-${Date.now()}`,
      price: null,
      stock: 10,
      active: true,
    }),
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/admin/login');
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Error al crear variante');
    throw new Error(msg);
  }

  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteVariant(productId: number, variantId: number) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/variants/${variantId}`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/admin/login');
  }

  if (res.status === 404) {
    // La variante ya no existe (alguien la borró antes, o datos stale).
    // Lo tomamos como éxito y refrescamos la vista.
    revalidatePath(`/admin/products/${productId}`);
    return;
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => 'Error al eliminar variante');
    throw new Error(msg);
  }

  revalidatePath(`/admin/products/${productId}`);
}

// Ajustar EditBasics: solo formulario, sin botón visible, con id configurable
function EditBasics({ product, formId = 'product-basics-form' }: { product: any; formId?: string }) {
  const save = async (formData: FormData) => {
    'use server';
    const name = String(formData.get('name') || '').trim();
    const basePrice = Number(formData.get('basePrice') || 0);
    const salePrice = formData.get('salePrice') ? Number(formData.get('salePrice')) : null;
    const slugInput = String(formData.get('slug') || '');
    const slug =
      (slugInput
        ? (await import('@/lib/slug')).slugify(slugInput)
        : (await import('@/lib/slug')).slugify(name)) || product.slug;
    const description = String(formData.get('description') || '').trim();
    const discountTransfer = Number(formData.get('discountTransfer') || 0);
    const discountMp = Number(formData.get('discountMp') || 0);
    const isNew = formData.get('isNew') === 'on';
    const isHot = formData.get('isHot') === 'on';
    const freeShipping = formData.get('freeShipping') === 'on';
    await patchProduct(product.id, {
      name,
      basePrice,
      salePrice,
      slug,
      description,
      discountTransfer,
      discountMp,
      isNew,
      isHot,
      freeShipping,
    });
  };

  return (
    <form
      id={formId}
      action={save}
      style={{ display: 'grid', gap: 8, maxWidth: 640 }}
    >
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label className="text-sm">Nombre</label>
          <input name="name" defaultValue={product.name} required className="input" />
        </div>
        <div>
          <label className="text-sm">Slug</label>
          <input name="slug" defaultValue={product.slug} placeholder="Slug" className="input" />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label className="text-sm">Precio base</label>
          <input
            name="basePrice"
            type="number"
            step="0.01"
            defaultValue={product.basePrice}
            required
            className="input"
          />
        </div>
        <div>
          <label className="text-sm">Precio oferta</label>
          <input
            name="salePrice"
            type="number"
            step="0.01"
            defaultValue={product.salePrice ?? ''}
            className="input"
          />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label className="text-sm">% OFF Transferencia</label>
          <input
            name="discountTransfer"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={product.discountTransfer ?? ''}
            className="input"
          />
        </div>
        <div>
          <label className="text-sm">% OFF MercadoPago</label>
          <input
            name="discountMp"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={product.discountMp ?? ''}
            className="input"
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <label className="text-sm">
          <input type="checkbox" name="isNew" defaultChecked={product.isNew} /> Nuevo
        </label>
        <label className="text-sm">
          <input type="checkbox" name="isHot" defaultChecked={product.isHot} /> Más vendido
        </label>
        <label className="text-sm">
          <input type="checkbox" name="freeShipping" defaultChecked={product.freeShipping} /> Envío gratis
        </label>
      </div>
      <div>
        <label className="text-sm">Descripción</label>
        <textarea
          name="description"
          defaultValue={product.description ?? ''}
          className="input"
          rows={4}
          style={{ resize: 'vertical' }}
        />
      </div>

    </form>
  );
}

function ImagesGrid({ product }: { product: any }) {
  return (
    <div
      className="cards"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: 10,
      }}
    >
      {(product.images || []).map((img: any, idx: number) => {
        const url = adminImageUrl(img.url);
        const position = typeof img.position === 'number' && img.position > 0 ? img.position : idx + 1;

        return (
          <div key={img.id} className="card" style={{ padding: 8, position: 'relative' }}>
            {/* Badge de posición */}
            <span
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: 'rgba(241,245,249,0.9)',
                color: '#475569',
                fontSize: 11,
                borderRadius: 999,
                padding: '2px 8px',
                fontWeight: 600,
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              #{position}
            </span>

            {/* Botón eliminar arriba a la derecha */}
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                zIndex: 2,
                width: 26,
                height: 26,
                borderRadius: '999px',
                background: 'rgba(248,250,252,0.95)',
                border: '1px solid rgba(148,163,184,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
              }}
            >
              <RemoveImageButton productId={product.id} imageId={img.id} icon />
            </div>

            {/* Miniatura */}
            <img
              src={url}
              alt=""
              style={{
                width: '100%',
                height: 96,
                objectFit: 'cover',
                borderRadius: 10,
                display: 'block',
                marginBottom: 8,
              }}
            />

            {/* Abrir imagen */}
            <div style={{ fontSize: 11, opacity: 0.7, wordBreak: 'break-all', textAlign: 'center' }}>
              <a href={url} target="_blank" rel="noreferrer">
                Abrir imagen
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Reemplaza el botón por un SVG si se pasa prop "icon"
function RemoveImageButton({ productId, imageId, icon }: { productId: number; imageId: number; icon?: boolean }) {
  const remove = async () => {
    'use server';
    const token = (await cookies()).get('token')?.value;
    const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ images: { delete: { id: imageId } } }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(await res.text());
    revalidatePath(`/admin/products/${productId}`);
  };

  return (
    <form action={remove} style={{ display: 'inline' }}>
      <button
        type="submit"
        aria-label="Eliminar imagen"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {icon ? (
          // ícono "X" minimalista
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="9" fill="none" stroke="#e11d48" strokeWidth="1.2" />
            <path d="M7 7l6 6M13 7l-6 6" stroke="#e11d48" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        ) : (
          'Eliminar'
        )}
      </button>
    </form>
  );
}

function OptionsEditor({ product }: { product: any }) {
  const addOption = async (formData: FormData) => {
    'use server';
    const token = (await cookies()).get('token')?.value;
    const name = String(formData.get('name') || '').trim();
    const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/${product.id}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ name }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(await res.text());
    revalidatePath(`/admin/products/${product.id}`);
  };
  return (
    <div className="form-grid">
      <form action={addOption} className="row">
        <input name="name" placeholder="Nombre de opción (ej. Color)" className="input" required />
        <button type="submit" className="btn btn-outline">+ Opción</button>
      </form>

      {(product.options || []).map((opt: any) => (
        <div key={opt.id} className="card form-grid">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{opt.name}</strong>
            <RemoveOptionButton optionId={opt.id} productId={product.id} />
          </div>

          <div className="wrap">
            {(opt.values || []).map((val: any) => (
              <span key={val.id} className="badge">{val.value}</span>
            ))}
          </div>

          <AddOptionValueForm optionId={opt.id} productId={product.id} />
        </div>
      ))}
    </div>
  );
}

function RemoveOptionButton({ optionId, productId }: { optionId: number; productId: number }) {
  const remove = async () => {
    'use server';
    const token = (await cookies()).get('token')?.value;
    const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/options/${optionId}`, {
      method: 'DELETE',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(await res.text());
    revalidatePath(`/admin/products/${productId}`);
  };
  return <form action={remove}><button className="btn btn-outline" type="submit">Eliminar opción</button></form>;
}

function AddOptionValueForm({ optionId, productId }: { optionId: number; productId: number }) {
  const add = async (formData: FormData) => {
    'use server';
    const token = (await cookies()).get('token')?.value;
    const value = String(formData.get('value') || '').trim();
    const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/options/${optionId}/values`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ value }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(await res.text());
    revalidatePath(`/admin/products/${productId}`);
  };
  return (
    <form action={add} className="row">
      <input name="value" placeholder="Valor (ej. Negro)" className="input" required />
      <button type="submit" className="btn btn-outline">+ Valor</button>
    </form>
  );
}

async function generateVariants(productId: number) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/${productId}/variants/generate`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath(`/admin/products/${productId}`);
}