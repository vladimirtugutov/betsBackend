import { Router } from 'express';
import { authenticateToken } from '../middlewares/authenticateToken';
import { createBetHandler, getBetHandler, getRecommendedBet, getBetsHandler } from '../controllers/betController';

const router = Router();

/**
 * POST /api/bets
 * Заголовок: Authorization: Bearer {token} *
 * Тело запроса:
 * {
 *   "amount": 3
 * }
 */
router.post('/', authenticateToken, createBetHandler);

/**
 * GET /api/bets/recommended
 * Получение рекомендуемой ставки
 * Заголовок: Authorization: Bearer {token}
 */
router.get('/recommended', authenticateToken, getRecommendedBet);

/**
 * GET /api/bets/:id
 * Получение информации о конкретной ставке
 * Заголовок: Authorization: Bearer {token}
 */
router.get('/:id', authenticateToken, getBetHandler);

/**
 * GET /api/bets
 * Получение истории ставок пользователя
 * Заголовок: Authorization: Bearer {token}
 */
router.get('/', authenticateToken, getBetsHandler);

export default router;
