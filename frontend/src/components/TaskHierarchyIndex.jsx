/**
 * Índice de la familia de la tarea abierta: muestra su tarea padre (o la propia
 * tarea si es raíz) y todas las hijas directas, resaltando la tarea actual.
 */
export default function TaskHierarchyIndex({ task, tasks, onSelect }) {
  const parent = task.parentTaskId
    ? tasks.find((candidate) => candidate.id === task.parentTaskId) ?? task
    : task;

  const children = tasks.filter((candidate) => candidate.parentTaskId === parent.id);

  return (
    <nav className="card hierarchy-index" aria-label="Índice de la jerarquía de tareas">
      <h2 className="card__title">Índice</h2>

      <div className="hierarchy-index__group">
        <span className="hierarchy-index__label">Tarea padre</span>
        <div className="hierarchy-index__items">
          <button
            type="button"
            className={`hierarchy-index__item ${
              parent.id === task.id ? 'hierarchy-index__item--current' : ''
            }`}
            onClick={() => onSelect(parent.id)}
            aria-current={parent.id === task.id ? 'page' : undefined}
          >
            {parent.title}
            {parent.id === task.id && (
              <span className="visually-hidden"> (tarea actual)</span>
            )}
          </button>
        </div>
      </div>

      <div className="hierarchy-index__group">
        <span className="hierarchy-index__label">
          Tareas hijas ({children.length})
        </span>

        {children.length === 0 ? (
          <p className="muted hierarchy-index__empty">Sin subtareas.</p>
        ) : (
          <div className="hierarchy-index__items">
            {children.map((child) => {
              const current = child.id === task.id;

              return (
                <button
                  key={child.id}
                  type="button"
                  className={`hierarchy-index__item ${
                    current ? 'hierarchy-index__item--current' : ''
                  }`}
                  onClick={() => onSelect(child.id)}
                  aria-current={current ? 'page' : undefined}
                >
                  {child.title}
                  {current && <span className="visually-hidden"> (tarea actual)</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
