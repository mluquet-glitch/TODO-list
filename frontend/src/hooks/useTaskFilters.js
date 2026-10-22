import { useCallback, useMemo, useState } from 'react';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/tasks.js';
import { addDaysDateOnly, todayDateOnly } from '../utils/dates.js';

const DUE_DATE_OPTIONS = [
  { value: 'overdue', label: 'Vencidas' },
  { value: 'today', label: 'Para hoy' },
  { value: 'week', label: 'Próximos 7 días' },
  { value: 'none', label: 'Sin fecha' },
];

/** OR entre las opciones de fecha seleccionadas. */
function matchesDueDate(task, selected, today) {
  if (selected.size === 0) return true;

  const weekEnd = addDaysDateOnly(today, 7);

  return [...selected].some((option) => {
    switch (option) {
      case 'overdue':
        return (
          Boolean(task.dueDate) &&
          task.status !== 'done' &&
          task.dueDate < today
        );
      case 'today':
        return task.dueDate === today;
      case 'week':
        return Boolean(task.dueDate) && task.dueDate >= today && task.dueDate <= weekEnd;
      case 'none':
        return !task.dueDate;
      default:
        return false;
    }
  });
}

/**
 * Estado y lógica de filtros compartidos por la pantalla principal y el detalle.
 * Permite varios valores activos a la vez; dentro del mismo tipo se combinan con
 * OR y entre tipos distintos con AND.
 */
export function useTaskFilters(categories) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);

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
      {
        type: 'dueDate',
        label: 'Fecha límite',
        options: DUE_DATE_OPTIONS,
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
          dueDate: new Set(),
        },
      ),
    [activeFilters],
  );

  /** Añade el filtro si no estaba activo; si ya estaba, lo retira. */
  const toggleFilter = useCallback((filter) => {
    setActiveFilters((current) => {
      const exists = current.some(
        (item) => item.type === filter.type && item.value === filter.value,
      );

      return exists
        ? current.filter(
            (item) => !(item.type === filter.type && item.value === filter.value),
          )
        : [...current, filter];
    });
  }, []);

  const removeFilter = useCallback((filter) => {
    setActiveFilters((current) =>
      current.filter(
        (item) => !(item.type === filter.type && item.value === filter.value),
      ),
    );
  }, []);

  const clearFilters = useCallback(() => setActiveFilters([]), []);

  const reset = useCallback(() => {
    setSearch('');
    setActiveFilters([]);
  }, []);

  /** Mantiene los chips sincronizados si se renombra o recolorea una categoría. */
  const updateCategoryFilter = useCallback((id, category) => {
    setActiveFilters((current) =>
      current.map((filter) =>
        filter.type === 'category' && filter.value === id
          ? { ...filter, label: category.name, color: category.color }
          : filter,
      ),
    );
  }, []);

  /** Retira el filtro de una categoría eliminada. */
  const removeCategoryFilter = useCallback((id) => {
    setActiveFilters((current) =>
      current.filter(
        (filter) => !(filter.type === 'category' && filter.value === id),
      ),
    );
  }, []);

  const filterTasks = useCallback(
    (tasks) => {
      const term = search.trim().toLowerCase();
      const today = todayDateOnly();

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
        const matchesDate = matchesDueDate(task, selected.dueDate, today);
        const matchesSearch =
          !term ||
          task.title.toLowerCase().includes(term) ||
          (task.description ?? '').toLowerCase().includes(term);

        return (
          matchesStatus &&
          matchesPriority &&
          matchesCategory &&
          matchesDate &&
          matchesSearch
        );
      });
    },
    [search, selected],
  );

  return {
    search,
    setSearch,
    activeFilters,
    filterGroups,
    activeKeys,
    filterTasks,
    toggleFilter,
    removeFilter,
    clearFilters,
    reset,
    updateCategoryFilter,
    removeCategoryFilter,
  };
}
