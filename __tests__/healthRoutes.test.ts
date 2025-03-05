import request from 'supertest';
import express from 'express';
import router from '../src/routes/healthRoutes';

jest.mock('../src/controllers/healthController', () => ({
  getHealthHandler: jest.fn((req, res) => res.status(200).json({ status: 'ok' })),
}));

describe('healthRoutes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Роутер монтируется на корневой путь, поскольку healthRoutes экспортируется как роутер с GET '/'
    app.use('/', router);
  });

  it('GET / должен возвращать 200 и объект { status: "ok" }', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});