import { prisma } from '../database/prismaClient';

export const userRepository = {
  async findUserByUsername(username: string) {
    return prisma.user.findFirst({
      where: { username },
    });
  },

  async updateLastLogin(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  },

  async findUsersWithExternalAccount() {
    return prisma.user.findMany({
      where: { externalApiAccount: { isNot: null } },
      select: { id: true },
    });
  },
};
