/**
 * Error "operativo": un fallo esperado de la aplicación (validación, 404, conflicto).
 * El errorHandler lo traduce a una respuesta HTTP; los errores inesperados se ocultan.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Solicitud inválida', details) {
    return new ApiError(400, message, details);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflicto con el estado actual del recurso') {
    return new ApiError(409, message);
  }
}
