import { Router } from 'express';
import { checkDatabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
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

router.use('/tasks', tasksRouter);

export default router;
