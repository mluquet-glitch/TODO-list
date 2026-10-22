import { useEffect, useState } from 'react';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/tasks.js';

const INITIAL_FORM = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
  categoryIds: [],
};

/** Conserva las categorías iniciales al limpiar el formulario tras crear. */
function initialForm(initialCategoryIds) {
  return { ...INITIAL_FORM, categoryIds: [...initialCategoryIds] };
}

/**
 * Formulario de alta de tareas, con selección múltiple de categorías.
 * `onCreate` devuelve true/false para saber si limpiar el formulario.
 * Con `parentTaskId` la tarea creada queda enlazada como subtarea.
 */
export default function TaskForm({
  categories = [],
  categoriesLoading = false,
  onCreate,
  saving,
  parentTaskId = null,
  initialCategoryIds = [],
  heading = 'Nueva tarea',
  submitLabel = 'Añadir tarea',
}) {
  const [form, setForm] = useState(() => initialForm(initialCategoryIds));
  const [localError, setLocalError] = useState('');

  // Si una categoría se elimina mientras el formulario la tenía marcada,
  // quitamos su id para no enviar una referencia inexistente.
  useEffect(() => {
    if (categoriesLoading) return;

    setForm((current) => {
      const validIds = current.categoryIds.filter((id) =>
        categories.some((category) => category.id === id),
      );

      if (validIds.length === current.categoryIds.length) return current;
      return { ...current, categoryIds: validIds };
    });
  }, [categories, categoriesLoading]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (localError) setLocalError('');
  }

  function toggleCategory(categoryId) {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setLocalError('El título es obligatorio.');
      return;
    }

    const created = await onCreate({
      title,
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      categoryIds: form.categoryIds,
      ...(parentTaskId ? { parentTaskId } : {}),
    });

    if (created) setForm(initialForm(initialCategoryIds));
  }

  return (
    <form className="card task-form" onSubmit={handleSubmit} noValidate>
      <h2 className="card__title">{heading}</h2>

      <div className="field">
        <label htmlFor="task-title">Título</label>
        <input
          id="task-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          maxLength={255}
          placeholder="¿Qué hay que hacer?"
          autoComplete="off"
          aria-invalid={Boolean(localError)}
        />
        {localError && <span className="field__error">{localError}</span>}
      </div>

      <div className="field">
        <label htmlFor="task-description">Descripción</label>
        <textarea
          id="task-description"
          name="description"
          rows={2}
          value={form.description}
          onChange={handleChange}
          maxLength={2000}
          placeholder="Detalles opcionales"
        />
      </div>

      <div className="field">
        <label htmlFor="task-due-date">Fecha límite (opcional)</label>
        <input
          id="task-due-date"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="task-status">Estado</label>
          <select
            id="task-status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            {TASK_STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-priority">Prioridad</label>
          <select
            id="task-priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            {TASK_PRIORITIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <span className="field__label">Categorías</span>
        {categories.length === 0 ? (
          <p className="muted">No hay categorías disponibles.</p>
        ) : (
          <div className="checkbox-group">
            {categories.map((category) => {
              const checked = form.categoryIds.includes(category.id);

              return (
                <label
                  key={category.id}
                  className={`checkbox-chip ${checked ? 'checkbox-chip--active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(category.id)}
                  />
                  <span
                    className="checkbox-chip__dot"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  {category.name}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <button type="submit" className="button button--primary" disabled={saving}>
        {saving ? 'Guardando…' : submitLabel}
      </button>
    </form>
  );
}
