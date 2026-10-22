import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Exige `Authorization: Bearer <access token>` válido y adjunta `req.user`.
 * Los datos del usuario vienen firmados en el token; no se consulta la BD
 * en cada petición.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Se requiere un token de acceso Bearer'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'El token de acceso ha expirado'
        : 'El token de acceso es inválido';
    return next(ApiError.unauthorized(message));
  }
}
