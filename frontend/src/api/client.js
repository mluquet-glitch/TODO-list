/** Cliente HTTP sobre fetch: access token en memoria, cookie de refresco y errores uniformes. */

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

// El access token vive solo en memoria (no en localStorage): si se recarga la
// página se recupera con el refresh token de la cookie httpOnly.
let accessToken = null;
let refreshPromise = null;
let authFailureHandler = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

/** Registra qué hacer cuando una petición queda sin sesión (la usa AuthContext). */
export function onAuthFailure(handler) {
  authFailureHandler = handler;
  return () => {
    if (authFailureHandler === handler) authFailureHandler = null;
  };
}

function buildHeaders(body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function rawFetch(path, { method = 'GET', body } = {}) {
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(body),
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function parseResponse(response) {
  // 204 No Content (DELETE/logout) no tiene body.
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `Error ${response.status}`;
    throw new ApiError(message, response.status, payload?.error?.details);
  }

  return payload;
}

/**
 * Pide un nuevo access token usando la cookie de refresco.
 * Single-flight: si varias peticiones reciben 401 a la vez, solo se hace un refresh.
 * Devuelve `{ user, accessToken }` o null si no hay sesión válida.
 */
export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          accessToken = null;
          return null;
        }

        const payload = await response.json();
        accessToken = payload?.data?.accessToken ?? null;
        return payload?.data ?? null;
      } catch {
        accessToken = null;
        return null;
      }
    })();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * @param {string} path ruta relativa, ej. '/tasks'
 * @param {{ method?: string, body?: unknown, retry?: boolean }} options
 */
async function request(path, { method = 'GET', body, retry = true } = {}) {
  let response;

  try {
    response = await rawFetch(path, { method, body });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. ¿Está el backend en marcha?');
  }

  // Access token caducado: se renueva una vez y se repite la petición.
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    const session = await refreshSession();
    if (session) return request(path, { method, body, retry: false });
    authFailureHandler?.();
  }

  return parseResponse(response);
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
