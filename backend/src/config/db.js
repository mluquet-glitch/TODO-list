import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

/**
 * Pool de conexiones único para toda la aplicación.
 * `pg` reutiliza conexiones, por lo que nunca se debe crear un Pool por request.
 */
export const pool = new Pool({
  ...env.db,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Un cliente inactivo puede fallar (reinicio de Postgres, red, etc.).
// Sin este listener, el evento 'error' del pool tumbaría el proceso.
pool.on('error', (error) => {
  console.error('[db] Error en un cliente inactivo del pool:', error.message);
});

/**
 * Ejecuta una consulta parametrizada.
 * Nunca interpolar valores en el SQL: usar siempre `$1, $2, ...`.
 */
export function query(text, params = []) {
  return pool.query(text, params);
}

/** Obtiene un cliente para transacciones manuales (recordar `release()`). */
export function getClient() {
  return pool.connect();
}

/** Comprueba la conectividad con PostgreSQL. Devuelve true/false. */
export async function checkDatabase() {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('[db] Sin conexión a PostgreSQL:', error.message);
    return false;
  }
}

/** Cierra el pool durante el apagado ordenado. */
export function closePool() {
  return pool.end();
}
