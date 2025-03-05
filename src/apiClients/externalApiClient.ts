import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { createSignature } from '../utils/signature';
import { prisma } from '../database/prismaClient';
import dotenv from 'dotenv';
import { apiLogRepository } from '../repositories/apiLogRepository';

dotenv.config();

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // начальная задержка в миллисекундах

export async function callExternalAPI(
  method: 'get' | 'post',
  endpoint: string,
  userId: number,
  body: Record<string, any> | null = null
): Promise<AxiosResponse<any>> {
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
  
  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      'user-id': externalUserId,
      'x-signature': signature,
      'Content-Type': 'application/json',
    },
    data: body,
  };

  let attempt = 0;
  let lastError: any;
  const startTime = Date.now();

  while (attempt < MAX_RETRIES) {
    try {
      const response = await axios(config);
      const endTime = Date.now();
      const duration = endTime - startTime;
      // Логируем успешный запрос
      await apiLogRepository.createApiLog({
        userId,
        endpoint,
        method,
        requestBody: body,
        responseBody: response.data,
        statusCode: response.status,
        requestDuration: duration,
        ipAddress: 'localhost',
      });
      return response;
    } catch (error: any) {
      attempt++;
      lastError = error;
      if (attempt >= MAX_RETRIES) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        await apiLogRepository.createApiLog({
          userId,
          endpoint,
          method,
          requestBody: body,
          responseBody: error.response?.data || { message: error.message },
          statusCode: error.response?.status || 500,
          requestDuration: duration,
          ipAddress: 'localhost',
        });
        throw error;
      }
      // Задержка перед следующей попыткой (экспоненциальный backoff)
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}