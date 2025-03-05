import { Request, Response } from 'express';
import { getTransactionsHandler } from '../src/controllers/transactionController';
import { transactionService } from '../src/services/transactionService';

jest.mock('../src/services/transactionService', () => ({
  transactionService: {
    getTransactions: jest.fn(),
  },
}));

describe('transactionController - getTransactionsHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: { userId: 1 },
      query: {},
    } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('должен возвращать 200 и результат запроса при успешном выполнении', async () => {
    const fakeResult = {
      transactions: [{ id: 1, amount: 100 }],
      page: 2,
      limit: 5,
      total: 10,
    };

    // Передаем параметры через query
    req.query = { page: '2', limit: '5' };

    (transactionService.getTransactions as jest.Mock).mockResolvedValue(fakeResult);

    await getTransactionsHandler(req as Request, res as Response);

    expect(transactionService.getTransactions).toHaveBeenCalledWith(1, 2, 5);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeResult);
  });

  it('должен возвращать 200 с дефолтными значениями при отсутствии query параметров', async () => {
    // По умолчанию page=1, limit=10
    const fakeResult = {
      transactions: [{ id: 1, amount: 100 }],
      page: 1,
      limit: 10,
      total: 5,
    };

    req.query = {}; // пустой объект

    (transactionService.getTransactions as jest.Mock).mockResolvedValue(fakeResult);

    await getTransactionsHandler(req as Request, res as Response);

    expect(transactionService.getTransactions).toHaveBeenCalledWith(1, 1, 10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeResult);
  });

  it('должен возвращать 500 при возникновении ошибки', async () => {
    const error = new Error('Service error');
    (transactionService.getTransactions as jest.Mock).mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getTransactionsHandler(req as Request, res as Response);

    expect(console.error).toHaveBeenCalledWith('Error fetching transactions:', error.message);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });

    consoleErrorSpy.mockRestore();
  });
});