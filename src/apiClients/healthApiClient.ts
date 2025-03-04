import axios from 'axios';
import dotenv from 'dotenv';
import { createSignature } from '../utils/signature';
import { apiLogRepository } from '../repositories/apiLogRepository';

dotenv.config();

export async function checkExternalHealth(): Promise<string> {
  const url = `${process.env.EXTERNAL_API}/health`;
  const headers = {
    Accept: 'application/json',
  };
  const requestBody = {}; // пустое тело запроса
  const startTime = Date.now();

  // Используем системный userId из .env или дефолтное значение (например, 1)
  const systemUserId = parseInt(process.env.SYSTEM_USER_ID || '1', 10);
  console.log('systemUserId', systemUserId);
  

  try {
    const externalResponse = await axios.get(url, { headers });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Логируем успешный запрос в базу
    await apiLogRepository.createApiLog({
      userId: systemUserId,
      endpoint: '/health',
      method: 'GET',
      requestBody: requestBody,
      responseBody: externalResponse.data,
      statusCode: externalResponse.status,
      requestDuration: duration,
      ipAddress: 'localhost',
    });
    
    console.log('External API health response:', externalResponse.data);
    return externalResponse.status === 200 ? 'ok' : 'error';
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = error.response?.status || 500;
    const responseBody = error.response?.data || { message: error.message };
    
    // Логируем ошибку в базу
    await apiLogRepository.createApiLog({
      userId: systemUserId,
      endpoint: '/health',
      method: 'GET',
      requestBody: requestBody,
      responseBody,
      statusCode,
      requestDuration: duration,
      ipAddress: 'localhost',
    });
    
    console.error("External API health check failed:", error.message);
    return 'error';
  }
}
