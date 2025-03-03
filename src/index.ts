import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Middleware для аутентификации (JWT)
const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    // Привязываем данные из токена к запросу
    (req as any).user = decoded;
    next();
  });
};

// Функция для форматирования объекта ставки в snake_case
const formatBet = (bet: any) => ({
  id: String(bet.id),
  amount: bet.amount,
  status: bet.status,
  win_amount: bet.winAmount, // может быть undefined, если ставка ещё не завершена
  created_at: bet.createdAt,
  completed_at: bet.completedAt,
});

/**
 * GET /api/bets
 * Получение истории ставок пользователя
 * Заголовок: Authorization: Bearer {token}
 */
app.get('/api/bets', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const bets = await prisma.bet.findMany({
      where: { userId },
    });
    res.status(200).json({ bets: bets.map(formatBet) });
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/bets/:id
 * Получение информации о конкретной ставке
 * Заголовок: Authorization: Bearer {token}
 */
app.get('/api/bets/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const betId = Number(req.params.id);
    const bet = await prisma.bet.findFirst({
      where: {
        id: betId,
        userId,
      },
    });
    if (!bet) {
      return res.status(404).json({
        statusCode: 404,
        error: "Not Found",
        message: "Bet not found",
      });
    }
    res.status(200).json(formatBet(bet));
  } catch (error) {
    console.error('Error fetching bet:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/bets
 * Размещение новой ставки
 * Заголовок: Authorization: Bearer {token}
 *
 * Тело запроса:
 * {
 *   "amount": 3
 * }
 */
app.post('/api/bets', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { amount } = req.body;
    // Валидация: сумма ставки должна быть от 1 до 5
    if (amount < 1 || amount > 5) {
      return res.status(400).json({
        statusCode: 400,
        error: "Bad Request",
        message: "Invalid bet amount. Must be between 1 and 5.",
      });
    }
    const newBet = await prisma.bet.create({
      data: {
        externalBetId: '', // можно генерировать или оставить пустым
        amount,
        status: 'pending',
        winAmount: 0, // новое поле: начальное значение для winAmount
        user: {
          connect: { id: userId }, // устанавливаем связь с пользователем через connect
        },
      },
    });

    res.status(201).json({
      id: String(newBet.id),
      amount: newBet.amount,
      status: newBet.status,
      created_at: newBet.createdAt,
    });
  } catch (error) {
    console.error('Error creating bet:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/bets/recommended
 * Получение рекомендуемой ставки
 * Заголовок: Authorization: Bearer {token}
 */
app.get('/api/bets/recommended', authenticateToken, (req: Request, res: Response) => {
  // Пример: всегда возвращаем рекомендуемую ставку равную 3
  res.status(200).json({ recommended_amount: 3 });
});



const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
