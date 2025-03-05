import request from 'supertest';
import express, { Express } from 'express';
import router from '../src/routes/internalRoutes';
import axios from 'axios';

jest.mock('axios');

// Приводим axios к типу jest.Mock для использования mockResolvedValue
const mockedAxios = axios as unknown as jest.Mock;

describe('internalRoutes', () => {
  let app: Express;
  const validAdminToken = 'valid_admin_token';

  beforeAll(() => {
    process.env.ADMIN_TOKEN = validAdminToken;
    process.env.EXTERNAL_API_SECRET_KEY = 'test_secret_key';
    app = express();
    app.use(express.json());
    app.use('/api/internal', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('adminAuth middleware', () => {
    it('should return 401 if no admin token provided', async () => {
      const res = await request(app)
        .post('/api/internal/auth')
        .send({ user_id: '123' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'No admin token provided' });
    });

    it('should return 403 if invalid admin token provided', async () => {
      const res = await request(app)
        .post('/api/internal/auth')
        .set('Authorization', 'Bearer wrong_token')
        .send({ user_id: '123' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Invalid admin token' });
    });
  });

  describe('POST /auth', () => {
    it('should return 400 if user_id is missing', async () => {
      const res = await request(app)
        .post('/api/internal/auth')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'user_id is required' });
    });

    it('should call external API and return success for valid request', async () => {
      mockedAxios.mockResolvedValue({ data: { result: 'external auth ok' } });
      const res = await request(app)
        .post('/api/internal/auth')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, external_response: { result: 'external auth ok' } });
      expect(mockedAxios).toHaveBeenCalled();
    });
  });

  describe('GET /bet', () => {
    it('should return 400 if user_id is missing', async () => {
      const res = await request(app)
        .get('/api/internal/bet')
        .set('Authorization', `Bearer ${validAdminToken}`);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'user_id is required' });
    });

    it('should return success response for valid request via query parameter', async () => {
      mockedAxios.mockResolvedValue({ data: { bet: 'external bet data' } });
      const res = await request(app)
        .get('/api/internal/bet')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .query({ user_id: '123' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, external_response: { bet: 'external bet data' } });
      expect(mockedAxios).toHaveBeenCalled();
    });
  });

  describe('POST /bet', () => {
    it('should return 400 if user_id or bet is missing', async () => {
      const res = await request(app)
        .post('/api/internal/bet')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'user_id and bet are required' });
    });

    it('should return success response for valid request', async () => {
      mockedAxios.mockResolvedValue({ data: { bet: 'placed bet data' } });
      const res = await request(app)
        .post('/api/internal/bet')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123', bet: 10 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, external_response: { bet: 'placed bet data' } });
      expect(mockedAxios).toHaveBeenCalled();
    });
  });

  describe('POST /win', () => {
    it('should return 400 if user_id or bet_id is missing', async () => {
      const res = await request(app)
        .post('/api/internal/win')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'user_id and bet_id are required' });
    });

    it('should return success response for valid win request', async () => {
      mockedAxios.mockResolvedValue({ data: { win: 'win data' } });
      const res = await request(app)
        .post('/api/internal/win')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123', bet_id: '456' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, external_response: { win: 'win data' } });
      expect(mockedAxios).toHaveBeenCalled();
    });
  });

  describe('POST /balance', () => {
    it('should return 400 if user_id is missing', async () => {
      const res = await request(app)
        .post('/api/internal/balance')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'user_id is required' });
    });

    it('should return success response for valid balance update request with balance field', async () => {
      mockedAxios.mockResolvedValue({ data: { balance: 'updated balance' } });
      const res = await request(app)
        .post('/api/internal/balance')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123', balance: 200 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, external_response: { balance: 'updated balance' } });
      expect(mockedAxios).toHaveBeenCalled();
    });

    it('should return success response for valid balance update request without balance field', async () => {
      mockedAxios.mockResolvedValue({ data: { balance: 'default balance' } });
      const res = await request(app)
        .post('/api/internal/balance')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, external_response: { balance: 'default balance' } });
      expect(mockedAxios).toHaveBeenCalled();
    });
  });

  describe('POST /check-balance', () => {
    it('should return 400 if user_id or expected_balance is missing', async () => {
      const res = await request(app)
        .post('/api/internal/check-balance')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'user_id and expected_balance are required' });
    });

    it('should return success response for valid check-balance request', async () => {
      mockedAxios.mockResolvedValue({ data: { check: 'balance ok' } });
      const res = await request(app)
        .post('/api/internal/check-balance')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({ user_id: '123', expected_balance: 100 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, external_response: { check: 'balance ok' } });
      expect(mockedAxios).toHaveBeenCalled();
    });
  });
});