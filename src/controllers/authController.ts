import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const loginHandler = async (req: Request, res: Response) => {
  const { username } = req.body;
  try {
    const result = await authService.login(username);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }
    console.error("Ошибка аутентификации:", error);
    return res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Ошибка при выполнении запроса",
    });
  }
};
