export default function StatusBadge({ active }: { active: boolean }) {
  return <span className={`badge badge--status ${active ? 'badge--active' : 'badge--inactive'}`}>{active ? 'Activo' : 'Inactivo'}</span>;
}