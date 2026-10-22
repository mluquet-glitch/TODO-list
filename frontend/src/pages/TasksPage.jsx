import { useMemo, useState } from 'react';
import ActiveFilters from '../components/ActiveFilters.jsx';
import Alert from '../components/Alert.jsx';
import FilterDropdown from '../components/FilterDropdown.jsx';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/tasks.js';
import { useCategories } from '../hooks/useCategories.js';
import { useTasks } from '../hooks/useTasks.js';

/** Página principal: formulario, filtros dinámicos y listado de tareas. */
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

  const { categories, error: categoriesError } = useCategories();

  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);

  // Opciones del desplegable: todos los valores filtrables de la base de datos.
  const filterGroups = useMemo(
    () => [
      {
        type: 'status',
        label: 'Estado',
        options: TASK_STATUSES.map(({ value, label }) => ({ value, label })),
      },
      {
        type: 'priority',
        label: 'Prioridad',
        options: TASK_PRIORITIES.map(({ value, label }) => ({ value, label })),
      },
      {
        type: 'category',
        label: 'Categoría',
        options: categories.map((category) => ({
          value: category.id,
          label: category.name,
          color: category.color,
        })),
      },
    ],
    [categories],
  );

  const activeKeys = useMemo(
    () => new Set(activeFilters.map((filter) => `${filter.type}:${filter.value}`)),
    [activeFilters],
  );

  const selected = useMemo(
    () =>
      activeFilters.reduce(
        (acc, filter) => {
          acc[filter.type].add(filter.value);
          return acc;
        },
        {
          status: new Set(),
          priority: new Set(),
          category: new Set(),
        },
      ),
    [activeFilters],
  );

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
      const matchesStatus =
        selected.status.size === 0 || selected.status.has(task.status);
      const matchesPriority =
        selected.priority.size === 0 || selected.priority.has(task.priority);
      const matchesCategory =
        selected.category.size === 0 ||
        (task.categories ?? []).some((category) =>
          selected.category.has(category.id),
        );
      const matchesSearch =
        !term ||
        task.title.toLowerCase().includes(term) ||
        (task.description ?? '').toLowerCase().includes(term);

      return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
    });
  }, [tasks, search, selected]);

  function addFilter(filter) {
    setActiveFilters((current) => {
      const exists = current.some(
        (item) => item.type === filter.type && item.value === filter.value,
      );
      return exists ? current : [...current, filter];
    });
  }

  function removeFilter(filter) {
    setActiveFilters((current) =>
      current.filter(
        (item) => !(item.type === filter.type && item.value === filter.value),
      ),
    );
  }

  return (
    <div className="tasks-page">
      <section className="tasks-page__sidebar">
        <TaskForm categories={categories} onCreate={createTask} saving={saving} />

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

          <FilterDropdown
            groups={filterGroups}
            activeKeys={activeKeys}
            onSelect={addFilter}
          />
        </div>

        <ActiveFilters
          filters={activeFilters}
          onRemove={removeFilter}
          onClear={() => setActiveFilters([])}
        />

        {categoriesError && (
          <p className="muted">No se pudieron cargar las categorías: {categoriesError}</p>
        )}

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
