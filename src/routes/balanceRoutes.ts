import { Router } from 'express';
import { getBalanceHandler } from '../controllers/balanceController';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = Router();

// Эндпоинт для получения баланса: итоговый путь будет /api/balance
router.get('/', authenticateToken, getBalanceHandler);

// Эндпоинт для обновления и получения баланса (POST /api/balance, без тела)
router.post('/', authenticateToken, getBalanceHandler);

export default router;
