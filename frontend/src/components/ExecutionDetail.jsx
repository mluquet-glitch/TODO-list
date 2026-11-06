import { formatDateTime } from '../utils/dates.js';

/** Vista central de una ejecución seleccionada. */
export default function ExecutionDetail({
  ejecucion,
  saving = false,
  onDelete,
  onOpenProtocol,
}) {
  const { protocolo } = ejecucion;

  return (
    <article className="card execution-detail">
      <header className="execution-detail__header">
        <div>
          <p className="execution-detail__eyebrow">Ejecución</p>
          <h2 className="execution-detail__title">{protocolo.nombre}</h2>
          <p className="muted">
            {formatDateTime(ejecucion.fechaHora)}
          </p>
          {protocolo.disparador && (
            <p className="protocol-detail__trigger">
              <span>Disparador:</span> {protocolo.disparador}
            </p>
          )}
          {protocolo.emociones?.length > 0 && (
            <div className="protocol-detail__emotions">
              <span className="protocol-detail__emotions-label">
                Emociones:
              </span>
              {protocolo.emociones.map((emocion) => (
                <span key={emocion.id} className="badge badge--emotion">
                  {emocion.nombre}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="execution-detail__actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onOpenProtocol(protocolo.id)}
            disabled={saving}
          >
            Ver protocolo
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={() => onDelete(ejecucion)}
            disabled={saving}
          >
            Eliminar ejecución
          </button>
        </div>
      </header>

      <section className="protocol-detail__steps">
        <h3 className="protocol-detail__subtitle">
          Pasos del protocolo ({protocolo.pasos.length})
        </h3>

        {protocolo.pasos.length === 0 ? (
          <p className="muted">El protocolo no tiene pasos registrados.</p>
        ) : (
          <ol className="step-list">
            {protocolo.pasos.map((paso, index) => (
              <li key={paso.id} className="step-card step-card--readonly">
                <span className="step-card__number" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="step-card__body">
                  <h4 className="step-card__name">{paso.nombre}</h4>
                  {paso.descripcion && (
                    <p className="step-card__description">{paso.descripcion}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
