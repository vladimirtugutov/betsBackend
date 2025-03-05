import { betService } from '../src/services/betService';
import { betRepository } from '../src/repositories/betRepository';
import { callExternalAPI } from '../src/apiClients/externalApiClient';
import { balanceRepository } from '../src/repositories/balanceRepository';
import { prisma } from '../src/database/prismaClient';

// Мокаем необходимые зависимости
jest.mock('../src/repositories/betRepository');
jest.mock('../src/apiClients/externalApiClient');
jest.mock('../src/repositories/balanceRepository');

// Явно мокаем prisma, чтобы в нём был userBalance.findUnique
jest.mock('../src/database/prismaClient', () => {
  return {
    prisma: {
      userBalance: {
        findUnique: jest.fn(),
      },
      // Если нужно мокать другие методы, опишите их здесь
    },
  };
});

  describe('betService.refreshBet', () => {
  beforeEach(() => {
    // Мокаем getUserBalance, чтобы он возвращал объект с балансом 1050
    (balanceRepository.getUserBalance as jest.Mock).mockResolvedValue({
      balance: { toNumber: () => 1050 },
    });
  });

  it('should not refresh bet if completedAt exists', async () => {
    const bet = {
      id: 1,
      externalBetId: 123,
      completedAt: new Date(),
      amount: 3,
      winAmount: 0,
      status: 'pending',
    };
    const result = await betService.refreshBet(1, bet);
    expect(result).toEqual(bet);
  });

  it('should refresh bet and update balance if external API returns win > 0', async () => {
    const bet = { id: 1, externalBetId: 123, completedAt: null, amount: 3, winAmount: 0, status: 'pending' };

    // Мокаем вызов внешнего API
    (callExternalAPI as jest.Mock).mockResolvedValue({ data: { win: 6 } });
    (betRepository.updateBet as jest.Mock).mockImplementation((userId, betId, data) =>
      Promise.resolve({ ...bet, ...data })
    );
    (balanceRepository.updateBalanceByBetResult as jest.Mock).mockResolvedValue({});

    const result = await betService.refreshBet(1, bet);
    expect(result.status).toBe('completed');
    expect(result.winAmount).toBe(6);
  });

  it('should refresh bet and update balance if external API returns win === 0', async () => {
    const bet = { id: 2, externalBetId: 456, completedAt: null, amount: 3, winAmount: 0, status: 'pending' };

    (callExternalAPI as jest.Mock).mockResolvedValue({ data: { win: 0 } });
    (betRepository.updateBet as jest.Mock).mockImplementation((userId, betId, data) =>
      Promise.resolve({ ...bet, ...data })
    );
    (balanceRepository.updateBalanceByBetResult as jest.Mock).mockResolvedValue({});

    const result = await betService.refreshBet(1, bet);
    expect(result.status).toBe('lost');
    expect(result.winAmount).toBe(-bet.amount);
  });
});

describe('betService.placeBet', () => {
  it('should throw error if amount < 1', async () => {
    await expect(betService.placeBet(1, 0)).rejects.toThrow('Invalid bet amount. Must be between 1 and 5.');
  });

  it('should throw error if userBalance < amount', async () => {
    // Мокаем локальный баланс
    (prisma.userBalance.findUnique as jest.Mock).mockResolvedValue({ balance: { toNumber: () => 2 } });
    await expect(betService.placeBet(1, 3)).rejects.toThrow('Insufficient funds.');
  });

  it('should create bet and call refreshBet if everything is ok', async () => {
    // Мокаем баланс в 10
    (prisma.userBalance.findUnique as jest.Mock).mockResolvedValue({ balance: { toNumber: () => 10 } });
    // Мокаем вызов внешнего API /bet
    (callExternalAPI as jest.Mock).mockResolvedValue({ data: { bet_id: 999, status: 'pending' } });
    (betRepository.createBet as jest.Mock).mockResolvedValue({
      id: 123,
      externalBetId: 999,
      amount: 3,
      status: 'pending',
    });
    // Мокаем refreshBet (если вызывается внутри placeBet)
    jest.spyOn(betService, 'refreshBet').mockResolvedValue({
      id: 123,
      externalBetId: 999,
      amount: 3,
      status: 'completed',
      winAmount: 6,
    } as any);

    const result = await betService.placeBet(1, 3);
    expect(result.status).toBe('completed');
    expect(result.winAmount).toBe(6);
  });
});
