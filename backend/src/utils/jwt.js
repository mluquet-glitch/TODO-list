import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'tareas-api';
const AUDIENCE = 'tareas-frontend';

/** Firma un access token de corta duración con el id del usuario como `sub`. */
export function signAccessToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    env.jwt.accessSecret,
    {
      subject: String(user.id),
      expiresIn: env.jwt.accessExpiresIn,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );
}

/**
 * Verifica firma, expiración, emisor y audiencia.
 * Lanza si el token es inválido; el middleware lo traduce a 401.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}
