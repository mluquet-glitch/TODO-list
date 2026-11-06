import { Router } from 'express';
import { ejecucionesController } from '../controllers/ejecuciones.controller.js';

const router = Router();

router.get('/', ejecucionesController.list);
router.post('/', ejecucionesController.create);
router.get('/:id', ejecucionesController.get);
router.delete('/:id', ejecucionesController.remove);

export default router;
