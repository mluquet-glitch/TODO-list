import { ApiError } from '../utils/ApiError.js';

/** Se registra después de todas las rutas: cualquier request sin match termina aquí. */
export function notFound(req, res, next) {
  next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}
