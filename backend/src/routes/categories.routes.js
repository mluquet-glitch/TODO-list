import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller.js';

const router = Router();

router.get('/', categoriesController.list);
router.post('/', categoriesController.create);
router.patch('/:id', categoriesController.update);
router.delete('/:id', categoriesController.remove);

export default router;
