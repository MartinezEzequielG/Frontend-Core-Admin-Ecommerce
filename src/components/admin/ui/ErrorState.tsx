export default function ErrorState({ message }: { message: string }) {
  return (
    <div className="card" style={{ borderColor: 'rgba(220, 38, 38, 0.35)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Ocurrió un error</div>
      <div style={{ fontSize: 13, color: 'var(--admin-muted)' }}>{message}</div>
    </div>
  );
}