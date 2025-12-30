import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

type SP = Promise<{ q?: string; role?: string; page?: string }>;

export default async function UsersList({ searchParams }: { searchParams: SP }) {
  const { q = '', role = '', page = '1' } = await searchParams;

  const all = await backendFetch<any[]>('/admin/users');
  if (!all) return <main className="admin-content"><p>Acceso denegado.</p></main>;

  const term = q.toLowerCase();
  const filtered = all.filter((u) => {
    const matchesRole = role ? u.role === role : true;
    const matchesTerm = term
      ? (u.email?.toLowerCase().includes(term) || u.name?.toLowerCase().includes(term))
      : true;
    return matchesRole && matchesTerm;
  });

  const pageSize = 20;
  const currentPage = Math.max(1, Number(page) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const exportUrl = `${process.env.BACKEND_API_URL}/admin/users/export`;

  return (
    <main className="admin-content">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Usuarios</h1>
        <a href={exportUrl} className="btn btn-primary">
          Export CSV
        </a>
      </header>

      {/* Filtros */}
      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <form className="filters" style={{ gridTemplateColumns: '2fr 1fr auto' }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por email o nombre"
            className="input"
          />
          <select name="role" defaultValue={role} className="select">
            <option value="">Todos los roles</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="EDITOR">EDITOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
          </select>
          <button type="submit" className="btn btn-outline">
            Filtrar
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
          Mostrando {items.length} de {filtered.length} usuarios
        </p>
      </section>

      {/* Tabla */}
      <section className="table-wrap" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{u.email}</span>
                    <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{u.name}</span>
                  </div>
                </td>
                <td>
                  <span className="badge">{u.role}</span>
                </td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
                <td>
                  <Link href={`/admin/users/${u.id}`} className="btn btn-outline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Paginación simple en cliente */}
      <nav
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Link
          href={`/admin/users?page=${Math.max(1, currentPage - 1)}&q=${encodeURIComponent(
            q,
          )}&role=${role}`}
          className="btn btn-outline"
        >
          Prev
        </Link>
        <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
          Página {currentPage} de {totalPages}
        </span>
        <Link
          href={`/admin/users?page=${Math.min(
            totalPages,
            currentPage + 1,
          )}&q=${encodeURIComponent(q)}&role=${role}`}
          className="btn btn-outline"
        >
          Next
        </Link>
      </nav>
    </main>
  );
}