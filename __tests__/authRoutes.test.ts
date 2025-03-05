import request from 'supertest';
import express from 'express';
import router from '../src/routes/authRoutes';
import { loginHandler } from '../src/controllers/authController';

// Мокаем loginHandler, чтобы возвращать фиксированный ответ
jest.mock('../src/controllers/authController', () => ({
  loginHandler: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

describe('authRoutes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', router);
  });

  it('should call loginHandler on POST /login', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser' });
      
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(loginHandler).toHaveBeenCalled();
  });
});