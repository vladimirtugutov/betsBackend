import { Request, Response } from 'express';
import { getHealthHandler } from '../src/controllers/healthController';
import { healthService } from '../src/services/healthService';

jest.mock('../src/services/healthService', () => ({
  healthService: {
    getHealthStatus: jest.fn(),
  },
}));

describe('healthController - getHealthHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('должен возвращать статус 200 и данные health при успешном запросе', async () => {
    const healthData = {
      status: 'ok',
      timestamp: '2025-03-04T12:00:00Z',
      services: {
        api: 'ok',
        database: 'ok',
        external_api: 'ok',
      },
    };

    (healthService.getHealthStatus as jest.Mock).mockResolvedValue(healthData);

    await getHealthHandler(req as Request, res as Response);

    expect(healthService.getHealthStatus).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(healthData);
  });

  it('должен возвращать статус 500 и сообщение об ошибке при исключении', async () => {
    const error = new Error('Service unavailable');
    (healthService.getHealthStatus as jest.Mock).mockRejectedValue(error);

    // Подавляем вывод в консоль для чистоты тестов
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getHealthHandler(req as Request, res as Response);

    expect(healthService.getHealthStatus).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        services: {
          api: 'error',
          database: 'error',
          external_api: 'error',
        },
      })
    );
    // Проверяем, что timestamp является строкой
    const jsonResponse = (res.json as jest.Mock).mock.calls[0][0];
    expect(typeof jsonResponse.timestamp).toBe('string');

    consoleErrorSpy.mockRestore();
  });
});