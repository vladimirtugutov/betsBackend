import { callExternalAPI } from '../apiClients/externalApiClient';
import { betRepository } from '../repositories/betRepository';
import { balanceRepository } from '../repositories/balanceRepository';
import { prisma } from '../database/prismaClient';

export const betService = {
  async placeBet(userId: number, amount: number) {
    // Валидация: значение ставки должно быть между 1 и 5
    if (amount < 1 || amount > 5) {
      throw new Error('Invalid bet amount. Must be between 1 and 5.');
    }

    // Проверяем, достаточно ли средств на локальном балансе
    const userBalanceRecord = await prisma.userBalance.findUnique({
      where: { userId },
    });
    if (!userBalanceRecord || userBalanceRecord.balance.toNumber() < amount) {
      throw new Error('Insufficient funds.');
    }

    // Формируем тело запроса для внешнего API
    const requestBody = { bet: amount };

    // Вызываем внешнее API
    const externalResponse = await callExternalAPI('post', '/bet', userId, requestBody);

    // Предположим, что внешний API возвращает: { bet_id, status }
    const { bet_id, status: externalStatus } = externalResponse.data;
    const status = externalStatus || 'pending';

    // Сохраняем ставку в базе через репозиторий
    const newBet = await betRepository.createBet(userId, bet_id, amount, status);

    // Сразу вызываем refreshBet, чтобы получить актуальные данные (результат ставки) 
    // и обновить локальную запись и баланс
    await this.refreshBet(userId, newBet);

    return newBet;
  },

  async getBet(userId: number, betId: number) {
    const bet = await betRepository.findBetById(userId, betId);
    if (!bet) {
      throw new Error('Bet not found');
    }
    return bet;
  },

  async updateBet(userId: number, betId: number, updatedData: any) {
    return betRepository.updateBet(userId, betId, updatedData);
  },

  /**
   * Получает обновленную информацию о ставке из внешнего API,
   * обновляет локальную запись и возвращает обновленные данные.
   */
  async refreshBet(userId: number, bet: any) {
    // Если ставка уже обновлена, возвращаем её без обновления
    if (bet.completedAt) {
      return bet;
    }

    // Формируем тело запроса для внешнего API
    const requestBody = { bet_id: bet.externalBetId };
    
    // Вызываем внешний API (POST /win)
    const externalResponse = await callExternalAPI(
      'post',
      '/win',
      userId,
      requestBody
    );

    // Получаем значение win из ответа внешнего API
    const { win } = externalResponse.data;
    
    // Логика обновления:
    // Если win === 0, считаем ставку проигранной.
    // Если win > 0, считаем ставку выигранной.
    const updatedData: any = {
      winAmount: win > 0 ? win : -bet.amount,
      status: win === 0 ? "lost" : win > 0 ? "completed" : bet.status,
      completedAt: win !== undefined ? new Date() : bet.completedAt,
    };

    // Обновляем локальную запись
    const updatedBet = await betRepository.updateBet(userId, bet.id, updatedData);

    // Обновляем баланс пользователя:
    // Если выигрыш (win > 0), баланс увеличивается на win,
    // если проигрыш (win === 0), баланс уменьшается на сумму ставки.
    await balanceRepository.updateBalanceByBetResult(userId, bet.id, bet.amount, win);

    return updatedBet;
  },

  async getBets(userId: number) {
    // Получаем локальные ставки для пользователя
    const bets = await betRepository.findBetsByUser(userId);
    
    // Для каждой ставки вызываем метод refreshBet
    const updatedBets = await Promise.all(
      bets.map(async (bet) => {
        try {
          return await this.refreshBet(userId, bet);
        } catch (error: any) {
          console.error(`Error refreshing bet ${bet.id}:`, error.message);
          // Если обновление не удалось, возвращаем исходную ставку
          return bet;
        }
      })
    );
    
    return updatedBets;
  },

  async getBetsList(userId: number) {
    return await betRepository.findBetsByUser(userId);
  },

  async getUpdatedBalance(userId: number) {
    // Формируем запрос к внешнему API: POST /balance с пустым телом
    const requestBody = {};
    const externalResponse = await callExternalAPI('post', '/balance', userId, requestBody);
    
    // Предположим, внешний API возвращает объект вида:
    // { balance: 1150, last_updated: "2025-03-04T12:49:04.697Z" }
    const externalData = externalResponse.data;
    // Преобразуем last_updated в объект Date
    let lastCheckedAt = new Date(externalData.last_updated);
    if (isNaN(lastCheckedAt.getTime())) {
      lastCheckedAt = new Date();
    }
    
    // Обновляем или создаем запись в локальной базе данных
    await balanceRepository.upsertUserBalance(
      userId,
      externalData.balance,
      externalData.balance,
      lastCheckedAt
    );
    
    return {
      balance: externalData.balance,
      last_updated: lastCheckedAt.toISOString(),
    };
  },

  async checkBalance(userId: number, expected_balance: number) {
    // Формируем тело запроса для проверки баланса
    const requestBody = { expected_balance };
    const externalResponse = await callExternalAPI('post', '/check-balance', userId, requestBody);
    
    // Предположим, внешний API возвращает:
    // Для корректного баланса:
    // { is_correct: true, balance: 1150 }
    // Для некорректного:
    // { is_correct: false, message: "Incorrect balance. Expected: 1010, Actual: 1006", correct_balance: 1006 }
    return externalResponse.data;
  },

};

