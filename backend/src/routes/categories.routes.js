import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller.js';

const router = Router();

router.get('/', categoriesController.list);

export default router;
