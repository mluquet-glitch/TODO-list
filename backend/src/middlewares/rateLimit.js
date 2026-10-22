import { rateLimit } from 'express-rate-limit';

/**
 * Límite de intentos en login/registro para frenar ataques de fuerza bruta
 * y creación masiva de cuentas.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      message: 'Demasiados intentos. Espera unos minutos antes de volver a probar.',
    },
  },
});
