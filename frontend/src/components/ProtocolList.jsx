import { useId } from 'react';
import EmotionButtons from './EmotionButtons.jsx';

/** Card del sidebar con el listado y los filtros de protocolos. */
export default function ProtocolList({
  protocolos = [],
  selectedId = null,
  loading = false,
  activoFilter = 'true',
  emociones = [],
  emocionesLoading = false,
  emocionFilterIds = [],
  onFilterChange,
  onToggleEmocion,
  onClearEmociones,
  onSelect,
  onEdit,
}) {
  const filterId = useId();
  const filtered =
    activoFilter !== 'true' || emocionFilterIds.length > 0;

  return (
    <section className="card protocol-list">
      <h2 className="card__title">Protocolos ({protocolos.length})</h2>

      <div className="protocol-list__filter">
        <label htmlFor={filterId}>Mostrar</label>
        <select
          id={filterId}
          value={activoFilter}
          onChange={(event) => onFilterChange(event.target.value)}
        >
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      <div className="protocol-list__emotion-filter">
        <div className="protocol-list__filter-head">
          <span className="field__label">Filtrar por emoción</span>
          {emocionFilterIds.length > 0 && (
            <button
              type="button"
              className="protocol-list__clear-filter"
              onClick={onClearEmociones}
            >
              Limpiar
            </button>
          )}
        </div>
        <EmotionButtons
          emociones={emociones}
          selectedIds={emocionFilterIds}
          onToggle={onToggleEmocion}
          disabled={emocionesLoading}
          emptyText={
            emocionesLoading
              ? 'Cargando emociones…'
              : 'Todavía no hay emociones creadas.'
          }
          ariaLabel="Filtrar protocolos por emoción"
        />
      </div>

      {loading ? (
        <p className="muted">Cargando protocolos…</p>
      ) : protocolos.length === 0 ? (
        <p className="muted">
          {filtered
            ? 'No hay protocolos para los filtros seleccionados.'
            : 'Todavía no hay protocolos. Crea uno arriba.'}
        </p>
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
                  <span className="protocol-list__name-row">
                    <span className="protocol-list__name">
                      {protocolo.nombre}
                    </span>
                    <span
                      className={`badge ${
                        protocolo.activo ? 'badge--done' : 'badge--pending'
                      }`}
                    >
                      {protocolo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </span>
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
                    {protocolo.emociones?.length > 0 &&
                      ` · ${protocolo.emociones.length} ${
                        protocolo.emociones.length === 1
                          ? 'emoción'
                          : 'emociones'
                      }`}
                  </span>
                </button>

                <button
                  type="button"
                  className="protocol-list__edit"
                  onClick={() => onEdit(protocolo)}
                  aria-label={`Editar ${protocolo.nombre}`}
                  title="Editar protocolo"
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
