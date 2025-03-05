import { Request, Response } from 'express';
import {
  createBetHandler,
  getRecommendedBet,
  getBetHandler,
  getBetsHandler,
} from '../src/controllers/betController';
import { betService } from '../src/services/betService';
import { formatBet } from '../src/utils/formatBet';

jest.mock('../src/services/betService', () => ({
  betService: {
    placeBet: jest.fn(),
    getBet: jest.fn(),
    refreshBet: jest.fn(),
    getBets: jest.fn(),
  },
}));

jest.mock('../src/utils/formatBet', () => ({
  formatBet: jest.fn((bet) => bet),
}));

describe('betController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    // Очищаем все моки, чтобы счетчик вызовов не накапливался между тестами
    jest.clearAllMocks();
    req = { user: { userId: 1 }, body: {}, params: {} } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createBetHandler', () => {
    it('должен вернуть 201 и данные созданной ставки при успешном создании', async () => {
      req.body = { amount: 50 };
      const newBet = {
        id: 123,
        amount: 50,
        status: 'placed',
        createdAt: '2025-03-04T12:00:00Z',
      };
      (betService.placeBet as jest.Mock).mockResolvedValue(newBet);

      await createBetHandler(req as Request, res as Response);

      expect(betService.placeBet).toHaveBeenCalledWith(1, 50);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: String(newBet.id),
        amount: newBet.amount,
        status: newBet.status,
        created_at: newBet.createdAt,
      });
    });

    it('должен вернуть 500 при ошибке создания ставки', async () => {
      req.body = { amount: 50 };
      const error = new Error('Ошибка создания');
      (betService.placeBet as jest.Mock).mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await createBetHandler(req as Request, res as Response);

      expect(console.error).toHaveBeenCalledWith('Error creating bet:', error.message);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getRecommendedBet', () => {
    it('должен вернуть 200 и рекомендованную сумму от 1 до 5', () => {
      getRecommendedBet(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonArg).toHaveProperty('recommended_amount');
      expect(typeof jsonArg.recommended_amount).toBe('number');
      expect(jsonArg.recommended_amount).toBeGreaterThanOrEqual(1);
      expect(jsonArg.recommended_amount).toBeLessThanOrEqual(5);
    });
  });

  describe('getBetHandler', () => {
    beforeEach(() => {
      req.params = { id: '1' };
    });

    it('должен вернуть 200 и форматированную ставку при успешном получении', async () => {
      const bet = {
        id: 1,
        amount: 100,
        status: 'won',
        createdAt: '2025-03-04T12:00:00Z',
      };
      (betService.getBet as jest.Mock).mockResolvedValue(bet);
      (betService.refreshBet as jest.Mock).mockResolvedValue({}); // результат обновления не используется
      // formatBet замокан так, что возвращает тот же объект
      (formatBet as jest.Mock).mockReturnValue(bet);

      await getBetHandler(req as Request, res as Response);

      expect(betService.getBet).toHaveBeenCalledWith(1, 1);
      expect(betService.refreshBet).toHaveBeenCalledWith(1, bet);
      expect(formatBet).toHaveBeenCalledWith(bet);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(bet);
    });

    it('должен вернуть 404, если ставка не найдена', async () => {
      const error = new Error('Bet not found');
      (betService.getBet as jest.Mock).mockRejectedValue(error);
      await getBetHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 404,
        error: "Not Found",
        message: "Bet not found",
      });
    });

    it('должен вернуть 500 при возникновении другой ошибки', async () => {
      const error = new Error('Некоторая другая ошибка');
      (betService.getBet as jest.Mock).mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await getBetHandler(req as Request, res as Response);

      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getBetsHandler', () => {
    it('должен вернуть 200 и список форматированных ставок', async () => {
      const bets = [
        { id: 1, amount: 100, status: 'won', createdAt: '2025-03-04T12:00:00Z' },
        { id: 2, amount: 50, status: 'lost', createdAt: '2025-03-04T12:05:00Z' },
      ];
      (betService.getBets as jest.Mock).mockResolvedValue(bets);
      // Задаем поведение для formatBet, чтобы возвращалось то же значение
      (formatBet as jest.Mock).mockImplementation((bet) => bet);

      await getBetsHandler(req as Request, res as Response);

      expect(betService.getBets).toHaveBeenCalledWith(1);
      // Теперь ожидаем, что formatBet будет вызван ровно столько раз, сколько элементов в массиве
      expect(formatBet).toHaveBeenCalledTimes(bets.length);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ bets });
    });

    it('должен вернуть 500 при ошибке получения ставок', async () => {
      const error = new Error('Ошибка получения ставок');
      (betService.getBets as jest.Mock).mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await getBetsHandler(req as Request, res as Response);

      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });

      consoleErrorSpy.mockRestore();
    });
  });
});