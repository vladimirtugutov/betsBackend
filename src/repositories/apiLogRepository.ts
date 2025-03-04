import { prisma } from '../database/prismaClient';

interface CreateApiLogParams {
  userId: number;
  endpoint: string;
  method: string;
  requestBody: any;
  responseBody: any;
  statusCode: number;
  requestDuration: number;
  ipAddress: string;
}

export const apiLogRepository = {
  async createApiLog(params: CreateApiLogParams) {
    return prisma.apiLog.create({
      data: {
        userId: params.userId,
        endpoint: params.endpoint,
        method: params.method,
        requestBody: params.requestBody,
        responseBody: params.responseBody,
        statusCode: params.statusCode,
        requestDuration: params.requestDuration,
        ipAddress: params.ipAddress,
      },
    });
  },
};
