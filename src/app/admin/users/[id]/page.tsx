import { API, backendFetch } from '@/lib/backend';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

type AdminUser = {
  id: number;
  email: string;
  name?: string | null;
  role: 'CUSTOMER' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN' | 'USER';
  createdAt?: string;
};

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const u = await backendFetch<AdminUser>(`/admin/users/${id}`);
  if (!u) return <main style={{ padding: 24 }}><p>Acceso denegado.</p></main>;

  return (
    <main style={{ padding: 24 }}>
      <h1>{u.email}</h1>
      <p>Rol: {u.role}</p>

      <form action={updateRole.bind(null, Number(id))} style={{ display: 'flex', gap: 8 }}>
        <select name="role" defaultValue={u.role}>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="EDITOR">EDITOR</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPERADMIN">SUPERADMIN</option>
        </select>
        <button type="submit">Actualizar rol</button>
      </form>
    </main>
  );
}

async function updateRole(id: number, formData: FormData) {
  'use server';
  const token = (await cookies()).get('token')?.value;
  const role = String(formData.get('role') || 'CUSTOMER');

  const res = await fetch(`${API}/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ role }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await res.text());
  revalidatePath(`/admin/users/${id}`);
}