import { prisma } from '../database/prismaClient';

export const betRepository = {
  async createBet(userId: number, externalBetId: number, amount: number, status: string) {
    return prisma.bet.create({
      data: {
        externalBetId,
        amount,
        status,
        winAmount: 0,
        user: { connect: { id: userId } },
      },
    });
  },
  
  async findBetById(userId: number, betId: number) {
    return prisma.bet.findFirst({
      where: { id: betId, userId },
    });
  },

  async findBetByExternalId(userId: number, externalBetId: number) {
    return prisma.bet.findFirst({
      where: {
        externalBetId,
        userId,
      },
    });
  },

  async findBetsByUser(userId: number) {
    return prisma.bet.findMany({
      where: { userId },
    });
  },

  async updateBet(userId: number, betId: number, updatedData: any) {
    // Здесь можно добавить проверку, что ставка принадлежит userId
    return prisma.bet.update({
      where: { id: betId },
      data: updatedData,
    });
  },

};
