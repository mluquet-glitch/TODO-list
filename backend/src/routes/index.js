import { Router } from 'express';
import { checkDatabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import authRouter from './auth.routes.js';
import categoriesRouter from './categories.routes.js';
import ejecucionesRouter from './ejecuciones.routes.js';
import protocolosRouter from './protocolos.routes.js';
import tasksRouter from './tasks.routes.js';

const router = Router();
const startedAt = Date.now();

/** GET /api/health — estado del proceso y de la conexión a PostgreSQL. */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const databaseUp = await checkDatabase();
    res.status(databaseUp ? 200 : 503).json({
      status: databaseUp ? 'ok' : 'degraded',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      database: databaseUp ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    });
  }),
);

router.use('/auth', authRouter);

// Catálogo compartido de categorías (requiere sesión).
router.use('/categories', requireAuth, categoriesRouter);

// Todas las rutas de tareas exigen un access token válido.
router.use('/tasks', requireAuth, tasksRouter);

// Protocolos con sus pasos y ejecuciones.
router.use('/protocolos', requireAuth, protocolosRouter);
router.use('/ejecuciones', requireAuth, ejecucionesRouter);

export default router;
