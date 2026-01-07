import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import ContentEditor from './ContentEditor';
import { API } from '@/lib/backend';

async function fetchSiteConfig() {
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login');

  const res = await fetch(`${API}/admin/site`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error cargando contenido'));
  return res.json();
}

async function saveSiteConfig(formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login');

  const payload = JSON.parse(String(formData.get('payload') || '{}'));

  const res = await fetch(`${API}/admin/site`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error guardando contenido'));

  revalidatePath('/admin/content');
}

export default async function AdminContentPage() {
  const cfg = await fetchSiteConfig();

  return (
    <main className="admin-page">
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Contenido del Store</h1>
      <p className="section-help">Editá banners, logo y redes sociales sin tocar código.</p>

      <ContentEditor initial={cfg} saveAction={saveSiteConfig} />
    </main>
  );
}