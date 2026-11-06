import { useEffect, useId, useState } from 'react';
import Alert from './Alert.jsx';

/**
 * Gestión del catálogo de emociones.
 * El botón seleccionado es el que actualizan o eliminan los botones inferiores.
 */
export default function EmotionManager({
  emociones = [],
  loading = false,
  saving = false,
  error,
  onCreate,
  onUpdate,
  onDelete,
  onClearError,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [localError, setLocalError] = useState('');
  const inputId = useId();

  const selected =
    emociones.find((emocion) => emocion.id === selectedId) ?? null;

  // Si la emoción seleccionada desaparece, limpiamos la selección.
  useEffect(() => {
    if (
      selectedId !== null &&
      !emociones.some((emocion) => emocion.id === selectedId)
    ) {
      setSelectedId(null);
      setNombre('');
    }
  }, [emociones, selectedId]);

  function clearMessages() {
    setLocalError('');
    onClearError?.();
  }

  function selectEmocion(emocion) {
    clearMessages();

    if (selectedId === emocion.id) {
      setSelectedId(null);
      setNombre('');
      return;
    }

    setSelectedId(emocion.id);
    setNombre(emocion.nombre);
  }

  async function handleAdd(event) {
    event.preventDefault();
    const value = nombre.trim();

    if (!value) {
      setLocalError('Escribe un nombre para agregar la emoción.');
      return;
    }

    clearMessages();
    const created = await onCreate({ nombre: value });

    if (created) {
      setNombre('');
      setSelectedId(null);
    }
  }

  async function handleUpdate() {
    if (!selected) {
      setLocalError('Selecciona una emoción para actualizarla.');
      return;
    }

    const value = nombre.trim();
    if (!value) {
      setLocalError('Escribe el nuevo nombre de la emoción.');
      return;
    }

    clearMessages();
    const updated = await onUpdate(selected.id, { nombre: value });
    if (updated) setNombre(updated.nombre);
  }

  async function handleDelete() {
    if (!selected) {
      setLocalError('Selecciona una emoción para eliminarla.');
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la emoción "${selected.nombre}"? También se quitará de los protocolos que la usan.`,
    );
    if (!confirmed) return;

    clearMessages();
    const deleted = await onDelete(selected.id);

    if (deleted) {
      setSelectedId(null);
      setNombre('');
    }
  }

  return (
    <section className="card emotion-manager">
      <h2 className="card__title">Emociones</h2>

      <div className="field">
        <span className="field__label">Selecciona una para editar o eliminar</span>

        {loading ? (
          <p className="muted">Cargando emociones…</p>
        ) : emociones.length === 0 ? (
          <p className="muted">
            Todavía no hay emociones. Crea la primera con el formulario.
          </p>
        ) : (
          <div
            className="emotion-manager__list"
            role="group"
            aria-label="Emociones disponibles"
          >
            {emociones.map((emocion) => {
              const active = emocion.id === selectedId;

              return (
                <button
                  key={emocion.id}
                  type="button"
                  className={`emotion-manager__option${
                    active ? ' emotion-manager__option--active' : ''
                  }`}
                  aria-pressed={active}
                  onClick={() => selectEmocion(emocion)}
                >
                  {emocion.nombre}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <form className="emotion-manager__form" onSubmit={handleAdd} noValidate>
        <div className="field">
          <label htmlFor={inputId}>Nombre</label>
          <div className="emotion-manager__row">
            <input
              id={inputId}
              type="text"
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);
                if (localError) setLocalError('');
              }}
              maxLength={255}
              placeholder="Ej. Alegría"
              autoComplete="off"
            />
            <button
              type="submit"
              className="button button--primary"
              disabled={saving || nombre.trim() === ''}
            >
              {saving ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </div>

        <div className="emotion-manager__actions">
          <button
            type="button"
            className="button"
            onClick={handleDelete}
            disabled={saving || !selected}
          >
            Eliminar
          </button>
          <button
            type="button"
            className="button"
            onClick={handleUpdate}
            disabled={saving || !selected || nombre.trim() === ''}
          >
            Actualizar
          </button>
        </div>

        <Alert type="error" message={localError || error} onClose={clearMessages} />
      </form>
    </section>
  );
}
