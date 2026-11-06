import { ApiError } from '../utils/ApiError.js';

const INT_RE = /^[1-9]\d*$/;

/** Valida POST /api/ejecuciones. */
export function validateCreateEjecucion(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('El cuerpo de la solicitud debe ser un objeto JSON');
  }

  const rawId = body.protocoloId;
  const id = typeof rawId === 'string' ? Number(rawId) : rawId;

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw ApiError.badRequest('protocoloId debe ser un id de protocolo válido');
  }

  return { protocoloId: id };
}

/** Valida el `:id` de las rutas de ejecuciones. */
export function validateEjecucionId(value) {
  if (typeof value !== 'string' || !INT_RE.test(value) || !Number.isSafeInteger(Number(value))) {
    throw ApiError.badRequest('El id debe ser un entero positivo');
  }
  return Number(value);
}
