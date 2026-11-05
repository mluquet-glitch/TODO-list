import { Fragment, useEffect, useId, useRef, useState } from 'react';

/** Color del contador de pendientes según la cantidad. */
function countTone(count) {
  if (count === 0) return 'filter-option__count--zero';
  if (count <= 2) return 'filter-option__count--low';
  if (count <= 5) return 'filter-option__count--medium';
  return 'filter-option__count--high';
}

/**
 * Desplegable con todos los filtros disponibles (estado, prioridad y
 * categorías). Cada opción se puede activar y desactivar sin cerrar el panel,
 * de modo que se pueden combinar varios filtros del mismo tipo a la vez.
 */
export default function FilterDropdown({
  groups,
  activeKeys,
  activeFilters,
  categoryCounts = new Map(),
  onToggle,
}) {
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

  /**
   * Las opciones con hijas (categorías) solo muestran sus hijas cuando la
   * opción padre está activa. Las hijas se insertan después del padre en la
   * misma lista y con un estilo distinto.
   */
  function renderGroupOptions(group) {
    const options = group.options ?? [];
    const byValue = new Map(options.map((option) => [option.value, option]));
    const childrenByParent = new Map();

    for (const option of options) {
      const hasParent =
        option.parentId != null && byValue.has(option.parentId);
      const parentValue = hasParent ? option.parentId : null;
      const list = childrenByParent.get(parentValue) ?? [];
      list.push(option);
      childrenByParent.set(parentValue, list);
    }

    function renderOption(option, depth) {
      const key = `${group.type}:${option.value}`;
      const active = activeKeys.has(key);
      const activeFilter = activeFilters.find(
        (f) => f.type === group.type && f.value === option.value,
      );
      const direction = activeFilter?.direction;
      const children = childrenByParent.get(option.value) ?? [];
      const showChildren = active && children.length > 0;
      const pendingCount = categoryCounts.get(option.value) ?? 0;
      const isCategory = group.type === 'category';

      return (
        <Fragment key={key}>
          <button
            type="button"
            className={`filter-option ${active ? 'filter-option--active' : ''} ${
              depth > 0 ? 'filter-option--sub' : ''
            }`}
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
            {isCategory && (
              <span
                className={`filter-option__count ${countTone(pendingCount)}`}
                title={`${pendingCount} tarea${
                  pendingCount === 1 ? '' : 's'
                } pendiente${pendingCount === 1 ? '' : 's'}`}
              >
                {pendingCount}
              </span>
            )}
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

          {showChildren &&
            children.map((child) => renderOption(child, depth + 1))}
        </Fragment>
      );
    }

    return (childrenByParent.get(null) ?? []).map((option) =>
      renderOption(option, 0),
    );
  }

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
                  {renderGroupOptions(group)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
