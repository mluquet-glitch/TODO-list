import { Router } from 'express';
import { emocionesController } from '../controllers/emociones.controller.js';

const router = Router();

router.get('/', emocionesController.list);
router.post('/', emocionesController.create);
router.patch('/:id', emocionesController.update);
router.delete('/:id', emocionesController.remove);

export default router;
