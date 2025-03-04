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

  async checkBalance(userId: number) {
    // Получаем локальный баланс через репозиторий, а не напрямую через prisma
    const localBalanceRecord = await balanceRepository.getUserBalance(userId);
    if (!localBalanceRecord) {
      throw new Error("Local balance not found");
    }
    
    // Если используется Decimal, преобразуем к числу (если требуется)
    const expected_balance = Number(localBalanceRecord.balance);
    const requestBody = { expected_balance };
    
    const externalResponse = await callExternalAPI('post', '/check-balance', userId, requestBody);
    const result = externalResponse.data;
    
    if (result.is_correct === false) {
      const lastCheckedAt = new Date();
      await balanceRepository.upsertUserBalance(
        userId,
        result.correct_balance,
        result.correct_balance,
        lastCheckedAt
      );
    }
    return result;
  },
};

