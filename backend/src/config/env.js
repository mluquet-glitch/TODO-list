import 'dotenv/config';

/**
 * Lee una variable de entorno obligatoria.
 * Falla al arrancar (fail fast) en lugar de dejar el error para el primer request.
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
}

function toBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return value === 'true';
}

const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

/** Configuración de conexión que entiende `pg.Pool`. */
const dbConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: required('PGHOST'),
      port: Number(process.env.PGPORT ?? 5432),
      user: required('PGUSER'),
      password: required('PGPASSWORD'),
      database: required('PGDATABASE'),
      ssl: { rejectUnauthorized: false },
    };

const DEV_JWT_SECRET = 'dev-only-insecure-secret-change-me-in-production-32-chars';

const accessSecret = process.env.JWT_ACCESS_SECRET ?? DEV_JWT_SECRET;

if (accessSecret.length < 32) {
  throw new Error('JWT_ACCESS_SECRET debe tener al menos 32 caracteres');
}

if (isProduction && accessSecret === DEV_JWT_SECRET) {
  throw new Error('Define JWT_ACCESS_SECRET (≥32 caracteres) antes de arrancar en producción');
}

if (!isProduction && accessSecret === DEV_JWT_SECRET) {
  console.warn('[env] Usando JWT_ACCESS_SECRET de desarrollo. No usar en producción.');
}

const refreshExpiresDays = Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7);
if (!Number.isFinite(refreshExpiresDays) || refreshExpiresDays <= 0) {
  throw new Error('JWT_REFRESH_EXPIRES_DAYS debe ser un número mayor que 0');
}

const cookieSameSite = process.env.COOKIE_SAMESITE ?? 'lax';
if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
  throw new Error("COOKIE_SAMESITE debe ser 'lax', 'strict' o 'none'");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  db: dbConfig,
  isProduction,
  jwt: {
    accessSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresDays,
  },
  cookies: {
    name: 'refresh_token',
    sameSite: cookieSameSite,
    // SameSite=None exige Secure sí o sí.
    secure: toBoolean(process.env.COOKIE_SECURE, isProduction),
    maxAgeMs: refreshExpiresDays * 24 * 60 * 60 * 1000,
  },
};

console.log('[cors] CORS_ORIGIN configurado:', env.corsOrigin);
console.log('[ssl] PGSSL configurado:', process.env.PGSSL, '-> ssl activado:', env.db.ssl !== false);
