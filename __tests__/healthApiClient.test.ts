jest.mock('axios');
jest.mock('../src/repositories/apiLogRepository', () => ({
  apiLogRepository: {
    createApiLog: jest.fn(),
  },
}));

import axios from 'axios';
import { checkExternalHealth } from '../src/apiClients/healthApiClient';
import { apiLogRepository } from '../src/repositories/apiLogRepository';

describe('checkExternalHealth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Очищаем моки, но сохраняем реализации
    jest.clearAllMocks();
    process.env = { 
      ...originalEnv, 
      EXTERNAL_API: 'https://example.com', 
      SYSTEM_USER_ID: '42'  // для теста используем число 42
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('возвращает "ok" и логирует успешный запрос, если статус 200', async () => {
    const fakeResponse = { data: { status: 'healthy' }, status: 200 };
    (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue(fakeResponse);

    const result = await checkExternalHealth();

    expect(result).toBe('ok');
    expect(axios.get).toHaveBeenCalledWith('https://example.com/health', { headers: { Accept: 'application/json' } });
    expect(apiLogRepository.createApiLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        endpoint: '/health',
        method: 'GET',
        requestBody: {},
        responseBody: fakeResponse.data,
        statusCode: fakeResponse.status,
        ipAddress: 'localhost',
      })
    );
  });

  it('возвращает "error" и логирует, если внешний API возвращает не 200', async () => {
    const fakeResponse = { data: { status: 'unhealthy' }, status: 500 };
    (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue(fakeResponse);

    const result = await checkExternalHealth();

    expect(result).toBe('error');
    expect(apiLogRepository.createApiLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        endpoint: '/health',
        method: 'GET',
        requestBody: {},
        responseBody: fakeResponse.data,
        statusCode: fakeResponse.status,
        ipAddress: 'localhost',
      })
    );
  });

  it('возвращает "error" и логирует, если axios.get выбрасывает ошибку', async () => {
    const fakeError = {
      response: { status: 400, data: { error: 'Bad Request' } },
      message: 'Request failed',
    };
    (axios.get as jest.MockedFunction<typeof axios.get>).mockRejectedValue(fakeError);

    const result = await checkExternalHealth();

    expect(result).toBe('error');
    expect(apiLogRepository.createApiLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        endpoint: '/health',
        method: 'GET',
        requestBody: {},
        responseBody: fakeError.response.data,
        statusCode: fakeError.response.status,
        ipAddress: 'localhost',
      })
    );
  });
});