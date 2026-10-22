import { ApiError } from '../utils/ApiError.js';

/** Estados permitidos por la tabla `tasks` (deben coincidir con el CHECK de la migración). */
export const TASK_STATUSES = ['pending', 'in_progress', 'done'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeString(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Cada parser devuelve el valor listo para SQL o `undefined` si es inválido. */
const parsers = {
  title(value, errors) {
    const title = normalizeString(value);
    if (!title) {
      errors.push('title es obligatorio');
      return undefined;
    }
    if (title.length > 120) {
      errors.push('title no puede superar los 120 caracteres');
      return undefined;
    }
    return title;
  },
  description(value, errors) {
    const description = normalizeString(value);
    if (description && description.length > 1000) {
      errors.push('description no puede superar los 1000 caracteres');
      return undefined;
    }
    return description;
  },
  status(value, errors) {
    if (!TASK_STATUSES.includes(value)) {
      errors.push(`status debe ser uno de: ${TASK_STATUSES.join(', ')}`);
      return undefined;
    }
    return value;
  },
  dueDate(value, errors) {
    if (value === null || value === '') return null;
    if (typeof value !== 'string' || !DATE_RE.test(value) || Number.isNaN(Date.parse(value))) {
      errors.push('dueDate debe ser una fecha válida con formato YYYY-MM-DD');
      return undefined;
    }
    return value;
  },
};

function parseBody(body, mode) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('El cuerpo de la solicitud debe ser un objeto JSON');
  }

  const errors = [];
  const data = {};
  // En creación `title` es obligatorio y el resto solo se valida si viene
  // (así se aplican los valores por defecto de la base de datos).
  const keys =
    mode === 'create'
      ? [
          'title',
          ...Object.keys(parsers).filter(
            (key) => key !== 'title' && Object.hasOwn(body, key),
          ),
        ]
      : Object.keys(parsers).filter((key) => Object.hasOwn(body, key));

  for (const key of keys) {
    const parsed = parsers[key](body[key], errors);
    if (parsed !== undefined) data[key] = parsed;
  }

  if (mode === 'update' && keys.length === 0) {
    errors.push('Envía al menos un campo editable: title, description, status o dueDate');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Datos inválidos', errors);
  }

  return data;
}

/** Valida el body de POST /api/tasks. `title` es obligatorio. */
export function validateCreateTask(body) {
  return parseBody(body, 'create');
}

/** Valida el body de PATCH /api/tasks/:id (actualización parcial). */
export function validateUpdateTask(body) {
  return parseBody(body, 'update');
}

/** Valida el `:id` de la ruta antes de tocar la base de datos. */
export function validateTaskId(id) {
  if (!UUID_RE.test(id)) {
    throw ApiError.badRequest('El id debe ser un UUID válido');
  }
  return id;
}
