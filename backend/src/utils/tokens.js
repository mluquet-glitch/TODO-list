import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Genera un refresh token opaco (no es un JWT): 48 bytes aleatorios en base64url.
 * Se guarda su hash en la base de datos, nunca el valor en claro.
 */
export function generateRefreshToken() {
  return randomBytes(48).toString('base64url');
}

/** SHA-256 en hexadecimal (64 caracteres, coincide con CHAR(64) de la tabla). */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/** Fecha de expiración del refresh token según la configuración. */
export function refreshTokenExpiresAt() {
  return new Date(Date.now() + env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000);
}
