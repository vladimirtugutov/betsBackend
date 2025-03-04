import axios from 'axios';
import { createSignature } from '../utils/signature';
import { prisma } from '../database/prismaClient';
import dotenv from 'dotenv';
import { apiLogRepository } from '../repositories/apiLogRepository';

dotenv.config();

export async function callExternalAPI(
  method: 'get' | 'post',
  endpoint: string,
  userId: number,
  body: Record<string, any> | null = null
) {
  // Получаем externalId и secretKey из базы
  const externalAccount = await prisma.externalApiAccount.findUnique({
    where: { userId },
  });
  if (!externalAccount) {
    throw new Error('External API account not found for user.');
  }

  const secretKey = externalAccount.secretKey;
  const externalUserId = externalAccount.externalId || '';

  // Создаем подпись
  const signature = createSignature(body, secretKey);
  const url = `${process.env.EXTERNAL_API}${endpoint}`;

  // Подготовка конфигурации запроса
  const config = {
    method,
    url,
    headers: {
      'user-id': externalUserId,
      'x-signature': signature,
      'Content-Type': 'application/json',
    },
    data: body,
  };

  // Фиксируем время начала
  const startTime = performance.now();

  try {
    const response = await axios(config);
    const endTime = performance.now();

    // Создаём лог об успешном запросе
    await apiLogRepository.createApiLog({
      userId,
      endpoint,
      method,
      requestBody: body,
      responseBody: response.data,
      statusCode: response.status,
      requestDuration: Math.floor(endTime - startTime),
      ipAddress: 'localhost', // или другой IP, если нужно
    });

    return response;
  } catch (error: any) {
    const endTime = performance.now();

    // Если у error есть поле response, то это ошибка axios с кодом и телом ответа
    const statusCode = error.response?.status ?? 500;
    const responseBody = error.response?.data ?? { error: error.message };

    // Создаём лог об ошибочном запросе
    await apiLogRepository.createApiLog({
      userId,
      endpoint,
      method,
      requestBody: body,
      responseBody,
      statusCode,
      requestDuration: Math.floor(endTime - startTime),
      ipAddress: 'localhost',
    });

    throw error; // Пробрасываем ошибку выше, чтобы её обработал сервис
  }
}
