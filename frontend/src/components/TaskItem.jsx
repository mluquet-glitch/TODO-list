import { useState } from 'react';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from '../constants/tasks.js';
import { formatDateOnly, isTaskOverdue } from '../utils/dates.js';

const EMPTY_CHILDREN = new Map();

/**
 * Tarjeta de una tarea: título clicable, vista previa de la descripción,
 * badges, cambio de estado, borrado y desplegable de subtareas.
 */
export default function TaskItem({
  task,
  childrenByParent = EMPTY_CHILDREN,
  onChange,
  onDelete,
  onOpen,
  busy,
}) {
  const [expanded, setExpanded] = useState(false);
  const subtasksId = `subtasks-${task.id}`;
  const subtasks = childrenByParent.get(task.id) ?? [];
  const totalSubtasks = countDescendants(task.id, childrenByParent);
  const pendingSubtasks = countPendingDescendants(task.id, childrenByParent);
  const pendingLeafSubtasks = countPendingLeafDescendants(
    task.id,
    childrenByParent,
  );

  async function handleDelete() {
    if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
      await onDelete(task.id);
    }
  }

    return (
      <li className={`task task--${task.status}`}>
        <div className="task__body">
          <div className="task__heading">
            <div className="task__title-row">
              <button
                type="button"
                className="task__title-wrap"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen?.(task.id);
                }}
              >
                {task.title}
              </button>

              <span
                className={`task__subtask-count ${pendingCountTone(
                  pendingSubtasks,
                )}`}
                title={`${pendingSubtasks} subtarea${
                  pendingSubtasks === 1 ? '' : 's'
                } por hacer`}
              >
                {pendingSubtasks}
              </span>

              <span
                className={`task__subtask-count ${pendingCountTone(
                  pendingLeafSubtasks,
                )}`}
                title={`${pendingLeafSubtasks} subtarea${
                  pendingLeafSubtasks === 1 ? '' : 's'
                } hoja por hacer`}
              >
                {pendingLeafSubtasks}
              </span>
            </div>

            <div className="task__meta">
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
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((current) => !current);
            }}
            aria-expanded={expanded}
            aria-controls={subtasksId}
          >
            <span className="task__subtasks-chevron" aria-hidden="true">
              {expanded ? '▾' : '▸'}
            </span>
            {expanded ? 'Ocultar subtareas' : `Ver subtareas (${totalSubtasks})`}
          </button>

          {expanded && (
            <div className="task__subtasks" id={subtasksId}>
              {subtasks.length === 0 ? (
                <p className="task__subtasks-empty">Esta tarea no tiene subtareas.</p>
              ) : (
                <SubtaskTree
                  parentId={task.id}
                  childrenByParent={childrenByParent}
                  onChange={onChange}
                  onOpen={onOpen}
                  busy={busy}
                />
              )}
            </div>
          )}
        </div>

        <div className="task__actions" style={{ position: 'relative', zIndex: 20 }}>
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

/** Cuenta todas las subtareas descendientes, en cualquier nivel. */
function countDescendants(taskId, childrenByParent) {
  const children = childrenByParent.get(taskId) ?? [];
  return children.reduce(
    (total, child) =>
      total + 1 + countDescendants(child.id, childrenByParent),
    0,
  );
}

/** Cuenta las subtareas pendientes en todos los niveles inferiores. */
function countPendingDescendants(taskId, childrenByParent) {
  const children = childrenByParent.get(taskId) ?? [];
  return children.reduce(
    (total, child) =>
      total +
      (child.status === 'pending' ? 1 : 0) +
      countPendingDescendants(child.id, childrenByParent),
    0,
  );
}

/** Cuenta solo las subtareas hoja pendientes en todos los niveles inferiores. */
function countPendingLeafDescendants(taskId, childrenByParent) {
  const children = childrenByParent.get(taskId) ?? [];
  return children.reduce((total, child) => {
    const isLeaf = (childrenByParent.get(child.id) ?? []).length === 0;
    const leafValue = isLeaf && child.status === 'pending' ? 1 : 0;

    return (
      total +
      leafValue +
      countPendingLeafDescendants(child.id, childrenByParent)
    );
  }, 0);
}

/** Tono del contador según la cantidad de subtareas por hacer. */
function pendingCountTone(count) {
  if (count === 0) return 'task__subtask-count--zero';
  if (count <= 2) return 'task__subtask-count--low';
  if (count <= 5) return 'task__subtask-count--medium';
  return 'task__subtask-count--high';
}

/**
 * Lista recursiva de subtareas: muestra título, descripción y selector de
 * estado en todos los niveles.
 */
function SubtaskTree({
  parentId,
  childrenByParent,
  onChange,
  onOpen,
  busy,
  depth = 0,
}) {
  const subtasks = childrenByParent.get(parentId) ?? [];

  if (subtasks.length === 0) return null;

  return (
    <ul
      className={`task__subtasks-list${
        depth > 0 ? ' task__subtasks-list--nested' : ''
      }`}
    >
      {subtasks.map((subtask) => (
        <li key={subtask.id}>
          <div className="task__subtask-row">
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
          </div>

          <SubtaskTree
            parentId={subtask.id}
            childrenByParent={childrenByParent}
            onChange={onChange}
            onOpen={onOpen}
            busy={busy}
            depth={depth + 1}
          />
        </li>
      ))}
    </ul>
  );
}
