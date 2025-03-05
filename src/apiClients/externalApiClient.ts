import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { createSignature } from '../utils/signature';
import { prisma } from '../database/prismaClient';
import dotenv from 'dotenv';
import { apiLogRepository } from '../repositories/apiLogRepository';
import { performance } from 'perf_hooks';

dotenv.config();

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // начальная задержка в мс
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 секунд

// Простой circuit breaker
let circuitBreakerOpen = false;
let circuitBreakerOpenTime = 0;

export async function callExternalAPI(
  method: 'get' | 'post',
  endpoint: string,
  userId: number,
  body: Record<string, any> | null = null
): Promise<AxiosResponse<any>> {
  // Circuit Breaker: если цепь открыта, и таймаут ещё не прошёл – сразу выбрасываем ошибку.
  if (circuitBreakerOpen) {
    const now = Date.now();
    if (now - circuitBreakerOpenTime < CIRCUIT_BREAKER_TIMEOUT) {
      throw new Error('Circuit breaker open: external API is unavailable');
    } else {
      circuitBreakerOpen = false; // сбрасываем, если таймаут прошёл
    }
  }

  // Получаем externalId и secretKey из базы
  const externalAccount = await prisma.externalApiAccount.findUnique({
    where: { userId },
  });
  if (!externalAccount) {
    throw new Error('External API account not found for user.');
  }

  const secretKey = externalAccount.secretKey;
  const externalUserId = externalAccount.externalId || '';

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
  const startTime = performance.now();

  while (attempt < MAX_RETRIES) {
    try {
      const response = await axios(config);
      const endTime = performance.now();
      const duration = Math.floor(endTime - startTime);
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
      // Если ошибка 4xx (не 429), повторные попытки не выполняем
      const status = error.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        break;
      }
      if (attempt >= MAX_RETRIES) {
        break;
      }
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Если не удалось выполнить запрос, открываем circuit breaker
  circuitBreakerOpen = true;
  circuitBreakerOpenTime = Date.now();
  const endTime = performance.now();
  const duration = Math.floor(endTime - startTime);
  await apiLogRepository.createApiLog({
    userId,
    endpoint,
    method,
    requestBody: body,
    responseBody: lastError.response?.data || { message: lastError.message },
    statusCode: lastError.response?.status || 500,
    requestDuration: duration,
    ipAddress: 'localhost',
  });
  throw lastError;
}

// Для тестирования: функция сброса состояния circuit breaker
export function resetCircuitBreaker(): void {
  circuitBreakerOpen = false;
  circuitBreakerOpenTime = 0;
}
