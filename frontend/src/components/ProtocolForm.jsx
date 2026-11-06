import { useEffect, useId, useState } from 'react';
import EmotionButtons from './EmotionButtons.jsx';

/** Formulario de alta y edición de un protocolo. */
export default function ProtocolForm({
  editingProtocol = null,
  emociones = [],
  emocionesLoading = false,
  saving = false,
  onCreate,
  onUpdate,
  onCancelEdit,
}) {
  const [nombre, setNombre] = useState('');
  const [disparador, setDisparador] = useState('');
  const [activo, setActivo] = useState(true);
  const [emocionIds, setEmocionIds] = useState([]);
  const [localError, setLocalError] = useState('');
  const inputId = useId();
  const disparadorId = useId();
  const activoId = useId();

  useEffect(() => {
    setNombre(editingProtocol?.nombre ?? '');
    setDisparador(editingProtocol?.disparador ?? '');
    setActivo(editingProtocol?.activo ?? true);
    setEmocionIds(
      editingProtocol?.emociones?.map((emocion) => emocion.id) ?? [],
    );
    setLocalError('');
  }, [editingProtocol]);

  // Si una emoción se elimina del catálogo, se quita de la selección local.
  useEffect(() => {
    if (emocionesLoading) return;

    const validIds = new Set(emociones.map((emocion) => emocion.id));
    setEmocionIds((current) => {
      const next = current.filter((id) => validIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [emociones, emocionesLoading]);

  function toggleEmocion(id) {
    setEmocionIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const value = nombre.trim();
    if (!value) {
      setLocalError('El nombre es obligatorio.');
      return;
    }

    const trigger = disparador.trim() || null;

    if (editingProtocol) {
      const updated = await onUpdate(editingProtocol.id, {
        nombre: value,
        disparador: trigger,
        activo,
        emocionIds,
      });
      if (updated) onCancelEdit?.();
      return;
    }

    const created = await onCreate({
      nombre: value,
      disparador: trigger,
      activo,
      emocionIds,
    });
    if (created) {
      setNombre('');
      setDisparador('');
      setActivo(true);
      setEmocionIds([]);
    }
  }

  return (
    <form className="card protocol-form" onSubmit={handleSubmit} noValidate>
      <h2 className="card__title">
        {editingProtocol ? 'Editar protocolo' : 'Nuevo protocolo'}
      </h2>

      <div className="field">
        <label htmlFor={inputId}>Nombre</label>
        <input
          id={inputId}
          type="text"
          value={nombre}
          onChange={(event) => {
            setNombre(event.target.value);
            if (localError) setLocalError('');
          }}
          maxLength={255}
          placeholder="Nombre del protocolo"
          autoComplete="off"
          aria-invalid={Boolean(localError)}
        />
        {localError && <span className="field__error">{localError}</span>}
      </div>

      <div className="field">
        <label htmlFor={disparadorId}>Disparador (opcional)</label>
        <input
          id={disparadorId}
          type="text"
          value={disparador}
          onChange={(event) => setDisparador(event.target.value)}
          maxLength={255}
          placeholder="Evento o condición que inicia el protocolo"
          autoComplete="off"
        />
      </div>

      <label className="protocol-form__check" htmlFor={activoId}>
        <input
          id={activoId}
          type="checkbox"
          checked={activo}
          onChange={(event) => setActivo(event.target.checked)}
        />
        <span>Activo</span>
      </label>

      <div className="field">
        <span className="field__label">Emociones</span>
        <EmotionButtons
          emociones={emociones}
          selectedIds={emocionIds}
          onToggle={toggleEmocion}
          disabled={saving || emocionesLoading}
          emptyText={
            emocionesLoading
              ? 'Cargando emociones…'
              : 'Todavía no hay emociones. Créalas en el gestor del sidebar.'
          }
          ariaLabel="Seleccionar emociones del protocolo"
        />
        <p className="muted protocol-form__hint">
          Haz clic en una emoción para vincularla o desvincularla.
        </p>
      </div>

      <div className="protocol-form__actions">
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving
            ? 'Guardando…'
            : editingProtocol
              ? 'Guardar cambios'
              : 'Crear protocolo'}
        </button>

        {editingProtocol && (
          <button
            type="button"
            className="button button--ghost"
            onClick={onCancelEdit}
            disabled={saving}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
