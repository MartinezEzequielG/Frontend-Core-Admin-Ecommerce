import { backendFetch } from '@/lib/backend';
import ImagesClient from './ImagesClient';
import VariantsClient from './VariantsClient';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import Link from 'next/link';
import ProductEditNav from './ProductEditNav';

const RAW_BASE =
  process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL ??
  process.env.BACKEND_PUBLIC_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001';

// elimina /api/v1 (cualquier casing) con o sin slash final
const ASSETS_BASE = RAW_BASE.replace(/\/api\/v1\/?$/i, '');

function adminImageUrl(raw?: string | null): string {
  const r = (raw || '').trim();
  if (!r) return `/placeholder.svg`; // o tu placeholder local

  // absoluta => ok
  if (r.startsWith('http')) return r;

  // ✅ si viene de backend como /uploads/..., servilo por el proxy del admin
  if (r.startsWith('/uploads/')) return r;

  // soporta valores tipo "uploads/xxx.jpg"
  if (r.startsWith('uploads/')) return `/${r}`;

  // si por error viene /api/v1/uploads/..., normalizá a /uploads/...
  if (r.startsWith('/api/')) return r.replace(/\/api\/v1/i, '');

  // fallback: asumir filename
  return `/uploads/${r.replace(/^\/+/, '')}`;
}

// Server Action para asignar categoría
async function setCategory(productId: number, formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const categoryId = formData.get('categoryId') ? Number(formData.get('categoryId')) : null;
  const res = await fetch(`${process.env.BACKEND_API_URL}/admin/products/${productId}`, {
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

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await backendFetch(`/admin/products/${id}`);
  if (!p) return <main className="admin-content"><p>Acceso denegado.</p></main>;
  const categories = await backendFetch('/admin/categories');
  const audits = await backendFetch<any[]>(`/admin/products/${id}/audits`).catch(() => []);
  const hasOptions = (p.options || []).length > 0;

  return (
    <main className="admin-page">
      {/* antes: <header className="card product-edit-header"> */}
      <header className="product-edit-header">
        <div>
          <h1 className="product-edit-title">{p.name}</h1>
          <p className="product-edit-subtitle">
            ID #{p.id} · {p.slug}
          </p>
          <ProductEditNav />
        </div>

        <div className="product-edit-actions">
          <button type="submit" form="product-basics-form" className="btn btn-primary">
            Guardar
          </button>
          <Link href="/admin/products" className="btn btn-outline">
            Volver
          </Link>
        </div>
      </header>

      <div className="product-edit-grid">
        {/* Columna principal */}
        <div className="product-edit-main">
          <section id="basics" className="card form-grid">
            <h2 className="section-title">Datos básicos</h2>
            <p className="section-help">
              Estos precios se usan como <strong>precio por defecto</strong>. Si una variante tiene precio propio, <strong>ese</strong> es el que se usa.
            </p>
            <EditBasics product={p} formId="product-basics-form" />
          </section>

          {/* ✅ MOVIDO: Imágenes debajo de básicos */}
          <section id="images" className="card form-grid">
            <h2 className="section-title">Imágenes</h2>
            <ImagesGrid product={p} />
            <ImagesClient productId={p.id} />
          </section>

          <section id="options" className="card form-grid">
            <h2 className="section-title">Atributos (Color, Talle, Sabor)</h2>
            <p className="section-help">
              Definí atributos y valores. Luego generá variantes y cargá stock/precio por combinación.
            </p>

            {/* (Opcional) Si querés, el “debug list” lo puedo convertir en <details> */}
            <OptionsEditor product={p} />
          </section>

          <section id="variants" className="card form-grid">
            <h2 className="section-title">Variantes</h2>
            <p className="section-help">
              “Precio (variante)” es opcional. Si lo dejás vacío, la variante usa el precio del producto.
            </p>

            {hasOptions ? (
              <>
                <VariantsClient
                  productId={p.id}
                  variants={p.variants || []}
                  options={p.options || []}
                  basePrice={Number(p.basePrice ?? 0)}          // ✅ nuevo
                  salePrice={p.salePrice == null ? null : Number(p.salePrice)} // ✅ nuevo
                  addVariantAction={addVariant.bind(null, p.id)}
                  upsertVariantAction={upsertVariant.bind(null, p.id)}
                  deleteVariantAction={deleteVariant}
                />

                <form action={generateVariants.bind(null, p.id)} className="row" style={{ justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-outline">
                    Generar variantes desde atributos
                  </button>
                </form>
              </>
            ) : (
              <p className="section-help">Primero agregá al menos un atributo arriba para poder crear variantes.</p>
            )}
          </section>

          <section id="audit" className="card form-grid">
            <h2 className="section-title">Auditoría</h2>

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
              <p className="section-help">Sin eventos</p>
            )}
          </section>
        </div>

        {/* Columna lateral */}
        <aside className="product-edit-side">
          <section className="card form-grid">
            <h2 className="section-title">Estado & categoría</h2>

            <form action={updateFlags.bind(null, p.id)} className="row">
              <label className="text-sm row">
                <input type="checkbox" name="active" defaultChecked={p.active} /> Activo
              </label>
              <label className="text-sm row">
                <input type="checkbox" name="featured" defaultChecked={p.featured} /> Destacado
              </label>
              <button type="submit" className="btn btn-outline">Guardar</button>
            </form>

            <form action={setCategory.bind(null, p.id)} className="row">
              <select name="categoryId" defaultValue={p.categoryId ?? ''} className="select">
                <option value="">Sin categoría</option>
                {(categories || []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-outline">Asignar</button>
            </form>
          </section>

          <section id="audit" className="card form-grid">
            <h2 className="section-title">Auditoría</h2>

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
              <p className="section-help">Sin eventos</p>
            )}
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

export async function deleteVariant(variantId: number) {
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
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Error al eliminar variante');
    throw new Error(msg);
  }
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
    await patchProduct(product.id, { name, basePrice, salePrice, slug });
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

      {/* ya no tiene botón aquí; se usa el del header */}
    </form>
  );
}

function ImagesGrid({ product }: { product: any }) {
  return (
    <div className="cards" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
      {(product.images || []).map((img: any) => {
        const url = adminImageUrl(img.url);

        return (
          <div key={img.id} className="card" style={{ padding: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 6,
              }}
            >
              <span className="badge">#{img.position}</span>
              <RemoveImageButton productId={product.id} imageId={img.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RemoveImageButton({ productId, imageId }: { productId: number; imageId: number }) {
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
  return <form action={remove}><button className="btn btn-outline" type="submit">Eliminar</button></form>;
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