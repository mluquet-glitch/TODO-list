import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getClient, closePool } from '../src/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

/**
 * Runner de migraciones minimalista:
 * 1. crea la tabla de control `schema_migrations`;
 * 2. aplica en orden alfabético los .sql pendientes;
 * 3. cada archivo se ejecuta dentro de una transacción.
 */
async function run() {
  const client = await getClient();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[migrate] No hay archivos de migración.');
      return;
    }

    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.name));
    let executed = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] omitida (ya aplicada): ${file}`);
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      console.log(`[migrate] aplicando: ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        executed += 1;
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Falló ${file}: ${error.message}`);
      }
    }

    console.log(
      executed > 0
        ? `[migrate] ${executed} migración(es) aplicada(s).`
        : '[migrate] No hay migraciones pendientes.',
    );
  } finally {
    client.release();
  }
}

run()
  .catch((error) => {
    console.error('[migrate] Error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => closePool());
