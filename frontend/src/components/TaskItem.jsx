import { STATUS_LABELS, TASK_STATUSES } from '../constants/tasks.js';

/**
 * Convierte YYYY-MM-DD en una fecha local (evita el desfase de un día
 * que produce `new Date('YYYY-MM-DD')`, interpretado como UTC).
 */
function parseDateOnly(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  if (!value) return null;
  return parseDateOnly(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Tarjeta de una tarea: estado rápido, cambio de estado y borrado. */
export default function TaskItem({ task, onChange, onDelete, busy }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue =
    Boolean(task.dueDate) && task.status !== 'done' && parseDateOnly(task.dueDate) < today;

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
        </div>

        {task.description && <p className="task__description">{task.description}</p>}

        {task.dueDate && (
          <p className={`task__due ${isOverdue ? 'task__due--overdue' : ''}`}>
            Fecha límite: {formatDate(task.dueDate)}
            {isOverdue ? ' (vencida)' : ''}
          </p>
        )}
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
