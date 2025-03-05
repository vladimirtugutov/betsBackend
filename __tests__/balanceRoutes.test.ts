import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import router from '../src/routes/balanceRoutes';

// Мокаем authenticateToken, чтобы он просто вызывал next()
jest.mock('../src/middlewares/authenticateToken', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => next(),
}));

// Мокаем getBalanceHandler, чтобы возвращать фиксированный ответ
jest.mock('../src/controllers/balanceController', () => ({
  getBalanceHandler: jest.fn((req: Request, res: Response) => res.status(200).json({ balance: 100 })),
}));

describe('balanceRoutes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Роутер монтируется на /api/balance
    app.use('/api/balance', router);
  });

  it('GET /api/balance должен возвращать баланс', async () => {
    const response = await request(app).get('/api/balance');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ balance: 100 });
  });

  it('POST /api/balance должен возвращать баланс', async () => {
    const response = await request(app).post('/api/balance');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ balance: 100 });
  });
});