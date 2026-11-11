import { useId, useMemo, useState } from 'react';
import ActiveFilters from './ActiveFilters.jsx';
import FilterDropdown from './FilterDropdown.jsx';
import TaskList from './TaskList.jsx';
import { isTaskOverdue, todayDateOnly } from '../utils/dates.js';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Añade un cero a la izquierda a números de un dígito. */
function pad2(value) {
  return String(value).padStart(2, '0');
}

/** Desplaza un mes `YYYY-MM` la cantidad de meses indicada. */
function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

/** Nombre legible del mes (`noviembre de 2026`). */
function monthTitle(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthNumber - 1, 1));
}

/**
 * Construye la matriz del mes empezando en lunes. Las celdas vacías del
 * principio y del final se representan con `null`.
 */
function buildMonthCells(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  // getDay() devuelve 0 para domingo; lo movemos para que la semana empiece en lunes.
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  const cells = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${pad2(day)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

/**
 * Calendario mensual de tareas con filtros por fecha y listado paginado de
 * las tareas que no tienen fecha (matriz de 5×2 cards).
 */
export default function TaskCalendar({
  filters,
  tasks,
  allTasks = [],
  loading,
  busy,
  onChange,
  onDelete,
  onOpen,
  onOpenFloating,
}) {
  const searchId = useId();
  const today = todayDateOnly();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState('');

  const visibleTasks = filters.filterTasks(tasks);
  const datedTasks = visibleTasks.filter((task) => Boolean(task.dueDate));
  const undatedTasks = visibleTasks.filter((task) => !task.dueDate);

  // Si hay una fecha exacta seleccionada, el calendario solo pinta esas tareas.
  const shownDatedTasks = selectedDate
    ? datedTasks.filter((task) => task.dueDate === selectedDate)
    : datedTasks;

  const tasksByDate = useMemo(() => {
    const map = new Map();
    for (const task of shownDatedTasks) {
      const dayTasks = map.get(task.dueDate) ?? [];
      dayTasks.push(task);
      map.set(task.dueDate, dayTasks);
    }
    return map;
  }, [shownDatedTasks]);

  const cells = useMemo(() => buildMonthCells(month), [month]);

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

  function changeMonth(nextMonth) {
    if (!nextMonth) return;
    setMonth(nextMonth);
    setSelectedDate('');
  }

  function handleDateFilter(value) {
    setSelectedDate(value);
    if (value) setMonth(value.slice(0, 7));
  }

  function toggleDate(day) {
    setSelectedDate((current) => (current === day ? '' : day));
  }

  return (
    <div className="task-calendar-section">
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

      <div className="calendar-filters">
        <div className="calendar-filters__month">
          <button
            type="button"
            className="button button--ghost calendar-filters__arrow"
            onClick={() => changeMonth(shiftMonth(month, -1))}
            aria-label="Mes anterior"
            title="Mes anterior"
          >
            ‹
          </button>
          <input
            type="month"
            className="calendar-filters__month-input"
            value={month}
            onChange={(event) => changeMonth(event.target.value)}
            aria-label="Mes del calendario"
          />
          <button
            type="button"
            className="button button--ghost calendar-filters__arrow"
            onClick={() => changeMonth(shiftMonth(month, 1))}
            aria-label="Mes siguiente"
            title="Mes siguiente"
          >
            ›
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => changeMonth(today.slice(0, 7))}
          >
            Hoy
          </button>
        </div>

        <label className="calendar-filters__date">
          <span className="field__label">Filtrar por fecha</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => handleDateFilter(event.target.value)}
          />
        </label>

        {selectedDate && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setSelectedDate('')}
          >
            Limpiar fecha
          </button>
        )}

        <span className="calendar-filters__count muted">
          {shownDatedTasks.length} con fecha · {undatedTasks.length} sin fecha
        </span>
      </div>

      {loading ? (
        <p className="muted">Cargando tareas…</p>
      ) : (
        <>
          <section className="card task-calendar">
            <div className="task-calendar__header">
              <h2 className="card__title task-calendar__title">
                {monthTitle(month)}
              </h2>
              {selectedDate && (
                <span className="badge badge--done">
                  Mostrando solo el {selectedDate.split('-').reverse().join('/')}
                </span>
              )}
            </div>

            <div className="task-calendar__weekdays">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday} className="task-calendar__weekday">
                  {weekday}
                </span>
              ))}
            </div>

            <div className="task-calendar__grid">
              {cells.map((date, index) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="task-calendar__cell task-calendar__cell--empty"
                    />
                  );
                }

                const dayTasks = tasksByDate.get(date) ?? [];
                const isToday = date === today;
                const isSelected = date === selectedDate;
                const isWeekend = index % 7 >= 5;

                return (
                  <div
                    key={date}
                    className={[
                      'task-calendar__cell',
                      isToday ? 'task-calendar__cell--today' : '',
                      isSelected ? 'task-calendar__cell--selected' : '',
                      isWeekend ? 'task-calendar__cell--weekend' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="task-calendar__day"
                      onClick={() => toggleDate(date)}
                      title={
                        isSelected
                          ? 'Quitar el filtro de esta fecha'
                          : 'Filtrar por esta fecha'
                      }
                    >
                      {Number(date.slice(-2))}
                      {dayTasks.length > 0 && (
                        <span className="task-calendar__day-count">
                          {dayTasks.length}
                        </span>
                      )}
                    </button>

                    <div className="task-calendar__tasks">
                      {dayTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          className={[
                            'task-calendar__task',
                            task.status === 'done'
                              ? 'task-calendar__task--done'
                              : '',
                            isTaskOverdue(task, today)
                              ? 'task-calendar__task--overdue'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => onOpenFloating?.(task.id)}
                          title={task.title}
                        >
                          {task.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card task-calendar__undated">
            <div className="task-calendar__undated-head">
              <h2 className="card__title">Sin fecha ({undatedTasks.length})</h2>
              <span className="muted">
                Tareas que no tienen fecha límite.
              </span>
            </div>

            <TaskList
              tasks={undatedTasks}
              allTasks={allTasks}
              loading={false}
              busy={busy}
              onChange={onChange}
              onDelete={onDelete}
              onOpen={onOpen}
              onOpenFloating={onOpenFloating}
              emptyTitle="No hay tareas sin fecha."
              emptyHint="Asigna una fecha a una tarea para verla en el calendario."
            />
          </section>

          <section className="card task-calendar__undated">
            <div className="task-calendar__undated-head">
              <h2 className="card__title">
                Todas las tareas ({visibleTasks.length})
              </h2>
              <span className="muted">
                Listado completo con los filtros aplicados.
              </span>
            </div>

            <TaskList
              tasks={visibleTasks}
              allTasks={allTasks}
              loading={false}
              busy={busy}
              onChange={onChange}
              onDelete={onDelete}
              onOpen={onOpen}
              onOpenFloating={onOpenFloating}
              emptyTitle="No hay tareas que coincidan con el filtro."
              emptyHint="Cambia o limpia los filtros para ver más tareas."
            />
          </section>
        </>
      )}
    </div>
  );
}
