/**
 * Control de estado de una tarea.
 * Solo existen dos estados: completada (marcado) y pendiente (sin marcar).
 */
export default function StatusCheckbox({
  id,
  status,
  disabled = false,
  onChange,
  className = '',
}) {
  const done = status === 'done';

  return (
    <label
      className={`status-checkbox ${done ? 'status-checkbox--done' : ''} ${className}`.trim()}
      htmlFor={id}
    >
      <input
        id={id}
        type="checkbox"
        checked={done}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.checked ? 'done' : 'pending')
        }
      />
      <span className="status-checkbox__label">
        {done ? 'Completada' : 'Pendiente'}
      </span>
    </label>
  );
}
