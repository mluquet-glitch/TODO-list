/** Mensaje de error/éxito reutilizable con acción de reintento opcional. */
export default function Alert({ type = 'error', message, onRetry, onClose }) {
  if (!message) return null;

  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>

      <div className="alert__actions">
        {onRetry && (
          <button type="button" className="alert__button" onClick={onRetry}>
            Reintentar
          </button>
        )}
        {onClose && (
          <button
            type="button"
            className="alert__button"
            onClick={onClose}
            aria-label="Cerrar mensaje"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
