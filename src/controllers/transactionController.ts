import { Request, Response } from 'express';
import { transactionService } from '../services/transactionService';

export const getTransactionsHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await transactionService.getTransactions(userId, page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
