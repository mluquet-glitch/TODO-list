import bcrypt from 'bcryptjs';
import { usersRepository } from '../repositories/users.repository.js';
import { refreshTokensRepository } from '../repositories/refreshTokens.repository.js';
import { signAccessToken } from '../utils/jwt.js';
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiresAt,
} from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';

const BCRYPT_ROUNDS = 12;

/** Elimina el hash de contraseña antes de devolver el usuario a la API. */
function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

/** Crea un access token + un refresh token persistido (solo su hash). */
async function createSession(user, userAgent) {
  const refreshToken = generateRefreshToken();

  await refreshTokensRepository.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshTokenExpiresAt(),
    userAgent,
  });

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

export const authService = {
  async register({ name, email, password }, userAgent) {
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await usersRepository.create({ name, email, passwordHash });

    return createSession(user, userAgent);
  },

  async login({ email, password }, userAgent) {
    const user = await usersRepository.findByEmail(email);

    // Mismo mensaje para email inexistente y contraseña incorrecta:
    // evita revelar qué cuentas existen.
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw ApiError.unauthorized('Email o contraseña incorrectos');
    }

    return createSession(user, userAgent);
  },

  /**
   * Rotación del refresh token. Si se detecta reutilización de un token ya
   * revocado se cierran todas las sesiones del usuario (posible robo).
   */
  async refresh(rawToken, userAgent) {
    if (!rawToken) {
      throw ApiError.unauthorized('No hay una sesión activa');
    }

    const stored = await refreshTokensRepository.findByHash(hashToken(rawToken));

    if (!stored) {
      throw ApiError.unauthorized('La sesión no es válida. Inicia sesión de nuevo');
    }

    if (stored.revokedAt) {
      await refreshTokensRepository.revokeAllForUser(stored.userId);
      throw ApiError.unauthorized('La sesión ya no es válida. Inicia sesión de nuevo');
    }

    if (new Date(stored.expiresAt) <= new Date()) {
      await refreshTokensRepository.revokeByHash(stored.tokenHash);
      throw ApiError.unauthorized('La sesión ha caducado. Inicia sesión de nuevo');
    }

    const user = await usersRepository.findById(stored.userId);
    if (!user) {
      throw ApiError.unauthorized('La cuenta ya no existe');
    }

    const newRefreshToken = generateRefreshToken();
    const rotated = await refreshTokensRepository.rotate({
      id: stored.id,
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: refreshTokenExpiresAt(),
      userAgent,
    });

    if (!rotated) {
      throw ApiError.unauthorized('La sesión ya no es válida. Inicia sesión de nuevo');
    }

    return {
      user: toPublicUser(user),
      accessToken: signAccessToken(user),
      refreshToken: newRefreshToken,
    };
  },

  async logout(rawToken) {
    if (!rawToken) return;
    await refreshTokensRepository.revokeByHash(hashToken(rawToken));
  },

  async me(userId) {
    const user = await usersRepository.findById(userId);
    if (!user) throw ApiError.unauthorized('La cuenta ya no existe');
    return toPublicUser(user);
  },
};
