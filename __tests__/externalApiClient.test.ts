jest.mock('axios');
jest.mock('../src/database/prismaClient', () => ({
  prisma: {
    externalApiAccount: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock('../src/repositories/apiLogRepository', () => ({
  apiLogRepository: {
    createApiLog: jest.fn(),
  },
}));
jest.mock('../src/utils/signature', () => ({
  createSignature: jest.fn(() => 'test-signature'),
}));

import axios from 'axios';
import { callExternalAPI, resetCircuitBreaker } from '../src/apiClients/externalApiClient';
import { prisma } from '../src/database/prismaClient';
import { apiLogRepository } from '../src/repositories/apiLogRepository';
import * as signatureUtils from '../src/utils/signature';

describe('callExternalAPI', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    resetCircuitBreaker();
    process.env = { ...originalEnv, EXTERNAL_API: 'https://example.com' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('успешно вызывает внешний API и логирует успешный запрос', async () => {
    const fakeAccount = { secretKey: 'secret', externalId: 'user123' };
    (prisma.externalApiAccount.findUnique as jest.Mock).mockResolvedValue(fakeAccount);

    const fakeResponse = { data: { result: 'success' }, status: 200 };
    (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(fakeResponse);

    const method: 'get' = 'get';
    const endpoint = '/test-endpoint';
    const userId = 1;
    const body = { param: 'value' };

    const response = await callExternalAPI(method, endpoint, userId, body);

    expect(response).toEqual(fakeResponse);
    expect(prisma.externalApiAccount.findUnique).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(signatureUtils.createSignature).toHaveBeenCalledWith(body, fakeAccount.secretKey);
    expect(axios).toHaveBeenCalledWith({
      method,
      url: `${process.env.EXTERNAL_API}${endpoint}`,
      headers: {
        'user-id': fakeAccount.externalId,
        'x-signature': 'test-signature',
        'Content-Type': 'application/json',
      },
      data: body,
    });
    expect(apiLogRepository.createApiLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        endpoint,
        method,
        requestBody: body,
        responseBody: fakeResponse.data,
        statusCode: fakeResponse.status,
        ipAddress: 'localhost',
      })
    );
  });

  it('логирует ошибку и пробрасывает исключение, если axios завершается неудачно', async () => {
    const fakeAccount = { secretKey: 'secret', externalId: 'user123' };
    (prisma.externalApiAccount.findUnique as jest.Mock).mockResolvedValue(fakeAccount);

    const errorResponse = {
      response: { status: 400, data: { error: 'bad request' } },
      message: 'Axios error',
    };
    (axios as jest.MockedFunction<typeof axios>).mockRejectedValue(errorResponse);

    const method: 'post' = 'post';
    const endpoint = '/test-endpoint';
    const userId = 2;
    const body = { param: 'value' };

    await expect(callExternalAPI(method, endpoint, userId, body)).rejects.toEqual(errorResponse);

    expect(prisma.externalApiAccount.findUnique).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(apiLogRepository.createApiLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        endpoint,
        method,
        requestBody: body,
        responseBody: errorResponse.response.data,
        statusCode: errorResponse.response.status,
        ipAddress: 'localhost',
      })
    );
  });

  it('выбрасывает ошибку, если внешний аккаунт не найден', async () => {
    (prisma.externalApiAccount.findUnique as jest.Mock).mockResolvedValue(null);

    const method: 'get' = 'get';
    const endpoint = '/test-endpoint';
    const userId = 3;
    const body = null;

    await expect(callExternalAPI(method, endpoint, userId, body)).rejects.toThrow(
      'External API account not found for user.'
    );

    expect(prisma.externalApiAccount.findUnique).toHaveBeenCalledWith({
      where: { userId },
    });
    // Логирование не происходит, так как исключение выбрасывается до вызова axios
    expect(apiLogRepository.createApiLog).not.toHaveBeenCalled();
  });
});