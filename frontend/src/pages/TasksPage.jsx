import { useMemo, useState } from 'react';
import Alert from '../components/Alert.jsx';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import { TASK_STATUSES } from '../constants/tasks.js';
import { useTasks } from '../hooks/useTasks.js';

/** Página principal: formulario, filtros y listado de tareas. */
export default function TasksPage() {
  const {
    tasks,
    loading,
    saving,
    error,
    createTask,
    updateTask,
    removeTask,
    refresh,
    clearError,
  } = useTasks();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const counts = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc.all += 1;
        acc[task.status] = (acc[task.status] ?? 0) + 1;
        return acc;
      },
      { all: 0, pending: 0, in_progress: 0, done: 0 },
    );
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesSearch =
        !term ||
        task.title.toLowerCase().includes(term) ||
        (task.description ?? '').toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, search, statusFilter]);

  return (
    <div className="tasks-page">
      <section className="tasks-page__sidebar">
        <TaskForm onCreate={createTask} saving={saving} />

        <div className="card stats">
          <h2 className="card__title">Resumen</h2>
          <ul className="stats__list">
            <li>
              <span>Total</span>
              <strong>{counts.all}</strong>
            </li>
            {TASK_STATUSES.map(({ value, label }) => (
              <li key={value}>
                <span>{label}</span>
                <strong>{counts[value] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tasks-page__content">
        <div className="toolbar">
          <div className="field field--inline">
            <label className="visually-hidden" htmlFor="search">
              Buscar tareas
            </label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título o descripción…"
            />
          </div>

          <div className="filters" role="group" aria-label="Filtrar por estado">
            <button
              type="button"
              className={`chip ${statusFilter === 'all' ? 'chip--active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Todas ({counts.all})
            </button>
            {TASK_STATUSES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`chip ${statusFilter === value ? 'chip--active' : ''}`}
                onClick={() => setStatusFilter(value)}
              >
                {label} ({counts[value] ?? 0})
              </button>
            ))}
          </div>
        </div>

        <Alert type="error" message={error} onRetry={refresh} onClose={clearError} />

        <TaskList
          tasks={visibleTasks}
          loading={loading}
          busy={saving}
          onChange={updateTask}
          onDelete={removeTask}
        />

        {!loading && visibleTasks.length > 0 && (
          <p className="muted tasks-page__count">
            Mostrando {visibleTasks.length} de {tasks.length} tareas.
          </p>
        )}
      </section>
    </div>
  );
}
