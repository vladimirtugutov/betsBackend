import { Request, Response } from 'express';
import { loginHandler } from '../src/controllers/authController';
import { authService } from '../src/services/authService';

jest.mock('../src/services/authService', () => ({
  authService: {
    login: jest.fn(),
  },
}));

describe('authController - loginHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { body: { username: 'john' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('возвращает 200 и результат успешного логина', async () => {
    const loginResult = { token: 'abc123' };
    (authService.login as jest.Mock).mockResolvedValue(loginResult);

    await loginHandler(req as Request, res as Response);

    expect(authService.login).toHaveBeenCalledWith('john');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(loginResult);
  });

  it('возвращает 404, если пользователь не найден', async () => {
    const error = new Error('User not found');
    (authService.login as jest.Mock).mockRejectedValue(error);

    await loginHandler(req as Request, res as Response);

    expect(authService.login).toHaveBeenCalledWith('john');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 404,
      error: "Not Found",
      message: "User not found",
    });
  });

  it('возвращает 500 для других ошибок', async () => {
    const error = new Error('Some other error');
    (authService.login as jest.Mock).mockRejectedValue(error);

    // Подавляем вывод console.error в тесте
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await loginHandler(req as Request, res as Response);

    expect(authService.login).toHaveBeenCalledWith('john');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Ошибка при выполнении запроса",
    });

    consoleErrorSpy.mockRestore();
  });
});