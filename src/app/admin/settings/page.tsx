import { backendFetch } from '@/lib/backend';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function saveSettings(formData: FormData) {
  'use server';

  const data = {
    name: String(formData.get('name') || '').trim(),
    address: String(formData.get('address') || '').trim(),
    whatsappNumber: String(formData.get('whatsappNumber') || '').trim(),
    contactEmail: String(formData.get('contactEmail') || '').trim(),
    ownerPhone: String(formData.get('ownerPhone') || '').trim(),
    ownerFullName: String(formData.get('ownerFullName') || '').trim(),
    ownerEmail: String(formData.get('ownerEmail') || '').trim(),
    documentType: String(formData.get('documentType') || ''),
    documentNumber: String(formData.get('documentNumber') || '').trim(),
    currency: String(formData.get('currency') || 'ARS').trim(),
  };

  await backendFetch('/admin/store-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const settings = await backendFetch('/admin/store-settings');

  return (
    <main className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">⚙️ Configuración</h1>
          <p className="page-header__subtitle">
            Datos del negocio y configuración de pagos (MercadoPago)
          </p>
        </div>
      </div>

      {/* Alerta de éxito */}
      {saved && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            border: '1px solid #6ee7b7',
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: '#065f46', fontWeight: 600 }}>
            ✓ Configuración guardada correctamente
          </p>
        </div>
      )}

      <form action={saveSettings} className="form-grid" style={{ gap: 16 }}>
        {/* Sección 1: Información del negocio */}
        <section className="card form-grid">
          <div className="section-header">
            <div>
              <h2 className="section-title">🏪 Información del negocio</h2>
              <p className="section-help">Datos públicos de tu tienda</p>
            </div>
          </div>

          <div className="form-cols-2">
            <div>
              <label className="text-sm" htmlFor="name">
                Nombre de la tienda <span style={{ color: 'var(--admin-red)' }}>*</span>
              </label>
              <input
                id="name"
                name="name"
                defaultValue={settings.name ?? ''}
                placeholder="Mi Tienda"
                className="input"
                required
              />
            </div>
            <div>
              <label className="text-sm" htmlFor="currency">Moneda</label>
              <select id="currency" name="currency" defaultValue={settings.currency ?? 'ARS'} className="select">
                <option value="ARS">ARS - Peso argentino</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="BRL">BRL - Real brasileño</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm" htmlFor="address">Dirección del local</label>
            <input
              id="address"
              name="address"
              defaultValue={settings.address ?? ''}
              placeholder="Av. Principal 123, Ciudad, Provincia"
              className="input"
            />
          </div>

          <div className="form-cols-2">
            <div>
              <label className="text-sm" htmlFor="whatsappNumber">WhatsApp</label>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                defaultValue={settings.whatsappNumber ?? ''}
                placeholder="+54 9 11 1234-5678"
                className="input"
              />
              <p className="section-help">Incluí código de país y área</p>
            </div>
            <div>
              <label className="text-sm" htmlFor="contactEmail">Email de contacto</label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail ?? ''}
                placeholder="info@mitienda.com"
                className="input"
              />
            </div>
          </div>
        </section>

        {/* Sección 2: Datos del titular (MercadoPago) */}
        <section className="card form-grid">
          <div className="section-header">
            <div>
              <h2 className="section-title">👤 Datos del titular</h2>
              <p className="section-help">
                Requeridos para integración con MercadoPago
              </p>
            </div>
          </div>

          <div className="form-cols-2">
            <div>
              <label className="text-sm" htmlFor="ownerFullName">Nombre completo</label>
              <input
                id="ownerFullName"
                name="ownerFullName"
                defaultValue={settings.ownerFullName ?? ''}
                placeholder="Juan Pérez"
                className="input"
              />
            </div>
            <div>
              <label className="text-sm" htmlFor="ownerEmail">Email del titular</label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                defaultValue={settings.ownerEmail ?? ''}
                placeholder="titular@email.com"
                className="input"
              />
            </div>
          </div>

          <div className="form-cols-2">
            <div>
              <label className="text-sm" htmlFor="ownerPhone">Teléfono del titular</label>
              <input
                id="ownerPhone"
                name="ownerPhone"
                defaultValue={settings.ownerPhone ?? ''}
                placeholder="+54 9 11 1234-5678"
                className="input"
              />
            </div>
            <div>
              <label className="text-sm" htmlFor="documentType">Tipo de documento</label>
              <select
                id="documentType"
                name="documentType"
                defaultValue={settings.documentType ?? ''}
                className="select"
              >
                <option value="">Seleccionar...</option>
                <option value="DNI">DNI - Argentina</option>
                <option value="CUIL">CUIL - Argentina</option>
                <option value="CUIT">CUIT - Argentina</option>
                <option value="CPF">CPF - Brasil</option>
                <option value="RUT">RUT - Chile</option>
                <option value="ID">ID - Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm" htmlFor="documentNumber">Número de documento</label>
            <input
              id="documentNumber"
              name="documentNumber"
              defaultValue={settings.documentNumber ?? ''}
              placeholder="12345678"
              className="input"
            />
          </div>

          <div
            className="card"
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              padding: 12,
              marginTop: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#78350f' }}>
              <strong>Nota:</strong> Estos datos son necesarios para crear preferencias de pago
              en MercadoPago. Asegurate de que coincidan con tu cuenta de MP.
            </p>
          </div>
        </section>

        {/* Botones de acción */}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <a href="/admin" className="btn btn-outline">
            Cancelar
          </a>
          <button type="submit" className="btn btn-primary">
            Guardar configuración
          </button>
        </div>
      </form>
    </main>
  );
}