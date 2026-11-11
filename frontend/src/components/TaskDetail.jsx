import { useEffect, useId, useState } from 'react';
import { TASK_PRIORITIES } from '../constants/tasks.js';
import CategorySelection from './CategorySelection.jsx';
import StatusCheckbox from './StatusCheckbox.jsx';

function toForm(task) {
  return {
    title: task.title,
    description: task.description ?? '',
    calificacion: task.calificacion ?? '',
    ponderacion: task.ponderacion ?? '',
    presentado: task.presentado === true || task.presentado === 'true',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? '',
    categoryIds: (task.categories ?? []).map((category) => category.id),
    parentTaskId:
      task.parentTaskId != null ? String(task.parentTaskId) : '',
  };
}

/**
 * Tarjeta de edición de la tarea seleccionada. Permite cambiar sus datos,
 * reemplazar sus categorías y eliminarla.
 */
export default function TaskDetail({
  task,
  categories = [],
  categoriesLoading = false,
  saving,
  onUpdate,
  onDelete,
  tasks = [],
  defaultOpen = false,
}) {
  const [form, setForm] = useState(() => toForm(task));
  const [localError, setLocalError] = useState('');
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  // Al navegar a otra tarea reiniciamos el formulario.
  useEffect(() => {
    setForm(toForm(task));
    setLocalError('');
    setSaved(false);
    // Solo depende del id: guardar la tarea no debe borrar el aviso de guardado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  // Si una categoría se elimina mientras estaba marcada, quitamos su id.
  // No lo hacemos mientras el catálogo aún se está cargando para no borrar
  // las categorías que la tarea ya tenía.
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
    setSaved(false);
    if (localError) setLocalError('');
  }

  function toggleCategory(categoryId) {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
    setSaved(false);
  }
  async function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setLocalError('El título es obligatorio.');
      return;
    }

    const updated = await onUpdate(task.id, {
      title,
      description: form.description.trim() || null,
      calificacion: form.calificacion.trim() || null,
      ponderacion: form.ponderacion.trim() || null,
      presentado: form.presentado,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      categoryIds: form.categoryIds,
      ...(form.parentTaskId ? { parentTaskId: Number(form.parentTaskId) } : { parentTaskId: null }),
    });

    if (updated) {
      setSaved(true);
      setLocalError('');
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar la tarea "${task.title}" y sus subtareas?`)) return;
    await onDelete(task.id);
  }

  return (
    <form
      className={`card task-detail${
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
        aria-label={`Editar tarea ${open ? 'cerrar' : 'abrir'}`}
      />

      <div className="collapsible-card__header">
        <div>
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
              Editar tarea
            </button>
          </h2>
          <p className="muted task-detail__meta">
            Tarea #{task.id}
            {task.parentTaskId
              ? ` · Subtarea de #${task.parentTaskId}`
              : ' · Tarea principal'}
          </p>
        </div>
        <button
          type="button"
          className="button button--danger"
          onClick={handleDelete}
          disabled={saving}
        >
          Eliminar tarea
        </button>
      </div>

      {open && (
        <div style={{ position: 'relative', zIndex: 20 }}>
          <div id={bodyId} className="task-detail__body"
            onClick={(event) => {
              if (event.currentTarget === event.target) setOpen(false);
            }}
          >
          <div className="field">
            <label htmlFor="detail-title">Título</label>
            <input
              id="detail-title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              maxLength={255}
              autoComplete="off"
              aria-invalid={Boolean(localError)}
            />
            {localError && <span className="field__error">{localError}</span>}
          </div>

          <div className="field">
            <label htmlFor="detail-description">Descripción</label>
            <textarea
              id="detail-description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              maxLength={2000}
              placeholder="Detalles opcionales"
            />
          </div>

          <div className="field">
            <label htmlFor="detail-calificacion">Calificacion</label>
            <input
              id="detail-calificacion"
              name="calificacion"
              type="number"
              min="0"
              value={form.calificacion === null || form.calificacion === undefined ? '' : form.calificacion}
              onChange={handleChange}
              placeholder="Calificacion"
            />
          </div>

          <div className="field">
            <label htmlFor="detail-ponderacion">Ponderacion</label>
            <input
              id="detail-ponderacion"
              name="ponderacion"
              type="number"
              min="0"
              value={form.ponderacion}
              onChange={handleChange}
              placeholder="Ponderacion"
            />
          </div>

          <div className="field">
            <label htmlFor="detail-presentado">Presentado</label>
            <input
              id="detail-presentado"
              name="presentado"
              type="checkbox"
              checked={form.presentado === true || form.presentado === 'true'}
              onChange={(event) => {
                setForm((current) => ({ ...current, presentado: event.target.checked }));
                setSaved(false);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="detail-due-date">Fecha límite (opcional)</label>
            <input
              id="detail-due-date"
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
            />
          </div>

          {tasks.length > 0 && (
            <div className="field">
              <label htmlFor="detail-parent-task">Tarea padre</label>
              <select
                id="detail-parent-task"
                name="parentTaskId"
                value={form.parentTaskId ?? ''}
                onChange={handleChange}
              >
                <option value="">Ninguna (tarea principal)</option>
                {tasks.map((t) => {
                  if (t.id === task.id) return null;
                  return (
                    <option key={t.id} value={t.id}>
                      #{t.id} · {t.title}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="field">
              <span className="field__label">Estado</span>
              <StatusCheckbox
                id="detail-status"
                status={form.status}
                onChange={(status) => {
                  setForm((current) => ({ ...current, status }));
                  setSaved(false);
                }}
              />
            </div>

            <div className="field">
              <label htmlFor="detail-priority">Prioridad</label>
              <select
                id="detail-priority"
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

          <div className="task-detail__footer">
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {saved && (
              <span className="task-detail__saved" role="status">
                Cambios guardados.
              </span>
            )}
          </div>
        </div>
        </div>
      )}
    </form>
  );
}
