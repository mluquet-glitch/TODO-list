/** Etiquetas en español para los estados y prioridades que maneja el backend. */
export const TASK_STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'done', label: 'Completada' },
];

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export const STATUS_LABELS = Object.fromEntries(
  TASK_STATUSES.map(({ value, label }) => [value, label]),
);

export const PRIORITY_LABELS = Object.fromEntries(
  TASK_PRIORITIES.map(({ value, label }) => [value, label]),
);
