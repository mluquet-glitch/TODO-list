import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getClient, closePool } from '../src/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.join(__dirname, '..', 'db', 'seeds');

/**
 * Carga los .sql de `db/seeds` en orden alfabético.
 * Los seeds deben ser idempotentes para poder ejecutarlos varias veces.
 */
async function run() {
  const client = await getClient();

  try {
    const files = (await readdir(seedsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[seed] No hay archivos de seed.');
      return;
    }

    for (const file of files) {
      const sql = await readFile(path.join(seedsDir, file), 'utf8');
      console.log(`[seed] ejecutando: ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Falló ${file}: ${error.message}`);
      }
    }

    console.log('[seed] Datos de ejemplo cargados.');
  } finally {
    client.release();
  }
}

run()
  .catch((error) => {
    console.error('[seed] Error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => closePool());
