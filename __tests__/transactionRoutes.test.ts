import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import router from '../src/routes/transactionRoutes';

// Мокаем middleware authenticateToken, чтобы он просто вызывал next()
jest.mock('../src/middlewares/authenticateToken', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => next(),
}));

// Мокаем getTransactionsHandler, чтобы возвращать фиктивный ответ
jest.mock('../src/controllers/transactionController', () => ({
  getTransactionsHandler: jest.fn((req: Request, res: Response) =>
    res.status(200).json({
      transactions: [{ id: 1, amount: 100, page: 1, limit: 10, total: 1 }],
    })
  ),
}));

describe('transactionRoutes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Роутер монтируется на /api/transactions
    app.use('/api/transactions', router);
  });

  it('GET /api/transactions должен возвращать историю транзакций', async () => {
    const response = await request(app)
      .get('/api/transactions')
      .set('Authorization', 'Bearer validtoken')
      .query({ page: '1', limit: '10' });
      
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      transactions: [{ id: 1, amount: 100, page: 1, limit: 10, total: 1 }],
    });
  });
});