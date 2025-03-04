import { Request, Response } from 'express';
import { balanceService } from '../services/balanceService';

export const getBalanceHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const balanceData = await balanceService.getBalance(userId);
    res.status(200).json(balanceData);
  } catch (error: any) {
    console.error("Error fetching balance:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const checkBalanceHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await balanceService.checkBalance(userId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error checking balance:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
