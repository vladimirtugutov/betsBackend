import { healthService } from '../src/services/healthService';
import { prisma } from '../src/database/prismaClient';
import { checkExternalHealth } from '../src/apiClients/healthApiClient';

jest.mock('../src/apiClients/healthApiClient');

describe('healthService.getHealthStatus', () => {
  beforeEach(() => {
    // Мокаем запрос к базе данных через prisma.$queryRaw
    prisma.$queryRaw = jest.fn().mockResolvedValue([1]);
  });

  it('should return all services ok when external API and database are ok', async () => {
    (checkExternalHealth as jest.Mock).mockResolvedValue('ok');

    const status = await healthService.getHealthStatus();
    expect(status).toEqual({
      status: "ok",
      timestamp: expect.any(String),
      services: {
        api: "ok",
        database: "ok",
        external_api: "ok",
      },
    });
  });

  it('should report external_api error if external health check fails', async () => {
    (checkExternalHealth as jest.Mock).mockResolvedValue('error');

    const status = await healthService.getHealthStatus();
    expect(status.services.external_api).toBe('error');
  });
});
