// Middleware для аутентификации (JWT)
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken: RequestHandler = (req, res, next) => {
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