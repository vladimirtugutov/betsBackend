import { Router } from 'express';
import { checkBalanceHandler } from '../controllers/balanceController';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = Router();

// Эндпоинт для проверки корректности баланса (POST /api/check-balance)
router.post('/', authenticateToken, checkBalanceHandler);

export default router;
