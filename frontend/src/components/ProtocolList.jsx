/** Card del sidebar con el listado de protocolos. */
export default function ProtocolList({
  protocolos = [],
  selectedId = null,
  loading = false,
  onSelect,
  onEdit,
}) {
  return (
    <section className="card protocol-list">
      <h2 className="card__title">Protocolos ({protocolos.length})</h2>

      {loading ? (
        <p className="muted">Cargando protocolos…</p>
      ) : protocolos.length === 0 ? (
        <p className="muted">Todavía no hay protocolos. Crea uno arriba.</p>
      ) : (
        <ul className="protocol-list__items">
          {protocolos.map((protocolo) => {
            const active = protocolo.id === selectedId;

            return (
              <li key={protocolo.id} className="protocol-list__row">
                <button
                  type="button"
                  className={`protocol-list__select${
                    active ? ' protocol-list__select--active' : ''
                  }`}
                  onClick={() => onSelect(protocolo.id)}
                  aria-current={active ? 'true' : undefined}
                >
                  <span className="protocol-list__name">{protocolo.nombre}</span>
                  {protocolo.disparador && (
                    <span
                      className="protocol-list__trigger"
                      title={protocolo.disparador}
                    >
                      Disparador: {protocolo.disparador}
                    </span>
                  )}
                  <span className="protocol-list__meta">
                    {protocolo.pasos.length}{' '}
                    {protocolo.pasos.length === 1 ? 'paso' : 'pasos'}
                  </span>
                </button>

                <button
                  type="button"
                  className="protocol-list__edit"
                  onClick={() => onEdit(protocolo)}
                  aria-label={`Editar ${protocolo.nombre}`}
                  title="Editar nombre"
                >
                  ✎
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
