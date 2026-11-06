/** Utilidades para fechas sin hora (`YYYY-MM-DD`), evitando desfases de zona horaria. */

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convierte `YYYY-MM-DD` en una fecha local o devuelve null si no es válida. */
export function parseDateOnly(value) {
  if (typeof value !== 'string') return null;

  const match = DATE_ONLY_RE.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isValid ? date : null;
}

/** Fecha local de hoy en formato `YYYY-MM-DD`. */
export function todayDateOnly(reference = new Date()) {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');
  const day = String(reference.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Suma días a una fecha `YYYY-MM-DD` y devuelve otra fecha sin hora. */
export function addDaysDateOnly(value, days) {
  const date = parseDateOnly(value);
  if (!date) return null;

  date.setDate(date.getDate() + days);
  return todayDateOnly(date);
}

/** Formatea una fecha sin hora para mostrarla en español. */
export function formatDateOnly(value) {
  const date = parseDateOnly(value);
  if (!date) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Una tarea está vencida si tiene fecha pasada y no está completada. */
export function isTaskOverdue(task, today = todayDateOnly()) {
  return Boolean(task.dueDate) && task.status !== 'done' && task.dueDate < today;
}

/** Formatea una fecha con hora (ISO o Date) para mostrarla en español. */
export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
