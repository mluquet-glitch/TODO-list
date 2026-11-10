import { useState } from 'react';

/**
 * Panel flotante que se muestra a la derecha (35% de la pantalla).
 * Se usa para abrir formularios o catálogos desde botones del sidebar.
 */
export default function FloatingPanel({
  open,
  onClose,
  title,
  children,
}) {
  if (!open) return null;

  return (
    <div className="floating-panel__backdrop" onClick={onClose}>
      <section className="floating-panel" onClick={(event) => event.stopPropagation()}>
        <header className="floating-panel__header">
          <h2 className="floating-panel__title">{title}</h2>
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
          >
            Cerrar
          </button>
        </header>
        <div className="floating-panel__body">{children}</div>
      </section>
    </div>
  );
}
