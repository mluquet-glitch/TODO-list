import { ApiError } from '../utils/ApiError.js';

const INT_RE = /^[1-9]\d*$/;

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('El cuerpo de la solicitud debe ser un objeto JSON');
  }
}

/** Devuelve el texto recortado o null si viene vacío. */
function normalizeString(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function parseNombre(value, errors, { required }) {
  if (value === undefined) {
    if (required) errors.push('nombre es obligatorio');
    return undefined;
  }

  const nombre = normalizeString(value);

  if (nombre === undefined) {
    errors.push('nombre debe ser texto');
    return undefined;
  }

  if (!nombre) {
    errors.push('nombre no puede estar vacío');
    return undefined;
  }

  if (nombre.length > 255) {
    errors.push('nombre no puede superar los 255 caracteres');
    return undefined;
  }

  return nombre;
}

function parseDescripcion(value, errors) {
  if (value === undefined) return undefined;

  const descripcion = normalizeString(value);

  if (descripcion === undefined) {
    errors.push('descripcion debe ser texto');
    return undefined;
  }

  if (descripcion && descripcion.length > 2000) {
    errors.push('descripcion no puede superar los 2000 caracteres');
    return undefined;
  }

  return descripcion;
}

function parseDisparador(value, errors) {
  if (value === undefined) return undefined;

  const disparador = normalizeString(value);

  if (disparador === undefined) {
    errors.push('disparador debe ser texto');
    return undefined;
  }

  if (disparador && disparador.length > 255) {
    errors.push('disparador no puede superar los 255 caracteres');
    return undefined;
  }

  return disparador;
}

/** Valida POST /api/protocolos. */
export function validateCreateProtocolo(body) {
  assertObject(body);

  const errors = [];
  const nombre = parseNombre(body.nombre, errors, { required: true });
  const disparador = parseDisparador(body.disparador, errors);

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  return { nombre, disparador: disparador ?? null };
}

/** Valida PATCH /api/protocolos/:id. */
export function validateUpdateProtocolo(body) {
  assertObject(body);

  if (!Object.hasOwn(body, 'nombre') && !Object.hasOwn(body, 'disparador')) {
    throw ApiError.badRequest(
      'Envía al menos un campo editable: nombre o disparador',
    );
  }

  const errors = [];
  const data = {};

  if (Object.hasOwn(body, 'nombre')) {
    const nombre = parseNombre(body.nombre, errors, { required: true });
    if (nombre !== undefined) data.nombre = nombre;
  }

  if (Object.hasOwn(body, 'disparador')) {
    const disparador = parseDisparador(body.disparador, errors);
    if (disparador !== undefined) data.disparador = disparador;
  }

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  return data;
}

/** Valida POST /api/protocolos/:id/pasos. */
export function validateCreatePaso(body) {
  assertObject(body);

  const errors = [];
  const nombre = parseNombre(body.nombre, errors, { required: true });
  const descripcion = parseDescripcion(body.descripcion, errors);

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  return { nombre, descripcion: descripcion ?? null };
}

/** Valida PATCH /api/protocolos/:protocoloId/pasos/:pasoId. */
export function validateUpdatePaso(body) {
  assertObject(body);

  if (!Object.hasOwn(body, 'nombre') && !Object.hasOwn(body, 'descripcion')) {
    throw ApiError.badRequest(
      'Envía al menos un campo editable: nombre o descripcion',
    );
  }

  const errors = [];
  const data = {};

  if (Object.hasOwn(body, 'nombre')) {
    const nombre = parseNombre(body.nombre, errors, { required: true });
    if (nombre !== undefined) data.nombre = nombre;
  }

  if (Object.hasOwn(body, 'descripcion')) {
    const descripcion = parseDescripcion(body.descripcion, errors);
    if (descripcion !== undefined) data.descripcion = descripcion;
  }

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  return data;
}

/** Valida un id positivo de ruta. */
function validateId(value, label) {
  if (typeof value !== 'string' || !INT_RE.test(value) || !Number.isSafeInteger(Number(value))) {
    throw ApiError.badRequest(`${label} debe ser un entero positivo`);
  }
  return Number(value);
}

export function validateProtocoloId(value) {
  return validateId(value, 'El id del protocolo');
}

export function validatePasoId(value) {
  return validateId(value, 'El id del paso');
}
