/**
 * Envuelve un handler async para que cualquier promesa rechazada
 * llegue a `next()` y sea capturada por el errorHandler central.
 * Evita repetir try/catch en cada controlador.
 */
export function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
