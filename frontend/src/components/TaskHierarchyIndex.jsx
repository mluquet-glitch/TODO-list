import { useEffect, useId, useRef, useState } from 'react';

/**
 * Índice de la familia de la tarea abierta: muestra su tarea padre (o la propia
 * tarea si es raíz) y todas las hijas directas, resaltando la tarea actual.
 * Se presenta como un panel fijo a la derecha para seguir visible al hacer scroll.
 */
export default function TaskHierarchyIndex({ task, tasks, onSelect, onGoHome }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const closeRef = useRef(null);
  const panelId = useId();
  const titleId = useId();

  const parent = task.parentTaskId
    ? tasks.find((candidate) => candidate.id === task.parentTaskId) ?? task
    : task;

  const children = tasks.filter((candidate) => candidate.parentTaskId === parent.id);

  useEffect(() => {
    if (!open) return undefined;

    // Al abrir, el foco pasa al botón de cierre para poder recorrer el panel.
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    function handlePointerDown(event) {
      if (
        panelRef.current?.contains(event.target) ||
        toggleRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={`hierarchy-drawer__toggle ${
          open ? 'hierarchy-drawer__toggle--open' : ''
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Cerrar índice de tareas' : 'Abrir índice de tareas'}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">☰</span>
        Índice
      </button>

      {open && (
        <aside
          ref={panelRef}
          id={panelId}
          className="hierarchy-drawer"
          aria-labelledby={titleId}
        >
          <div className="hierarchy-drawer__header">
            <h2 id={titleId} className="hierarchy-drawer__title">
              Índice
            </h2>
            <button
              ref={closeRef}
              type="button"
              className="hierarchy-drawer__close"
              aria-label="Cerrar índice"
              onClick={() => {
                setOpen(false);
                toggleRef.current?.focus();
              }}
            >
              ×
            </button>
          </div>

          <button
            type="button"
            className="button button--ghost hierarchy-drawer__home"
            onClick={onGoHome}
          >
            <span aria-hidden="true">←</span>
            Volver a la pantalla principal
          </button>

          <nav className="hierarchy-index" aria-label="Jerarquía de tareas">
            <div className="hierarchy-index__group">
              <span className="hierarchy-index__label">Tarea padre</span>
              <div className="hierarchy-index__items">
                <button
                  type="button"
                  className={`hierarchy-index__item ${
                    parent.id === task.id ? 'hierarchy-index__item--current' : ''
                  }`}
                  onClick={() => onSelect(parent.id)}
                  aria-current={parent.id === task.id ? 'page' : undefined}
                >
                  {parent.title}
                  {parent.id === task.id && (
                    <span className="visually-hidden"> (tarea actual)</span>
                  )}
                </button>
              </div>
            </div>

            <div className="hierarchy-index__group">
              <span className="hierarchy-index__label">
                Tareas hijas ({children.length})
              </span>

              {children.length === 0 ? (
                <p className="muted hierarchy-index__empty">Sin subtareas.</p>
              ) : (
                <div className="hierarchy-index__items">
                  {children.map((child) => {
                    const current = child.id === task.id;

                    return (
                      <button
                        key={child.id}
                        type="button"
                        className={`hierarchy-index__item ${
                          current ? 'hierarchy-index__item--current' : ''
                        }`}
                        onClick={() => onSelect(child.id)}
                        aria-current={current ? 'page' : undefined}
                      >
                        {child.title}
                        {current && (
                          <span className="visually-hidden"> (tarea actual)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </aside>
      )}
    </>
  );
}
