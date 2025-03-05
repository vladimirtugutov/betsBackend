import { Request, Response } from 'express';
import { getBalanceHandler, checkBalanceHandler } from '../src/controllers/balanceController';
import { balanceService } from '../src/services/balanceService';

jest.mock('../src/services/balanceService', () => ({
  balanceService: {
    getBalance: jest.fn(),
    checkBalance: jest.fn(),
  },
}));

describe('balanceController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { user: { userId: 1 } } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getBalanceHandler', () => {
    it('возвращает 200 и данные баланса при успешном вызове', async () => {
      const balanceData = { balance: 100 };
      (balanceService.getBalance as jest.Mock).mockResolvedValue(balanceData);

      await getBalanceHandler(req as Request, res as Response);

      expect(balanceService.getBalance).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(balanceData);
    });

    it('возвращает 500 при возникновении ошибки', async () => {
      const error = new Error('Ошибка получения баланса');
      (balanceService.getBalance as jest.Mock).mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await getBalanceHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkBalanceHandler', () => {
    it('возвращает 200 и результат проверки баланса при успешном вызове', async () => {
      const result = { check: true };
      (balanceService.checkBalance as jest.Mock).mockResolvedValue(result);

      await checkBalanceHandler(req as Request, res as Response);

      expect(balanceService.checkBalance).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('возвращает 500 при возникновении ошибки', async () => {
      const error = new Error('Ошибка проверки баланса');
      (balanceService.checkBalance as jest.Mock).mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await checkBalanceHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
      
      consoleErrorSpy.mockRestore();
    });
  });
});