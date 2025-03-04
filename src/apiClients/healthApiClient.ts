import { callExternalAPI } from './externalApiClient';
import dotenv from 'dotenv';

dotenv.config();

export async function checkExternalHealth(): Promise<string> {
  try {
    // Используем userId из переменной окружения для проверки (если требуется)
    const userId = parseInt(process.env.EXTERNAL_API_USER_ID || "0", 10);
    // Тело запроса пустое для health check
    const requestBody = {};
    // Вызываем внешний API по эндпоинту /health с методом GET
    const externalResponse = await callExternalAPI('get', '/health', userId, requestBody);
    return externalResponse.status === 200 ? 'ok' : 'error';
  } catch (error: any) {
    console.error("External API health check failed:", error.message);
    return 'error';
  }
}
