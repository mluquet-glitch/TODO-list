import { env } from '../config/env.js';

const COOKIE_PATH = '/api/auth';

/** Envía el refresh token en una cookie httpOnly (inaccesible desde JavaScript). */
export function setRefreshCookie(res, token) {
  res.cookie(env.cookies.name, token, {
    httpOnly: true,
    secure: env.cookies.secure,
    sameSite: env.cookies.sameSite,
    path: COOKIE_PATH,
    maxAge: env.cookies.maxAgeMs,
  });
}

/** Elimina la cookie de refresco (debe usar el mismo path). */
export function clearRefreshCookie(res) {
  res.clearCookie(env.cookies.name, {
    httpOnly: true,
    secure: env.cookies.secure,
    sameSite: env.cookies.sameSite,
    path: COOKIE_PATH,
  });
}

/** Lee el refresh token de la petición (requiere cookie-parser). */
export function readRefreshCookie(req) {
  return req.cookies?.[env.cookies.name] ?? null;
}
