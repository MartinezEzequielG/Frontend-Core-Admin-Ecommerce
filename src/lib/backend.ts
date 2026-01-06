import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Solo helpers que pueden usarse en client y server
export const API = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api/V1';
const ASSETS_BASE = process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL || 'http://localhost:3001';

export function imageUrl(u?: string | null): string {
  if (!u) return '/placeholder.svg';
  if (u.startsWith('/uploads/')) return u;
  if (u.startsWith('http')) return u;
  return `${ASSETS_BASE}${u}`;
}

export async function backendFetch<T = unknown>(path: string, init?: RequestInit): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API}${path}`, { ...init, headers, cache: 'no-store' });

  if (res.status === 401) redirect('/login');
  if (res.status === 403) return null; // evita throw durante render

  if (!res.ok) {
    let message = `Request failed ${res.status}`;
    try {
      message = (await res.json()).message ?? message;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as T;
}
