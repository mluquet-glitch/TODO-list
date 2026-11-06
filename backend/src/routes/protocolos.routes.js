import { Router } from 'express';
import { protocolosController } from '../controllers/protocolos.controller.js';

const router = Router();

router.get('/', protocolosController.list);
router.post('/', protocolosController.create);
router.get('/:id', protocolosController.get);
router.patch('/:id', protocolosController.update);
router.delete('/:id', protocolosController.remove);

// Pasos anidados dentro de un protocolo.
router.post('/:protocoloId/pasos', protocolosController.createPaso);
router.patch('/:protocoloId/pasos/:pasoId', protocolosController.updatePaso);
router.delete('/:protocoloId/pasos/:pasoId', protocolosController.removePaso);

export default router;
