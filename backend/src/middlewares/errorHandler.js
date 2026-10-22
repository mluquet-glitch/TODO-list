import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/** Códigos de error de PostgreSQL que sí sabemos traducir a respuestas HTTP. */
const PG_ERRORS = {
  23505: { status: 409, message: 'Ya existe un registro con esos datos' },
  23503: { status: 409, message: 'El registro referenciado no existe' },
  23514: { status: 400, message: 'Un valor no cumple las restricciones de la base de datos' },
  '22P02': { status: 400, message: 'Identificador o valor con formato inválido' },
  '22007': { status: 400, message: 'Fecha con formato inválido' },
};

/**
 * Middleware final de errores. Debe declararse con 4 argumentos
 * para que Express lo reconozca como error handler.
 */
export function errorHandler(error, req, res, _next) {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let details;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (PG_ERRORS[error.code]) {
    statusCode = PG_ERRORS[error.code].status;
    message = PG_ERRORS[error.code].message;
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'El cuerpo de la solicitud no es un JSON válido';
  }

  if (statusCode >= 500) {
    console.error('[error]', error);
  } else if (!env.isProduction) {
    console.warn(`[warn] ${statusCode} ${req.method} ${req.originalUrl}: ${message}`);
  }

  const body = { error: { message } };
  if (details) body.error.details = details;
  // En desarrollo se expone el stack para depurar; en producción nunca.
  if (!env.isProduction && statusCode >= 500) body.error.stack = error.stack;

  res.status(statusCode).json(body);
}
