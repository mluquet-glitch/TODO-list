/** Etiquetas en español para los estados que maneja el backend. */
export const TASK_STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'done', label: 'Completada' },
];

export const STATUS_LABELS = Object.fromEntries(
  TASK_STATUSES.map(({ value, label }) => [value, label]),
);
