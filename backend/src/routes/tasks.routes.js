import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller.js';

const router = Router();

router.get('/', tasksController.list);
router.post('/', tasksController.create);
router.get('/:id', tasksController.get);
router.patch('/:id', tasksController.update);
router.delete('/:id', tasksController.remove);

export default router;
