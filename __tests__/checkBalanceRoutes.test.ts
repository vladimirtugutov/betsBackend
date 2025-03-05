import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import router from '../src/routes/checkBalanceRoutes';

// Мокаем authenticateToken, чтобы он просто передавал управление дальше
jest.mock('../src/middlewares/authenticateToken', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => next(),
}));

// Мокаем checkBalanceHandler, чтобы возвращать фиксированный ответ
jest.mock('../src/controllers/balanceController', () => ({
  checkBalanceHandler: jest.fn((req: Request, res: Response) =>
    res.status(200).json({ check: true })
  ),
}));

describe('checkBalanceRoutes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Роутер монтируется на /api/check-balance
    app.use('/api/check-balance', router);
  });

  it('POST /api/check-balance должен возвращать 200 и { check: true }', async () => {
    const response = await request(app)
      .post('/api/check-balance')
      .set('Authorization', 'Bearer validtoken');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ check: true });
  });
});