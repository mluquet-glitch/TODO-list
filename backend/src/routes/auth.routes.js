import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
