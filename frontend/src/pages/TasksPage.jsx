import { useEffect, useId, useMemo, useState } from 'react';
import Alert from '../components/Alert.jsx';
import CategoryManager from '../components/CategoryManager.jsx';
import FilteredTaskList from '../components/FilteredTaskList.jsx';
import FloatingPanel from '../components/FloatingPanel.jsx';
import TaskDetail from '../components/TaskDetail.jsx';
import TaskForm from '../components/TaskForm.jsx';
import TaskHierarchyIndex from '../components/TaskHierarchyIndex.jsx';
import { TASK_STATUSES } from '../constants/tasks.js';
import { useCategories } from '../hooks/useCategories.js';
import { useTaskFilters } from '../hooks/useTaskFilters.js';
import { useTasks } from '../hooks/useTasks.js';

/** Página principal: botones del sidebar que abren paneles flotantes (35%) y listado de tareas. */
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

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summaryId = useId();
  const [formPanel, setFormPanel] = useState(null);
  const mainFilters = useTaskFilters(categories);
  const detailFilters = useTaskFilters(categories);

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

  // Si cambiamos de tarea, el listado de subtareas empieza sin filtros.
  useEffect(() => {
    detailFilters.reset();
  }, [selectedTaskId, detailFilters.reset]);

  // Si la tarea abierta se elimina, volvemos a la pantalla principal.
  useEffect(() => {
    if (selectedTaskId !== null && !loading && !selectedTask) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, selectedTask, loading]);

  const counts = useMemo(() => {
    return rootTasks.reduce(
      (acc, task) => {
        acc.all += 1;
        acc[task.status] = (acc[task.status] ?? 0) + 1;
        return acc;
      },
      { all: 0, pending: 0, done: 0 },
    );
  }, [rootTasks]);

  /** Mantiene los chips sincronizados cuando se renombra una categoría. */
  async function handleUpdateCategory(id, changes) {
    const updated = await updateCategory(id, changes);

    if (updated) {
      mainFilters.updateCategoryFilter(id, updated);
      detailFilters.updateCategoryFilter(id, updated);
    }

    return updated;
  }

  /** Al eliminar una categoría, retira sus filtros activos en ambas pantallas. */
  async function handleDeleteCategory(id) {
    const deleted = await removeCategory(id);

    if (deleted) {
      mainFilters.removeCategoryFilter(id);
      detailFilters.removeCategoryFilter(id);
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
        <TaskHierarchyIndex
          task={selectedTask}
          tasks={tasks}
          onSelect={setSelectedTaskId}
          onGoHome={() => setSelectedTaskId(null)}
        />

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

        <div className="task-detail-page__columns">
          <div className="task-detail-page__sidebar">
            <button
              type="button"
              className="button button--ghost sidebar__button"
              onClick={() => setFormPanel('task')}
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Nueva subtarea'}
            </button>

            <button
              type="button"
              className="button button--ghost sidebar__button"
              onClick={() => setFormPanel('category')}
            >
              Gestionar categorías
            </button>

            <button
              type="button"
              className="button button--ghost sidebar__button"
              onClick={() => setFormPanel('taskdetail')}
            >
              Ver propiedades
            </button>
          </div>

          <section className="card task-detail-page__content">
            <h2 className="card__title">Subtareas ({childTasks.length})</h2>
            <FilteredTaskList
              filters={detailFilters}
              tasks={childTasks}
              allTasks={tasks}
              loading={loading}
              busy={saving}
              onChange={updateTask}
              onDelete={handleDeleteTask}
              onOpen={setSelectedTaskId}
              emptyTitle="Esta tarea no tiene subtareas."
              emptyHint="Añade una con el formulario flotante."
              countLabel="subtareas"
            />
          </section>
        </div>

        {formPanel === 'task' && (
          <FloatingPanel
            open
            onClose={() => setFormPanel(null)}
            title={`Nueva subtarea de «${selectedTask.title}»`}
          >
            <TaskForm
              key={`subtask-${selectedTask.id}`}
              categories={categories}
              categoriesLoading={categoriesLoading}
              onCreate={createTask}
              saving={saving}
              parentTaskId={selectedTask.id}
              initialCategoryIds={(selectedTask.categories ?? []).map(
                (category) => category.id,
              )}
              heading={`Nueva subtarea de «${selectedTask.title}»`}
              submitLabel="Añadir subtarea"
              tasks={tasks}
              defaultOpen={true}
            />
          </FloatingPanel>
        )}

        {formPanel === 'category' && (
          <FloatingPanel
            open
            onClose={() => setFormPanel(null)}
            title="Gestionar categorías"
          >
            <CategoryManager
              categories={categories}
              saving={categorySaving}
              error={categoriesError}
              onCreate={createCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
              onClearError={clearCategoriesError}
              defaultOpen={true}
            />
          </FloatingPanel>
        )}

        {formPanel === 'taskdetail' && (
          <FloatingPanel
            open
            onClose={() => setFormPanel(null)}
            title={`Propiedades de «${selectedTask.title}»`}
          >
            <TaskDetail
              key={selectedTask.id}
              task={selectedTask}
              categories={categories}
              categoriesLoading={categoriesLoading}
              saving={saving}
              onUpdate={updateTask}
              onDelete={handleDeleteTask}
              tasks={tasks}
              defaultOpen={true}
            />
          </FloatingPanel>
        )}
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <section className="tasks-page__sidebar">
        <button
          type="button"
          className="button button--ghost sidebar__button"
          onClick={() => setFormPanel('task')}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Nueva tarea'}
        </button>

        <button
          type="button"
          className="button button--ghost sidebar__button"
          onClick={() => setFormPanel('category')}
        >
          Gestionar categorías
        </button>

        <button
          type="button"
          className="button button--ghost sidebar__button"
          onClick={() => setSummaryOpen(true)}
        >
          Resumen
        </button>
      </section>

      <section className="tasks-page__content">
        <Alert type="error" message={error} onRetry={refresh} onClose={clearError} />

        <FilteredTaskList
          filters={mainFilters}
          tasks={rootTasks}
          allTasks={tasks}
          loading={loading}
          busy={saving}
          onChange={updateTask}
          onDelete={handleDeleteTask}
          onOpen={setSelectedTaskId}
          emptyTitle="No hay tareas que coincidan con el filtro."
          emptyHint="Crea una nueva tarea con el botón flotante."
          countLabel="tareas principales"
        />
      </section>

      {formPanel === 'task' && (
        <FloatingPanel open onClose={() => setFormPanel(null)} title="Nueva tarea">
          <TaskForm
            categories={categories}
            categoriesLoading={categoriesLoading}
            onCreate={createTask}
            saving={saving}
            tasks={tasks}
            defaultOpen={true}
          />
        </FloatingPanel>
      )}

      {formPanel === 'category' && (
        <FloatingPanel
          open
          onClose={() => setFormPanel(null)}
          title="Gestionar categorías"
        >
          <CategoryManager
            categories={categories}
            saving={categorySaving}
            error={categoriesError}
            onCreate={createCategory}
            onUpdate={handleUpdateCategory}
            onDelete={handleDeleteCategory}
            onClearError={clearCategoriesError}
            defaultOpen={true}
          />
        </FloatingPanel>
      )}

      {summaryOpen && (
        <FloatingPanel open onClose={() => setSummaryOpen(false)} title="Resumen">
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
        </FloatingPanel>
      )}
    </div>
  );
}
