import { useEffect, useId, useRef, useState } from 'react';

/**
 * Desplegable con todos los filtros disponibles (estado, prioridad y
 * categorías). Cada opción se puede activar y desactivar sin cerrar el panel,
 * de modo que se pueden combinar varios filtros del mismo tipo a la vez.
 */
export default function FilterDropdown({ groups, activeKeys, activeFilters, onToggle }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="filter-dropdown" ref={containerRef}>
      <button
        type="button"
        className={`button button--filters ${open ? 'button--filters-open' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        Filtros
        {activeKeys.size > 0 && (
          <span className="filter-dropdown__count" aria-label={`${activeKeys.size} filtros activos`}>
            {activeKeys.size}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="filter-dropdown__panel"
          role="group"
          aria-label="Seleccionar filtros"
        >
          {groups.length === 0 ? (
            <p className="muted filter-dropdown__empty">No hay filtros disponibles.</p>
          ) : (
            groups.map((group) => (
              <div className="filter-dropdown__group" key={group.type}>
                <p className="filter-dropdown__title">{group.label}</p>
                <div className="filter-dropdown__options">
                  {group.options.map((option) => {
                    const active = activeKeys.has(`${group.type}:${option.value}`);
                    const activeFilter = activeFilters.find(
                      (f) => f.type === group.type && f.value === option.value,
                    );
                    const direction = activeFilter?.direction;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`filter-option ${active ? 'filter-option--active' : ''}`}
                        aria-pressed={active}
                        onClick={() =>
                          onToggle({
                            type: group.type,
                            groupLabel: group.label,
                            value: option.value,
                            label: option.label,
                            color: option.color,
                            direction,
                          })
                        }
                      >
                        {option.color && (
                          <span
                            className="filter-option__dot"
                            style={{ backgroundColor: option.color }}
                            aria-hidden="true"
                          />
                        )}
                        {option.label}
                        {active && (
                          <span className="filter-option__check" aria-hidden="true">
                            ✓
                          </span>
                        )}
                        {active && direction === 'asc' && (
                          <span className="filter-option__dir" aria-hidden="true">
                            ↑
                          </span>
                        )}
                        {active && direction === 'desc' && (
                          <span className="filter-option__dir" aria-hidden="true">
                            ↓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
