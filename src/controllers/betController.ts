import { Request, Response } from 'express';
import { betService } from '../services/betService';
import { formatBet } from '../utils/formatBet';

export async function createBetHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { amount } = req.body;

    const newBet = await betService.placeBet(userId, amount);

    res.status(201).json({
      id: String(newBet.id),
      amount: newBet.amount,
      status: newBet.status,
      created_at: newBet.createdAt,
    });
  } catch (error: any) {
    console.error('Error creating bet:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getRecommendedBet = (req: Request, res: Response) => {
  const recommended_amount = Math.floor(Math.random() * 5) + 1;
  res.status(200).json({ recommended_amount });
};

export const getBetHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const betId = Number(req.params.id);
    
    // Получаем ставку из локальной базы
    const bet = await betService.getBet(userId, betId);

    // Надо обновить данные ставки (через внешнее API)
    const refreshedBet = await betService.refreshBet(userId, bet);
    
    res.status(200).json(formatBet(bet));
  } catch (error: any) {
    if (error.message === 'Bet not found') {
      return res.status(404).json({
        statusCode: 404,
        error: "Not Found",
        message: "Bet not found",
      });
    }
    console.error('Error fetching bet:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getBetsHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    // Получаем актуальные данные ставок через сервис
    const bets = await betService.getBets(userId);
    res.status(200).json({ bets: bets.map(formatBet) });
  } catch (error: any) {
    console.error('Error fetching bets:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
