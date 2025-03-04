import { checkExternalHealth } from '../apiClients/healthApiClient';
import { prisma } from '../database/prismaClient';

export const healthService = {
  async getHealthStatus() {
    // Локальная проверка базы: пример проверки — попробуем выполнить запрос
    let databaseStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("Database health check failed:", error);
      databaseStatus = 'error';
    }
    
    // Проверка внешнего API
    const externalStatus = await checkExternalHealth();
    
    // Формируем итоговый объект состояния
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        api: "ok",         // наш сервис работает
        database: databaseStatus,
        external_api: externalStatus,
      },
    };
  },
};
