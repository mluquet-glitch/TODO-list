import { useId, useMemo } from 'react';
import ActiveFilters from './ActiveFilters.jsx';
import FilterDropdown from './FilterDropdown.jsx';
import TaskList from './TaskList.jsx';

/**
 * Barra de búsqueda/filtros + listado filtrado. Se reutiliza en la pantalla
 * principal y en el detalle para que ambas permitan varios filtros activos.
 */
export default function FilteredTaskList({
  filters,
  tasks,
  allTasks = [],
  loading,
  busy,
  onChange,
  onDelete,
  onOpen,
  onOpenFloating,
  emptyTitle,
  emptyHint,
  countLabel = 'tareas',
}) {
  const searchId = useId();
  const visibleTasks = filters.filterTasks(tasks);

  // Tareas pendientes por categoría, contando todas las tareas (no solo la lista actual).
  const categoryCounts = useMemo(() => {
    const counts = new Map();

    for (const task of allTasks ?? []) {
      if (task.status !== 'pending') continue;

      for (const category of task.categories ?? []) {
        counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
      }
    }

    return counts;
  }, [allTasks]);

  return (
    <div className="filtered-task-list">
      <div className="toolbar">
        <div className="field field--inline">
          <label className="visually-hidden" htmlFor={searchId}>
            Buscar tareas
          </label>
          <input
            id={searchId}
            type="search"
            value={filters.search}
            onChange={(event) => filters.setSearch(event.target.value)}
            placeholder="Buscar por título o descripción…"
          />
        </div>

        <FilterDropdown
          groups={filters.filterGroups}
          activeKeys={filters.activeKeys}
          activeFilters={filters.activeFilters}
          categoryCounts={categoryCounts}
          onToggle={filters.toggleFilter}
        />
      </div>

      <ActiveFilters
        filters={filters.activeFilters}
        onRemove={filters.removeFilter}
        onClear={filters.clearFilters}
      />

      <TaskList
        tasks={visibleTasks}
        allTasks={allTasks}
        loading={loading}
        busy={busy}
        onChange={onChange}
        onDelete={onDelete}
        onOpen={onOpen}
        onOpenFloating={onOpenFloating}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
      />

      {!loading && visibleTasks.length > 0 && (
        <p className="muted tasks-page__count">
          Mostrando {visibleTasks.length} de {tasks.length} {countLabel}.
        </p>
      )}
    </div>
  );
}
