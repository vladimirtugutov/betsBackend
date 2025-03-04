import { Router } from 'express';
import { getBalanceHandler } from '../controllers/balanceController';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = Router();

// Эндпоинт для получения баланса: итоговый путь будет /api/balance
router.get('/', authenticateToken, getBalanceHandler);

export default router;
