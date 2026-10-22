import { ApiError } from '../utils/ApiError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('El cuerpo de la solicitud debe ser un objeto JSON');
  }
}

function normalizeEmail(value, errors) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push('email es obligatorio');
    return undefined;
  }

  const email = value.trim().toLowerCase();

  if (email.length > 255 || !EMAIL_RE.test(email)) {
    errors.push('email no tiene un formato válido');
    return undefined;
  }

  return email;
}

function normalizePassword(value, errors, { checkStrength = false } = {}) {
  if (typeof value !== 'string' || value === '') {
    errors.push('password es obligatorio');
    return undefined;
  }

  // bcrypt solo usa los primeros 72 bytes: se rechaza lo que exceda ese límite.
  if (value.length < 8 || value.length > 72) {
    errors.push('password debe tener entre 8 y 72 caracteres');
    return undefined;
  }

  if (checkStrength && (!/[a-zA-Z]/.test(value) || !/\d/.test(value))) {
    errors.push('password debe incluir al menos una letra y un número');
    return undefined;
  }

  return value;
}

/** Valida POST /api/auth/register. */
export function validateRegister(body) {
  assertObject(body);

  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (name.length < 2 || name.length > 120) {
    errors.push('name debe tener entre 2 y 120 caracteres');
  }

  const email = normalizeEmail(body.email, errors);
  const password = normalizePassword(body.password, errors, { checkStrength: true });

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  return { name, email, password };
}

/** Valida POST /api/auth/login. */
export function validateLogin(body) {
  assertObject(body);

  const errors = [];
  const email = normalizeEmail(body.email, errors);
  const password = normalizePassword(body.password, errors);

  if (errors.length > 0) throw ApiError.badRequest('Datos inválidos', errors);

  return { email, password };
}
