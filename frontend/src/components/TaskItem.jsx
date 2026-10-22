import { useState } from 'react';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from '../constants/tasks.js';
import { formatDateOnly, isTaskOverdue } from '../utils/dates.js';

/**
 * Tarjeta de una tarea: título clicable, vista previa de la descripción,
 * badges, cambio de estado, borrado y desplegable de subtareas.
 */
export default function TaskItem({
  task,
  subtasks = [],
  onChange,
  onDelete,
  onOpen,
  busy,
}) {
  const [expanded, setExpanded] = useState(false);
  const subtasksId = `subtasks-${task.id}`;

  async function handleDelete() {
    if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
      await onDelete(task.id);
    }
  }

  return (
    <li className={`task task--${task.status}`}>
      <div className="task__body">
        <div className="task__heading">
          <h3 className="task__title">
            <button
              type="button"
              className="task__title-button"
              onClick={() => onOpen?.(task.id)}
              title="Abrir detalle de la tarea"
            >
              {task.title}
            </button>
          </h3>

          <span className={`badge badge--${task.status}`}>
            {STATUS_LABELS[task.status] ?? task.status}
          </span>

          <span className={`badge badge--priority-${task.priority}`}>
            Prioridad {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>

          {task.parentTaskId && (
            <span className="badge badge--subtask">Subtarea de #{task.parentTaskId}</span>
          )}
        </div>

        {task.description && (
          <p className="task__description" title={task.description}>
            {task.description}
          </p>
        )}

        {task.dueDate && (
          <p className={`task__due ${isTaskOverdue(task) ? 'task__due--overdue' : ''}`}>
            {isTaskOverdue(task) ? 'Venció el ' : 'Fecha límite: '}
            <time dateTime={task.dueDate}>{formatDateOnly(task.dueDate)}</time>
          </p>
        )}

        {task.categories?.length > 0 && (
          <div className="task__categories">
            {task.categories.map((category) => (
              <span
                key={category.id}
                className="badge badge--category"
                style={{ color: category.color, borderColor: category.color }}
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          className={`task__subtasks-toggle ${
            expanded ? 'task__subtasks-toggle--open' : ''
          }`}
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={subtasksId}
        >
          <span className="task__subtasks-chevron" aria-hidden="true">
            {expanded ? '▾' : '▸'}
          </span>
          {expanded ? 'Ocultar subtareas' : `Ver subtareas (${subtasks.length})`}
        </button>
      </div>

      <div className="task__actions">
        <label className="visually-hidden" htmlFor={`status-${task.id}`}>
          Cambiar estado de {task.title}
        </label>
        <select
          id={`status-${task.id}`}
          className="task__select"
          value={task.status}
          disabled={busy}
          onChange={(event) => onChange(task.id, { status: event.target.value })}
        >
          {TASK_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="button button--danger"
          onClick={handleDelete}
          disabled={busy}
        >
          Eliminar
        </button>
      </div>

      {expanded && (
        <div className="task__subtasks" id={subtasksId}>
          {subtasks.length === 0 ? (
            <p className="task__subtasks-empty">Esta tarea no tiene subtareas.</p>
          ) : (
            <ul className="task__subtasks-list">
              {subtasks.map((subtask) => (
                <li key={subtask.id} className="task__subtask-row">
                  <button
                    type="button"
                    className="task__subtask"
                    onClick={() => onOpen?.(subtask.id)}
                    title="Abrir detalle de la subtarea"
                  >
                    <span className="task__subtask-title">{subtask.title}</span>
                    {subtask.description && (
                      <span className="task__subtask-description">
                        {subtask.description}
                      </span>
                    )}
                  </button>

                  <label
                    className="visually-hidden"
                    htmlFor={`subtask-status-${subtask.id}`}
                  >
                    Cambiar estado de {subtask.title}
                  </label>
                  <select
                    id={`subtask-status-${subtask.id}`}
                    className="task__select task__subtask-select"
                    value={subtask.status}
                    disabled={busy}
                    onChange={(event) =>
                      onChange(subtask.id, { status: event.target.value })
                    }
                  >
                    {TASK_STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
