import { useState } from 'react';
import { TASK_STATUSES } from '../constants/tasks.js';

const INITIAL_FORM = {
  title: '',
  description: '',
  status: 'pending',
  dueDate: '',
};

/**
 * Formulario de alta de tareas.
 * `onCreate` devuelve true/false para saber si limpiar el formulario.
 */
export default function TaskForm({ onCreate, saving }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [localError, setLocalError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (localError) setLocalError('');
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
      dueDate: form.dueDate || null,
    });

    if (created) setForm(INITIAL_FORM);
  }

  return (
    <form className="card task-form" onSubmit={handleSubmit} noValidate>
      <h2 className="card__title">Nueva tarea</h2>

      <div className="field">
        <label htmlFor="task-title">Título</label>
        <input
          id="task-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          maxLength={120}
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
          maxLength={1000}
          placeholder="Detalles opcionales"
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
          <label htmlFor="task-dueDate">Fecha límite</label>
          <input
            id="task-dueDate"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <button type="submit" className="button button--primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Añadir tarea'}
      </button>
    </form>
  );
}
