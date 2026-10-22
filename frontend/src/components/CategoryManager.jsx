import { useEffect, useId, useState } from 'react';
import Alert from './Alert.jsx';

/**
 * Gestión del catálogo de categorías.
 * El toggle selecciona la categoría sobre la que actúan Eliminar y Actualizar;
 * el input es el nombre que usan Agregar y Actualizar.
 */
export default function CategoryManager({
  categories,
  saving,
  error,
  onCreate,
  onUpdate,
  onDelete,
  onClearError,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  const selected = categories.find((category) => category.id === selectedId) ?? null;

  // Si la categoría seleccionada desaparece (por ejemplo, la borró otro usuario),
  // limpiamos la selección y el input.
  useEffect(() => {
    if (selectedId !== null && !categories.some((category) => category.id === selectedId)) {
      setSelectedId(null);
      setName('');
    }
  }, [categories, selectedId]);

  function clearMessages() {
    setLocalError('');
    onClearError?.();
  }

  function selectCategory(category) {
    clearMessages();

    if (selectedId === category.id) {
      setSelectedId(null);
      setName('');
      return;
    }

    setSelectedId(category.id);
    setName(category.name);
  }

  async function handleAdd(event) {
    event.preventDefault();
    const value = name.trim();

    if (!value) {
      setLocalError('Escribe un nombre para agregar la categoría.');
      return;
    }

    clearMessages();
    const created = await onCreate({ name: value });

    if (created) {
      setName('');
      setSelectedId(null);
    }
  }

  async function handleUpdate() {
    if (!selected) {
      setLocalError('Selecciona una categoría del toggle para actualizarla.');
      return;
    }

    const value = name.trim();
    if (!value) {
      setLocalError('Escribe el nuevo nombre de la categoría.');
      return;
    }

    clearMessages();
    const updated = await onUpdate(selected.id, { name: value });
    if (updated) setName(updated.name);
  }

  async function handleDelete() {
    if (!selected) {
      setLocalError('Selecciona una categoría del toggle para eliminarla.');
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la categoría "${selected.name}"? También se quitará de las tareas que la usen.`,
    );
    if (!confirmed) return;

    clearMessages();
    const deleted = await onDelete(selected.id);

    if (deleted) {
      setSelectedId(null);
      setName('');
    }
  }

  return (
    <section
      className={`card category-manager${
        open ? '' : ' collapsible-card--closed'
      }`}
    >
      <div className="collapsible-card__header">
        <h2 className="card__title collapsible-card__title">
          <button
            type="button"
            className="collapsible-card__toggle"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((current) => !current)}
          >
            <span className="collapsible-card__chevron" aria-hidden="true">
              {open ? '▾' : '▸'}
            </span>
            Gestionar categorías
          </button>
        </h2>
      </div>

      {open && (
        <div id={bodyId} className="category-manager__body">
          <div className="field">
            <span className="field__label">Categoría</span>

            {categories.length === 0 ? (
              <p className="muted">Todavía no hay categorías. Crea la primera con el formulario.</p>
            ) : (
              <div
                className="category-toggle"
                role="group"
                aria-label="Seleccionar categoría para actualizar o eliminar"
              >
                {categories.map((category) => {
                  const active = category.id === selectedId;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`category-toggle__option ${active ? 'category-toggle__option--active' : ''}`}
                      aria-pressed={active}
                      onClick={() => selectCategory(category)}
                    >
                      <span
                        className="category-toggle__dot"
                        style={{ backgroundColor: category.color }}
                        aria-hidden="true"
                      />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="muted category-manager__hint">
              Elige una categoría para actualizarla o eliminarla.
            </p>
          </div>

          <form className="category-manager__form" onSubmit={handleAdd} noValidate>
            <div className="field">
              <label htmlFor="category-name">Nombre</label>
              <div className="category-manager__row">
                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (localError) setLocalError('');
                  }}
                  maxLength={80}
                  placeholder="Ej. Hogar"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={saving || name.trim() === ''}
                >
                  {saving ? 'Guardando…' : 'Agregar categoría'}
                </button>
              </div>
            </div>

            <div className="category-manager__actions">
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
                disabled={saving || !selected || name.trim() === ''}
              >
                Actualizar
              </button>
            </div>

            <Alert type="error" message={localError || error} onClose={clearMessages} />
          </form>
        </div>
      )}
    </section>
  );
}
