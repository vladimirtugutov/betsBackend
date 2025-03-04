import { prisma } from '../database/prismaClient';
import Decimal from 'decimal.js';

export const transactionRepository = {
  async createTransaction(data: {
    userId: number;
    betId: number;
    type: string;
    amount: Decimal | number;
    balanceBefore: Decimal | number;
    balanceAfter: Decimal | number;
    description: string;
  }) {
    return prisma.transaction.create({
      data,
    });
  },

  async findTransactionsByUser(userId: number, skip: number, take: number) {
    return prisma.transaction.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  async countTransactionsByUser(userId: number) {
    return prisma.transaction.count({ where: { userId } });
  },
};
