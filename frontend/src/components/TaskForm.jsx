import { useEffect, useId, useState } from 'react';
import { TASK_PRIORITIES } from '../constants/tasks.js';
import CategorySelection from './CategorySelection.jsx';
import StatusCheckbox from './StatusCheckbox.jsx';

const INITIAL_FORM = {
  title: '',
  description: '',
  calificacion: '',
  ponderacion: '',
  presentado: false,
  status: 'pending',
  priority: 'medium',
  dueDate: '',
  categoryIds: [],
  parentTaskId: '',
};

/** Conserva las categorías iniciales y la tarea padre al limpiar el formulario. */
function initialForm(initialCategoryIds, parentTaskId) {
  return {
    ...INITIAL_FORM,
    categoryIds: [...initialCategoryIds],
    parentTaskId: parentTaskId ? String(parentTaskId) : '',
  };
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
  defaultOpen = false,
  tasks = [],
}) {
  const [form, setForm] = useState(() =>
    initialForm(initialCategoryIds, parentTaskId),
  );
  const [localError, setLocalError] = useState('');
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

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

    const selectedParentId = form.parentTaskId
      ? Number(form.parentTaskId)
      : parentTaskId ?? null;

    const created = await onCreate({
      title,
      description: form.description.trim() || null,
      calificacion: form.calificacion.trim() || null,
      ponderacion: form.ponderacion.trim() || null,
      presentado: form.presentado,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      categoryIds: form.categoryIds,
      ...(selectedParentId ? { parentTaskId: selectedParentId } : {}),
    });

    if (created) setForm(initialForm(initialCategoryIds, parentTaskId));
  }

    return (
      <form
        className={`card task-form${
          open ? '' : ' collapsible-card--closed'
        }`}
        onSubmit={handleSubmit}
        noValidate
        style={{ position: 'relative' }}
      >
        <button
          type="button"
          className="collapsible-card__toggle-button"
          onClick={() => setOpen((current) => !current)}
          aria-label={`${heading} ${open ? 'cerrar' : 'abrir'}`}
        />

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
              {heading}
            </button>
          </h2>
        </div>

      {open && (
        <div style={{ position: 'relative', zIndex: 20 }}>
          <div id={bodyId} className="task-form__body"
            onClick={(event) => {
              if (event.currentTarget === event.target) setOpen(false);
            }}
          >
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
            <label htmlFor="task-calificacion">Calificacion</label>
            <textarea
              id="task-calificacion"
              name="calificacion"
              rows={2}
              value={form.calificacion}
              onChange={handleChange}
              maxLength={4000}
              placeholder="Calificacion opcional"
            />
          </div>

          <div className="field">
            <label htmlFor="task-ponderacion">Ponderacion</label>
            <input
              id="task-ponderacion"
              name="ponderacion"
              type="number"
              min="0"
              value={form.ponderacion}
              onChange={handleChange}
              placeholder="Ponderacion"
            />
          </div>

          <div className="field">
            <label htmlFor="task-presentado">Presentado</label>
            <input
              id="task-presentado"
              name="presentado"
              type="checkbox"
              checked={form.presentado === true || form.presentado === 'true'}
              onChange={(event) => {
                setForm((current) => ({ ...current, presentado: event.target.checked }));
                if (localError) setLocalError('');
              }}
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

          {tasks.length > 0 && (
            <div className="field">
              <label htmlFor="task-parent-task">
                Tarea padre{parentTaskId ? '' : ' (opcional)'}
              </label>
              <select
                id="task-parent-task"
                name="parentTaskId"
                value={form.parentTaskId ?? ''}
                onChange={handleChange}
              >
                {!parentTaskId && (
                  <option value="">Ninguna (tarea principal)</option>
                )}
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    #{task.id} · {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="field">
              <span className="field__label">Estado</span>
              <StatusCheckbox
                id="task-status"
                status={form.status}
                disabled={saving}
                onChange={(status) => {
                  setForm((current) => ({ ...current, status }));
                  if (localError) setLocalError('');
                }}
              />
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
              <CategorySelection
                categories={categories}
                value={form.categoryIds}
                onChange={(ids) =>
                  setForm((current) => ({ ...current, categoryIds: ids }))
                }
              />
            )}
          </div>

          <button
            type="submit"
            className="button button--primary"
            disabled={saving}
          >
            {saving ? 'Guardando…' : submitLabel}
          </button>
        </div>
      </div>
      )}
    </form>
  );
}
