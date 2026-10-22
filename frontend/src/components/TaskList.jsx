import TaskItem from './TaskItem.jsx';

/** Listado de tareas con estados vacío y de carga. */
export default function TaskList({ tasks, loading, busy, onChange, onDelete }) {
  if (loading) {
    return <p className="muted">Cargando tareas…</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay tareas que coincidan con el filtro.</p>
        <p className="muted">Crea una nueva tarea con el formulario de la izquierda.</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onChange={onChange}
          onDelete={onDelete}
          busy={busy}
        />
      ))}
    </ul>
  );
}
