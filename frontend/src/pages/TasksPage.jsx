import { useEffect, useMemo, useState } from 'react';
import ActiveFilters from '../components/ActiveFilters.jsx';
import Alert from '../components/Alert.jsx';
import CategoryManager from '../components/CategoryManager.jsx';
import FilterDropdown from '../components/FilterDropdown.jsx';
import TaskDetail from '../components/TaskDetail.jsx';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/tasks.js';
import { useCategories } from '../hooks/useCategories.js';
import { useTasks } from '../hooks/useTasks.js';

/** Página principal: formulario, filtros dinámicos y listado de tareas raíz. */
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

  const {
    categories,
    loading: categoriesLoading,
    saving: categorySaving,
    error: categoriesError,
    createCategory,
    updateCategory,
    removeCategory,
    clearError: clearCategoriesError,
  } = useCategories();

  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const childTasks = useMemo(
    () =>
      selectedTask
        ? tasks.filter((task) => task.parentTaskId === selectedTask.id)
        : [],
    [tasks, selectedTask],
  );

  // En la pantalla principal solo aparecen las tareas sin padre.
  const rootTasks = useMemo(
    () => tasks.filter((task) => task.parentTaskId === null),
    [tasks],
  );

  // Si la tarea abierta se elimina, volvemos a la pantalla principal.
  useEffect(() => {
    if (selectedTaskId !== null && !loading && !selectedTask) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, selectedTask, loading]);

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
    return rootTasks.reduce(
      (acc, task) => {
        acc.all += 1;
        acc[task.status] = (acc[task.status] ?? 0) + 1;
        return acc;
      },
      { all: 0, pending: 0, in_progress: 0, done: 0 },
    );
  }, [rootTasks]);

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rootTasks.filter((task) => {
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
  }, [rootTasks, search, selected]);

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

  /** Mantiene sincronizados los chips activos cuando se renombra una categoría. */
  async function handleUpdateCategory(id, changes) {
    const updated = await updateCategory(id, changes);

    if (updated) {
      setActiveFilters((current) =>
        current.map((filter) =>
          filter.type === 'category' && filter.value === id
            ? { ...filter, label: updated.name, color: updated.color }
            : filter,
        ),
      );
    }

    return updated;
  }

  /** Al eliminar una categoría, retira también su chip de filtro activo. */
  async function handleDeleteCategory(id) {
    const deleted = await removeCategory(id);

    if (deleted) {
      setActiveFilters((current) =>
        current.filter((filter) => !(filter.type === 'category' && filter.value === id)),
      );
    }

    return deleted;
  }

  /** Elimina una tarea y, si era la abierta, vuelve a la pantalla principal. */
  async function handleDeleteTask(id) {
    const deleted = await removeTask(id);

    if (deleted && id === selectedTaskId) {
      setSelectedTaskId(null);
    }

    return deleted;
  }

  if (selectedTask) {
    const parentTask = selectedTask.parentTaskId
      ? tasks.find((task) => task.id === selectedTask.parentTaskId)
      : null;

    return (
      <div className="task-detail-page">
        <div className="task-detail-page__topbar">
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              setSelectedTaskId(parentTask ? parentTask.id : null)
            }
          >
            {parentTask ? '← Volver al padre' : '← Volver a las tareas'}
          </button>
          <span className="muted">Detalle de la tarea</span>
        </div>

        <Alert type="error" message={error} onRetry={refresh} onClose={clearError} />

        <TaskDetail
          key={selectedTask.id}
          task={selectedTask}
          categories={categories}
          categoriesLoading={categoriesLoading}
          saving={saving}
          onUpdate={updateTask}
          onDelete={handleDeleteTask}
        />

        <TaskForm
          key={`subtask-${selectedTask.id}`}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onCreate={createTask}
          saving={saving}
          parentTaskId={selectedTask.id}
          heading={`Nueva subtarea de «${selectedTask.title}»`}
          submitLabel="Añadir subtarea"
        />

        <section className="card">
          <h2 className="card__title">Subtareas ({childTasks.length})</h2>
          <TaskList
            tasks={childTasks}
            loading={loading}
            busy={saving}
            onChange={updateTask}
            onDelete={handleDeleteTask}
            onOpen={setSelectedTaskId}
            emptyTitle="Esta tarea no tiene subtareas."
            emptyHint="Añade una con el formulario de arriba."
          />
        </section>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <section className="tasks-page__sidebar">
        <TaskForm
          categories={categories}
          categoriesLoading={categoriesLoading}
          onCreate={createTask}
          saving={saving}
        />

        <CategoryManager
          categories={categories}
          saving={categorySaving}
          error={categoriesError}
          onCreate={createCategory}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
          onClearError={clearCategoriesError}
        />

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

        <Alert type="error" message={error} onRetry={refresh} onClose={clearError} />

        <TaskList
          tasks={visibleTasks}
          loading={loading}
          busy={saving}
          onChange={updateTask}
          onDelete={handleDeleteTask}
          onOpen={setSelectedTaskId}
        />

        {!loading && visibleTasks.length > 0 && (
          <p className="muted tasks-page__count">
            Mostrando {visibleTasks.length} de {rootTasks.length} tareas principales.
          </p>
        )}
      </section>
    </div>
  );
}
