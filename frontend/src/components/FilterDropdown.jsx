import { useEffect, useId, useRef, useState } from 'react';

/**
 * Desplegable con todos los filtros disponibles de la base de datos
 * (estado, prioridad y categorías). Al elegir una opción se convierte en un
 * filtro activo y desaparece de la lista; si se retira, vuelve a aparecer aquí.
 */
export default function FilterDropdown({ groups, activeKeys, onSelect }) {
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

  const availableGroups = groups
    .map((group) => ({
      ...group,
      options: group.options.filter(
        (option) => !activeKeys.has(`${group.type}:${option.value}`),
      ),
    }))
    .filter((group) => group.options.length > 0);

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
          aria-label="Añadir filtros"
        >
          {availableGroups.length === 0 ? (
            <p className="muted filter-dropdown__empty">
              Todos los filtros disponibles están activos.
            </p>
          ) : (
            availableGroups.map((group) => (
              <div className="filter-dropdown__group" key={group.type}>
                <p className="filter-dropdown__title">{group.label}</p>
                <div className="filter-dropdown__options">
                  {group.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="filter-option"
                      onClick={() => onSelect({
                        type: group.type,
                        groupLabel: group.label,
                        value: option.value,
                        label: option.label,
                        color: option.color,
                      })}
                    >
                      {option.color && (
                        <span
                          className="filter-option__dot"
                          style={{ backgroundColor: option.color }}
                          aria-hidden="true"
                        />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
