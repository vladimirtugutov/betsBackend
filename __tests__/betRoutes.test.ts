import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import router from '../src/routes/betRoutes';

// Мокаем authenticateToken, чтобы он просто передавал управление дальше
jest.mock('../src/middlewares/authenticateToken', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => next(),
}));

// Мокаем контроллеры, возвращающие фиктивные ответы
jest.mock('../src/controllers/betController', () => ({
  createBetHandler: jest.fn((req: Request, res: Response) =>
    res.status(201).json({ message: 'bet created' })
  ),
  getRecommendedBet: jest.fn((req: Request, res: Response) =>
    res.status(200).json({ recommended: 3 })
  ),
  getBetHandler: jest.fn((req: Request, res: Response) =>
    res.status(200).json({ bet: { id: req.params.id, amount: 50 } })
  ),
  getBetsHandler: jest.fn((req: Request, res: Response) =>
    res.status(200).json({ bets: [{ id: 1, amount: 100 }, { id: 2, amount: 50 }] })
  ),
}));

describe('betRoutes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Роутер монтируется на /api/bets
    app.use('/api/bets', router);
  });

  describe('POST /api/bets', () => {
    it('должен вызывать createBetHandler и возвращать 201 с сообщением "bet created"', async () => {
      const response = await request(app)
        .post('/api/bets')
        .set('Authorization', 'Bearer validtoken')
        .send({ amount: 3 });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'bet created' });
    });
  });

  describe('GET /api/bets/recommended', () => {
    it('должен вызывать getRecommendedBet и возвращать 200 с рекомендованной ставкой', async () => {
      const response = await request(app)
        .get('/api/bets/recommended')
        .set('Authorization', 'Bearer validtoken');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ recommended: 3 });
    });
  });

  describe('GET /api/bets/:id', () => {
    it('должен вызывать getBetHandler и возвращать 200 с данными ставки', async () => {
      const betId = 42;
      const response = await request(app)
        .get(`/api/bets/${betId}`)
        .set('Authorization', 'Bearer validtoken');
      expect(response.status).toBe(200);
      // Ответ контроллера зависит от параметра :id, который используется в моке
      expect(response.body).toEqual({ bet: { id: String(betId), amount: 50 } });
    });
  });

  describe('GET /api/bets', () => {
    it('должен вызывать getBetsHandler и возвращать 200 с историей ставок', async () => {
      const response = await request(app)
        .get('/api/bets')
        .set('Authorization', 'Bearer validtoken');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        bets: [
          { id: 1, amount: 100 },
          { id: 2, amount: 50 },
        ],
      });
    });
  });
});