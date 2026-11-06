import { ApiError } from '../utils/ApiError.js';

const INT_RE = /^[1-9]\d*$/;

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('El cuerpo de la solicitud debe ser un objeto JSON');
  }
}

function parseNombre(value, errors, { required }) {
  if (value === undefined) {
    if (required) errors.push('nombre es obligatorio');
    return undefined;
  }

  if (typeof value !== 'string') {
    errors.push('nombre debe ser texto');
    return undefined;
  }

  const nombre = value.trim();

  if (nombre.length === 0) {
    errors.push('nombre no puede estar vacío');
    return undefined;
  }

  if (nombre.length > 255) {
    errors.push('nombre no puede superar los 255 caracteres');
    return undefined;
  }

  return nombre;
}

/** Valida POST /api/emociones. */
export function validateCreateEmocion(body) {
  assertObject(body);

  const errors = [];
  const nombre = parseNombre(body.nombre, errors, { required: true });

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  return { nombre };
}

/** Valida PATCH /api/emociones/:id. */
export function validateUpdateEmocion(body) {
  assertObject(body);

  if (!Object.hasOwn(body, 'nombre')) {
    throw ApiError.badRequest('Envía al menos un campo editable: nombre');
  }

  const errors = [];
  const nombre = parseNombre(body.nombre, errors, { required: true });

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  return { nombre };
}

/** Valida el `:id` de las rutas de emociones. */
export function validateEmocionId(value) {
  if (typeof value !== 'string' || !INT_RE.test(value) || !Number.isSafeInteger(Number(value))) {
    throw ApiError.badRequest('El id debe ser un entero positivo');
  }
  return Number(value);
}
