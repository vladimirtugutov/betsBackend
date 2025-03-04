import { prisma } from '../database/prismaClient';
import Decimal from 'decimal.js';
import { transactionRepository } from './transactionRepository';

export const balanceRepository = {
  async upsertUserBalance(
    userId: number,
    balance: any,          // Если тип Decimal, то можно использовать его напрямую
    externalBalance: any,  // Аналогично
    lastCheckedAt: Date
  ) {
    return prisma.userBalance.upsert({
      where: { userId },
      update: { balance, externalBalance, lastCheckedAt },
      create: { userId, balance, externalBalance, lastCheckedAt },
    });
  },

  // Обновление баланса на основе результата ставки
  async updateBalanceByBetResult(userId: number, betId: number, betAmount: number, win: number) {
    const userBalanceRecord = await prisma.userBalance.findUnique({
      where: { userId },
    });
    if (!userBalanceRecord) {
      throw new Error('User balance not found');
    }

    const currentBalance = new Decimal(userBalanceRecord.balance.toString());

    let newBalance: Decimal;
    let transactionType: string;
    let transactionAmount: Decimal;
    let description: string;

    if (win > 0) {
      // Выигрыш: баланс увеличивается на win
      newBalance = currentBalance.plus(win);
      transactionType = 'bet_win';
      transactionAmount = new Decimal(win);
      description = `Win for bet #${betId}`;
    } else {
      // Проигрыш (win === 0): баланс уменьшается на сумму ставки
      newBalance = currentBalance.minus(betAmount);
      transactionType = 'bet_loss';
      transactionAmount = new Decimal(-betAmount);
      description = `Loss for bet #${betId}`;
    }

    // Обновляем запись в user_balances
    const updatedBalance = await prisma.userBalance.update({
      where: { userId },
      data: {
        balance: newBalance,
        externalBalance: newBalance,
        lastCheckedAt: new Date(),
      },
    });

    // Записываем транзакцию, используя параметр betId, который передан в функцию
    await transactionRepository.createTransaction({
      userId: userId,
      betId: betId,
      type: transactionType,
      amount: transactionAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: description,
    });

    return updatedBalance;
  },

  async getUserBalance(userId: number) {
    return prisma.userBalance.findUnique({
      where: { userId },
    });
  },
};
