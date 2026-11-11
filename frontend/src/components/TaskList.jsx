import { useEffect, useMemo, useState } from 'react';
import TaskItem from './TaskItem.jsx';

const COLUMNS = 5;
const ROWS = 2;
const PAGE_SIZE = COLUMNS * ROWS;

/** Listado de tareas en tarjetas dispuestas en cuadrícula paginada (2×5). */
export default function TaskList({
  tasks,
  allTasks = [],
  loading,
  busy,
  onChange,
  onDelete,
  onOpen,
  onOpenFloating,
  emptyTitle = 'No hay tareas que coincidan con el filtro.',
  emptyHint = 'Crea una nueva tarea con el formulario de la izquierda.',
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));

  // Si cambia el número de tareas (por filtros, borrado, etc.) evitamos
  // quedarnos en una página que ya no existe.
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

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

  const currentPageTasks = tasks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, tasks.length);

  return (
    <section className="task-grid-section">
      <ul className="task-list">
        {currentPageTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            childrenByParent={childrenByParent}
            onChange={onChange}
            onDelete={onDelete}
            onOpen={onOpen}
            onOpenFloating={onOpenFloating}
            busy={busy}
          />
        ))}
      </ul>

      <nav className="task-pagination">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
        >
          ← Anterior
        </button>
        <span className="task-pagination__page">
          Página {page + 1} de {totalPages}
        </span>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={page === totalPages - 1}
        >
          Siguiente →
        </button>
        <span className="task-pagination__count">
          Mostrando {start} a {end} de {tasks.length} tareas
        </span>
      </nav>
    </section>
  );
}
