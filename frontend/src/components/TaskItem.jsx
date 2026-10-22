import { PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from '../constants/tasks.js';

/** Tarjeta de una tarea: badges, cambio de estado y borrado. */
export default function TaskItem({ task, onChange, onDelete, busy }) {
  async function handleDelete() {
    if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
      await onDelete(task.id);
    }
  }

  return (
    <li className={`task task--${task.status}`}>
      <div className="task__body">
        <div className="task__heading">
          <h3 className="task__title">{task.title}</h3>

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

        {task.description && <p className="task__description">{task.description}</p>}
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
    </li>
  );
}
