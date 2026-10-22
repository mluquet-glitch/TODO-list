import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabase, closePool } from './config/db.js';

const server = app.listen(env.port, () => {
  console.log(`[api] Servidor escuchando en http://localhost:${env.port}/api (${env.nodeEnv})`);
});

// Comprobación informativa: la API puede arrancar aunque Postgres esté caído
// y reportarlo en GET /api/health.
checkDatabase().then((ok) => {
  if (!ok) {
    console.warn(
      '[api] Arrancó sin conexión a PostgreSQL. Revisa DATABASE_URL y ejecuta "npm run db:migrate".',
    );
  }
});

/** Apagado ordenado: deja de aceptar requests y cierra el pool. */
async function shutdown(signal) {
  console.log(`\n[api] ${signal} recibido, cerrando servidor...`);
  server.close(async () => {
    try {
      await closePool();
      process.exit(0);
    } catch (error) {
      console.error('[api] Error al cerrar el pool:', error.message);
      process.exit(1);
    }
  });

  // Si algo se queda colgado, forzamos la salida.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[api] Promise rechazada sin manejar:', reason);
});
