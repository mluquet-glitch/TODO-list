import { formatDateTime } from '../utils/dates.js';

/** Card del sidebar con las ejecuciones registradas. */
export default function ExecutionList({
  ejecuciones = [],
  selectedId = null,
  loading = false,
  onSelect,
}) {
  return (
    <section className="card execution-list">
      <h2 className="card__title">Ejecuciones ({ejecuciones.length})</h2>

      {loading ? (
        <p className="muted">Cargando ejecuciones…</p>
      ) : ejecuciones.length === 0 ? (
        <p className="muted">
          Todavía no hay ejecuciones. Abre un protocolo y pulsa “Ejecutar”.
        </p>
      ) : (
        <ul className="execution-list__items">
          {ejecuciones.map((ejecucion) => {
            const active = ejecucion.id === selectedId;

            return (
              <li key={ejecucion.id}>
                <button
                  type="button"
                  className={`execution-list__item${
                    active ? ' execution-list__item--active' : ''
                  }`}
                  onClick={() => onSelect(ejecucion.id)}
                  aria-current={active ? 'true' : undefined}
                >
                  <span className="execution-list__name">
                    {ejecucion.protocolo.nombre}
                  </span>
                  <span className="execution-list__date">
                    {formatDateTime(ejecucion.fechaHora)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
