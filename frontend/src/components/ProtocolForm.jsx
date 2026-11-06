import { useEffect, useId, useState } from 'react';

/** Formulario de alta y edición de un protocolo. */
export default function ProtocolForm({
  editingProtocol = null,
  saving = false,
  onCreate,
  onUpdate,
  onCancelEdit,
}) {
  const [nombre, setNombre] = useState('');
  const [disparador, setDisparador] = useState('');
  const [localError, setLocalError] = useState('');
  const inputId = useId();
  const disparadorId = useId();

  useEffect(() => {
    setNombre(editingProtocol?.nombre ?? '');
    setDisparador(editingProtocol?.disparador ?? '');
    setLocalError('');
  }, [
    editingProtocol?.id,
    editingProtocol?.nombre,
    editingProtocol?.disparador,
  ]);

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
      });
      if (updated) onCancelEdit?.();
      return;
    }

    const created = await onCreate({ nombre: value, disparador: trigger });
    if (created) {
      setNombre('');
      setDisparador('');
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
