/** Cliente HTTP mínimo sobre fetch, con manejo uniforme de errores de la API. */

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

/** Error con el status HTTP y los detalles de validación devueltos por el backend. */
export class ApiError extends Error {
  constructor(message, status = 0, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * @param {string} path ruta relativa, ej. '/tasks'
 * @param {{ method?: string, body?: unknown, signal?: AbortSignal }} options
 */
async function request(path, { method = 'GET', body, signal } = {}) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('No se pudo conectar con el servidor. ¿Está el backend en marcha?');
  }

  // 204 No Content (DELETE) no tiene body.
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `Error ${response.status}`;
    throw new ApiError(message, response.status, payload?.error?.details);
  }

  return payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
