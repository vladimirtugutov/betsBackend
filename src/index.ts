import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import dotenv from 'dotenv';
import internalRoutes from './internalRoutes';
import betRoutes from './routes/betRoutes';
import balanceRoutes from './routes/balanceRoutes';
import checkBalanceRoutes from './routes/checkBalanceRoutes';
import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import healthRoutes from './routes/healthRoutes';

dotenv.config();

const app = express();

app.use(express.json());

app.use('/api/internal', internalRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/check-balance', checkBalanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/health', healthRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
