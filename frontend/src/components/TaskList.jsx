import { useMemo } from 'react';
import TaskItem from './TaskItem.jsx';

/** Listado de tareas con estados vacío y de carga. */
export default function TaskList({
  tasks,
  allTasks = [],
  loading,
  busy,
  onChange,
  onDelete,
  onOpen,
  emptyTitle = 'No hay tareas que coincidan con el filtro.',
  emptyHint = 'Crea una nueva tarea con el formulario de la izquierda.',
}) {
  const childrenByParent = useMemo(() => {
    const map = new Map();

    for (const task of allTasks) {
      if (task.parentTaskId === null) continue;

      const children = map.get(task.parentTaskId) ?? [];
      children.push(task);
      map.set(task.parentTaskId, children);
    }

    return map;
  }, [allTasks]);

  if (loading) {
    return <p className="muted">Cargando tareas…</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>{emptyTitle}</p>
        <p className="muted">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          subtasks={childrenByParent.get(task.id) ?? []}
          onChange={onChange}
          onDelete={onDelete}
          onOpen={onOpen}
          busy={busy}
        />
      ))}
    </ul>
  );
}
