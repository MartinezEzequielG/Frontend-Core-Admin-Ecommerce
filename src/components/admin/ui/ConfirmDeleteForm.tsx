'use client';

import { useId, useState } from 'react';

export default function ConfirmDeleteForm({
  action,
  confirmText,
  title = 'Confirmar eliminación',
  subtitle = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmText: string;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const modalId = useId();

  return (
    <>
      {/* Botón trigger (lo que pases como children) */}
      <span
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen(true);
        }}
      >
        {children}
      </span>

      {/* Modal */}
      {open ? (
        <div
          aria-hidden={!open}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(2,6,23,0.55)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${modalId}-title`}
            aria-describedby={`${modalId}-desc`}
            style={{
              width: 'min(520px, 100%)',
              background: 'white',
              borderRadius: 16,
              border: '1px solid rgba(15,23,42,0.10)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 16, borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
              <div id={`${modalId}-title`} style={{ fontWeight: 900, fontSize: 14 }}>
                {title}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{subtitle}</div>
            </div>

            <div style={{ padding: 16 }}>
              <div id={`${modalId}-desc`} style={{ fontSize: 13, lineHeight: 1.5 }}>
                {confirmText}
              </div>
            </div>

            <div
              style={{
                padding: 16,
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                borderTop: '1px solid rgba(15,23,42,0.08)',
                background: 'rgba(248,250,252,0.9)',
              }}
            >
              <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                {cancelLabel}
              </button>

              {/* IMPORTANTE: acá NO hay onSubmit pasado por props */}
              <form
                action={async (fd) => {
                  // Cerramos el modal antes para sensación de rapidez
                  setOpen(false);
                  await action(fd);
                }}
                style={{ display: 'inline' }}
              >
                <button type="submit" className="btn btn-danger">
                  {confirmLabel}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
