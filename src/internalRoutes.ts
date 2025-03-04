import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { createSignature } from './utils/signature';

const router = Router();

/**
 * Middleware для проверки admin-токена.
 */
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No admin token provided' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Invalid admin token' });
  }
  next();
};

/**
 * Вспомогательная функция для вызова внешнего API для конкретного user_id.
 */
async function callExternalAPIForUser(
  userId: string,
  method: 'get' | 'post',
  endpoint: string,
  body: Record<string, any> | null = null
) {
  const secretKey = process.env.EXTERNAL_API_SECRET_KEY || 'your_secret_key_here';
  const signature = createSignature(body, secretKey);
  const url = `https://bet-provider.coolify.tgapps.cloud/api${endpoint}`;
  const config = {
    method,
    url,
    headers: {
      'user-id': userId,
      'x-signature': signature,
      'Content-Type': 'application/json',
    },
    data: body,
  };
  return axios(config);
}

/**
 * POST /api/internal/auth
 */
router.post('/auth', adminAuth, async (req: Request, res: Response) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const response = await callExternalAPIForUser(user_id, 'post', '/auth', {});
    res.status(200).json({ success: true, external_response: response.data });
  } catch (error: any) {
    console.error("Internal auth error:", error.message);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

/**
 * GET /api/internal/bet
 */
router.get('/bet', adminAuth, async (req: Request, res: Response) => {
  const user_id = req.body.user_id || req.query.user_id;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const response = await callExternalAPIForUser(String(user_id), 'get', '/bet', {});
    res.status(200).json({ success: true, external_response: response.data });
  } catch (error: any) {
    console.error("Internal get bet error:", error.message);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

/**
 * POST /api/internal/bet
 */
router.post('/bet', adminAuth, async (req: Request, res: Response) => {
  const { user_id, bet } = req.body;
  if (!user_id || bet == null) {
    return res.status(400).json({ error: 'user_id and bet are required' });
  }
  try {
    const response = await callExternalAPIForUser(user_id, 'post', '/bet', { bet });
    res.status(200).json({ success: true, external_response: response.data });
  } catch (error: any) {
    console.error("Internal place bet error:", error.message);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

/**
 * POST /api/internal/win
 */
router.post('/win', adminAuth, async (req: Request, res: Response) => {
  const { user_id, bet_id } = req.body;
  if (!user_id || !bet_id) {
    return res.status(400).json({ error: 'user_id and bet_id are required' });
  }
  try {
    const response = await callExternalAPIForUser(user_id, 'post', '/win', { bet_id });
    res.status(200).json({ success: true, external_response: response.data });
  } catch (error: any) {
    console.error("Internal win error:", error.message);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

/**
 * POST /api/internal/balance
 */
router.post('/balance', adminAuth, async (req: Request, res: Response) => {
  const { user_id, balance } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const body = balance !== undefined ? { balance } : {};
    const response = await callExternalAPIForUser(user_id, 'post', '/balance', body);
    res.status(200).json({ success: true, external_response: response.data });
  } catch (error: any) {
    console.error("Internal balance error:", error.message);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

/**
 * POST /api/internal/check-balance
 */
router.post('/check-balance', adminAuth, async (req: Request, res: Response) => {
  const { user_id, expected_balance } = req.body;
  if (!user_id || expected_balance == null) {
    return res.status(400).json({ error: 'user_id and expected_balance are required' });
  }
  try {
    const response = await callExternalAPIForUser(user_id, 'post', '/check-balance', { expected_balance });
    res.status(200).json({ success: true, external_response: response.data });
  } catch (error: any) {
    console.error("Internal check balance error:", error.message);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

export default router;
