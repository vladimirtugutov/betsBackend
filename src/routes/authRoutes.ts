import { Router } from 'express';
import { loginHandler } from '../controllers/authController';

const router = Router();

// Эндпоинт для аутентификации
router.post('/login', loginHandler);

export default router;
