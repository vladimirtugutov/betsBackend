import { Router } from 'express';
import { getTransactionsHandler } from '../controllers/transactionController';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = Router();

// Эндпоинт для получения истории транзакций пользователя с пагинацией
router.get('/', authenticateToken, getTransactionsHandler);

export default router;
