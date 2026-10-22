import { ApiError } from '../utils/ApiError.js';

/** Valores permitidos por los CHECK de la tabla `tasks`. */
export const TASK_STATUSES = ['pending', 'in_progress', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const INT_RE = /^[1-9]\d*$/;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Acepta `null`/vacío o una fecha real en formato YYYY-MM-DD. */
function normalizeDateOnly(value, errors) {
  if (value === null || value === undefined || value === '') return null;

  const match = typeof value === 'string' ? DATE_ONLY_RE.exec(value) : null;
  if (!match) {
    errors.push('dueDate debe tener el formato YYYY-MM-DD');
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  const isValid =
    year >= 1000 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValid) {
    errors.push('dueDate no es una fecha válida');
    return undefined;
  }

  return value;
}

function normalizeString(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Convierte un id positivo (número o cadena numérica) o devuelve undefined. */
function normalizeId(value) {
  if (value === null || value === undefined || value === '') return null;
  const id = typeof value === 'string' ? Number(value) : value;
  if (!Number.isSafeInteger(id) || id <= 0) return undefined;
  return id;
}

/** Cada parser devuelve el valor listo para SQL o `undefined` si es inválido. */
const parsers = {
  title(value, errors) {
    const title = normalizeString(value);
    if (!title) {
      errors.push('title es obligatorio');
      return undefined;
    }
    if (title.length > 255) {
      errors.push('title no puede superar los 255 caracteres');
      return undefined;
    }
    return title;
  },
  description(value, errors) {
    const description = normalizeString(value);
    if (description && description.length > 2000) {
      errors.push('description no puede superar los 2000 caracteres');
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
  priority(value, errors) {
    if (!TASK_PRIORITIES.includes(value)) {
      errors.push(`priority debe ser una de: ${TASK_PRIORITIES.join(', ')}`);
      return undefined;
    }
    return value;
  },
  dueDate(value, errors) {
    return normalizeDateOnly(value, errors);
  },
  parentTaskId(value, errors) {
    if (value === null || value === '') return null;
    const id = normalizeId(value);
    if (id === undefined) {
      errors.push('parentTaskId debe ser un id de tarea válido');
      return undefined;
    }
    return id;
  },
  categoryIds(value, errors) {
    if (value === null) return [];

    if (!Array.isArray(value)) {
      errors.push('categoryIds debe ser un arreglo de ids');
      return undefined;
    }

    if (value.length > 20) {
      errors.push('categoryIds no puede contener más de 20 categorías');
      return undefined;
    }

    const ids = [];
    for (const item of value) {
      const id = normalizeId(item);
      if (typeof id !== 'number' || id <= 0) {
        errors.push('categoryIds debe contener ids de categoría válidos');
        return undefined;
      }
      if (!ids.includes(id)) ids.push(id);
    }

    return ids;
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
    errors.push(
      'Envía al menos un campo editable: title, description, status, priority, dueDate, parentTaskId o categoryIds',
    );
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
export function validateTaskId(value) {
  if (typeof value !== 'string' || !INT_RE.test(value) || !Number.isSafeInteger(Number(value))) {
    throw ApiError.badRequest('El id debe ser un entero positivo');
  }
  return Number(value);
}
