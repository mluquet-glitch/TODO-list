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

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

/** Configuración de conexión que entiende `pg.Pool`. */
const dbConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: required('PGHOST'),
      port: Number(process.env.PGPORT ?? 5432),
      user: required('PGUSER'),
      password: required('PGPASSWORD'),
      database: required('PGDATABASE'),
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    };

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  db: dbConfig,
  isProduction: process.env.NODE_ENV === 'production',
};
