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
 *
 * Filtros de fecha (dueDate, date): ciclo inactivo → sin orden → ascendente → descendente → inactivo.
 * Otros filtros (estado, prioridad, categoría): ciclo inactivo → incluir → excluir → inactivo.
 */
export function useTaskFilters(categories) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([
    { type: 'status', groupLabel: 'Estado', value: 'pending', label: 'Pendiente' },
  ]);

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
      {
        type: 'date',
        label: 'Fecha',
        options: [{ value: 'hasDate', label: 'Con fecha' }],
      },
    ],
    [categories],
  );

  const activeKeys = useMemo(
    () => new Set(activeFilters.map((filter) => `${filter.type}:${filter.value}`)),
    [activeFilters],
  );

  const isDateType = useCallback(
    (type) => type === 'dueDate' || type === 'date',
    [],
  );

  /** Ciclo de estados según tipo de filtro. */
  const toggleFilter = useCallback((filter) => {
    setActiveFilters((current) => {
      const existingIndex = current.findIndex(
        (item) => item.type === filter.type && item.value === filter.value,
      );

      if (existingIndex === -1) {
        return [...current, { ...filter }];
      }

      const existing = current[existingIndex];

      if (isDateType(filter.type)) {
        if (!existing.direction) {
          return current.map((item, i) =>
            i === existingIndex ? { ...item, direction: 'asc' } : item,
          );
        }
        if (existing.direction === 'asc') {
          return current.map((item, i) =>
            i === existingIndex ? { ...item, direction: 'desc' } : item,
          );
        }
      } else {
        if (!existing.direction) {
          return current.map((item, i) =>
            i === existingIndex ? { ...item, direction: 'exclude' } : item,
          );
        }
      }

      return current.filter(
        (item) => !(item.type === filter.type && item.value === filter.value),
      );
    });
  }, [isDateType]);

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

      const byType = activeFilters.reduce((acc, f) => {
        (acc[f.type] = acc[f.type] || []).push(f);
        return acc;
      }, {});

      let result = tasks.filter((task) => {
        const matchesSearch =
          !term ||
          task.title.toLowerCase().includes(term) ||
          (task.description ?? '').toLowerCase().includes(term);

        if (!matchesSearch) return false;

        for (const [type, filters] of Object.entries(byType)) {
          if (type === 'dueDate') {
            if (!matchesDueDate(task, new Set(filters.map((f) => f.value)), today))
              return false;
          } else if (type === 'date') {
            const hasDate = Boolean(task.dueDate);
            if (
              !filters.some(
                (f) => (f.value === 'hasDate') === hasDate,
              )
            )
              return false;
          } else {
            const includeValues = filters
              .filter((f) => !f.direction)
              .map((f) => f.value);
            const excludeValues = filters
              .filter((f) => f.direction === 'exclude')
              .map((f) => f.value);

            if (includeValues.length > 0) {
              const hasInclude =
                type === 'category'
                  ? (task.categories ?? []).some((c) =>
                      includeValues.includes(c.id),
                    )
                  : includeValues.includes(task[type]);
              if (!hasInclude) return false;
            }

            if (excludeValues.length > 0) {
              const hasExclude =
                type === 'category'
                  ? (task.categories ?? []).some((c) =>
                      excludeValues.includes(c.id),
                    )
                  : excludeValues.includes(task[type]);
              if (hasExclude) return false;
            }
          }
        }

        return true;
      });

      const dateFilter = activeFilters.find(
        (f) => isDateType(f.type) && f.direction,
      );
      if (dateFilter) {
        const dir = dateFilter.direction === 'asc' ? 1 : -1;
        result.sort((a, b) => {
          const aDate = a.dueDate ?? '';
          const bDate = b.dueDate ?? '';
          if (aDate < bDate) return -dir;
          if (aDate > bDate) return dir;
          return 0;
        });
      }

      return result;
    },
    [search, activeFilters, isDateType],
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
