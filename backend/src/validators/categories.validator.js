import { ApiError } from '../utils/ApiError.js';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const ID_RE = /^[1-9]\d*$/;

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('El cuerpo de la solicitud debe ser un objeto JSON');
  }
}

function parseName(value, errors, { required }) {
  if (value === undefined) {
    if (required) errors.push('name es obligatorio');
    return undefined;
  }

  if (typeof value !== 'string') {
    errors.push('name debe ser texto');
    return undefined;
  }

  const name = value.trim();

  if (name.length === 0) {
    errors.push('name no puede estar vacío');
    return undefined;
  }

  if (name.length > 80) {
    errors.push('name no puede superar los 80 caracteres');
    return undefined;
  }

  return name;
}

function parseColor(value, errors) {
  if (value === undefined || value === null || value === '') return undefined;

  if (typeof value !== 'string' || !HEX_COLOR_RE.test(value.trim())) {
    errors.push('color debe tener formato hexadecimal, por ejemplo #2563eb');
    return undefined;
  }

  return value.trim().toLowerCase();
}

function parseParentId(value, errors) {
  if (value === null || value === undefined || value === '') return null;

  const id = typeof value === 'string' ? Number(value) : value;
  if (!Number.isSafeInteger(id) || id <= 0) {
    errors.push('parentId debe ser un id de categoría válido');
    return undefined;
  }
  return id;
}

/** Valida POST /api/categories. */
export function validateCreateCategory(body) {
  assertObject(body);

  const errors = [];
  const name = parseName(body.name, errors, { required: true });
  const color = parseColor(body.color, errors);
  const parentId = parseParentId(body.parentId, errors);

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  const data = { name };
  if (color !== undefined) data.color = color;
  if (parentId !== null) data.parentId = parentId;
  return data;
}

/** Valida PATCH /api/categories/:id. */
export function validateUpdateCategory(body) {
  assertObject(body);

  const errors = [];
  const name = parseName(body.name, errors, { required: false });
  const color = parseColor(body.color, errors);
  const parentId = parseParentId(body.parentId, errors);

  if (name === undefined && color === undefined && parentId === null) {
    errors.push('Envía al menos un campo editable: name, color o parentId');
  }

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  const data = {};
  if (name !== undefined) data.name = name;
  if (color !== undefined) data.color = color;
  if (parentId !== null) data.parentId = parentId;
  return data;
}

/** Valida el `:id` de las rutas de categorías. */
export function validateCategoryId(value) {
  if (typeof value !== 'string' || !ID_RE.test(value) || !Number.isSafeInteger(Number(value))) {
    throw ApiError.badRequest('El id debe ser un entero positivo');
  }
  return Number(value);
}
