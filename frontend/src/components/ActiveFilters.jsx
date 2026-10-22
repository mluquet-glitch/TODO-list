/**
 * Botones de los filtros seleccionados. Al hacer click en uno se retira y
 * vuelve a estar disponible en el desplegable.
 */
export default function ActiveFilters({ filters, onRemove, onClear }) {
  if (filters.length === 0) return null;

  return (
    <div className="active-filters">
      <span className="active-filters__label">Filtros activos</span>

      <div className="active-filters__chips">
        {filters.map((filter) => (
          <button
            key={`${filter.type}:${filter.value}`}
            type="button"
            className={`filter-chip filter-chip--${filter.type}`}
            onClick={() => onRemove(filter)}
            title={`Quitar filtro ${filter.groupLabel}: ${filter.label}`}
          >
            {filter.color && (
              <span
                className="filter-chip__dot"
                style={{ backgroundColor: filter.color }}
                aria-hidden="true"
              />
            )}
            <span className="filter-chip__group">{filter.groupLabel}:</span>
            {filter.label}
            <span className="filter-chip__remove" aria-hidden="true">
              ×
            </span>
          </button>
        ))}
      </div>

      <button type="button" className="filter-clear" onClick={onClear}>
        Limpiar todo
      </button>
    </div>
  );
}
