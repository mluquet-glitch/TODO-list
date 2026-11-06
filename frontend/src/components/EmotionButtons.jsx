/**
 * Fila de botones de emociones reutilizable para el formulario y los filtros.
 * Cada botón alterna su id dentro de `selectedIds`.
 */
export default function EmotionButtons({
  emociones = [],
  selectedIds = [],
  onToggle,
  disabled = false,
  emptyText = 'Todavía no hay emociones.',
  ariaLabel = 'Emociones',
}) {
  const selected = new Set(selectedIds);

  if (emociones.length === 0) {
    return <p className="muted emotion-buttons__empty">{emptyText}</p>;
  }

  return (
    <div className="emotion-buttons" role="group" aria-label={ariaLabel}>
      {emociones.map((emocion) => {
        const active = selected.has(emocion.id);

        return (
          <button
            key={emocion.id}
            type="button"
            className={`emotion-buttons__option${
              active ? ' emotion-buttons__option--active' : ''
            }`}
            aria-pressed={active}
            onClick={() => onToggle?.(emocion.id)}
            disabled={disabled}
          >
            {emocion.nombre}
          </button>
        );
      })}
    </div>
  );
}
