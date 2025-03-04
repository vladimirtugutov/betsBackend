import { callExternalAPI } from '../apiClients/externalApiClient';
import { balanceRepository } from '../repositories/balanceRepository';

export const balanceService = {
  async getBalance(userId: number) {
    const requestBody = {};
    const externalResponse = await callExternalAPI('post', '/balance', userId, requestBody);
    
    const externalData = externalResponse.data;
    // Пробуем преобразовать last_updated в дату
    let lastCheckedAt = new Date(externalData.last_updated);
    if (isNaN(lastCheckedAt.getTime())) {
      // Если полученная дата некорректна, используем текущую дату
      lastCheckedAt = new Date();
    }
    
    // Обновляем или создаем запись в локальной базе данных
    await balanceRepository.upsertUserBalance(
      userId,
      externalData.balance,
      externalData.balance,
      lastCheckedAt
    );
    
    // Возвращаем объект с балансом и last_updated в формате ISO
    return {
      balance: externalData.balance,
      last_updated: lastCheckedAt.toISOString(),
    };
  },
};

