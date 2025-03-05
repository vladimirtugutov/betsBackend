import { betService } from '../src/services/betService';
import { betRepository } from '../src/repositories/betRepository';
import { callExternalAPI } from '../src/apiClients/externalApiClient';
import { balanceRepository } from '../src/repositories/balanceRepository';
import { balanceService } from '../src/services/balanceService';
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
  beforeEach(() => {
    // Мокаем локальный баланс: 10
    (prisma.userBalance.findUnique as jest.Mock).mockResolvedValue({ balance: { toNumber: () => 10 } });
    
    // Мокаем вызов внешнего API для размещения ставки (/bet)
    (callExternalAPI as jest.Mock).mockResolvedValue({ data: { bet_id: 999, status: 'pending' } });
    
    // Мокаем создание ставки в репозитории
    (betRepository.createBet as jest.Mock).mockResolvedValue({
      id: 123,
      externalBetId: 999,
      amount: 3,
      status: 'pending',
      winAmount: 0,
    });
    
    // Мокаем refreshBet (обновление ставки), но не используем его результат в placeBet,
    // так как метод placeBet должен вернуть созданную ставку, не обновлённую асинхронно.
    jest.spyOn(betService, 'refreshBet').mockResolvedValue({
      id: 123,
      externalBetId: 999,
      amount: 3,
      status: 'completed',
      winAmount: 6,
      completedAt: new Date(),
    } as any);
    
    (balanceRepository.updateBalanceByBetResult as jest.Mock).mockResolvedValue({});
  });

  it('should throw error if amount < 1', async () => {
    await expect(betService.placeBet(1, 0)).rejects.toThrow('Invalid bet amount. Must be between 1 and 5.');
  });

  it('should throw error if userBalance < amount', async () => {
    (prisma.userBalance.findUnique as jest.Mock).mockResolvedValue({ balance: { toNumber: () => 2 } });
    await expect(betService.placeBet(1, 3)).rejects.toThrow('Insufficient funds.');
  });

  it('should create bet and call refreshBet if everything is ok', async () => {
    const result = await betService.placeBet(1, 3);
    expect(betService.refreshBet).toHaveBeenCalled();
    // Ожидаем, что placeBet вернет исходно созданную ставку, которая имеет статус "pending" и winAmount 0,
    // поскольку обновление происходит асинхронно и не изменяет возвращаемый объект.
    expect(result.status).toBe('pending');
    expect(result.winAmount).toBe(0);
  });
});

describe('betService.getBet', () => {
  it('should return bet if found', async () => {
    const fakeBet = { id: 1, externalBetId: 123, amount: 3, status: 'pending' };
    (betRepository.findBetById as jest.Mock).mockResolvedValue(fakeBet);
    
    const result = await betService.getBet(1, 1);
    expect(result).toEqual(fakeBet);
  });

  it('should throw error if bet not found', async () => {
    (betRepository.findBetById as jest.Mock).mockResolvedValue(null);
    await expect(betService.getBet(1, 999)).rejects.toThrow('Bet not found');
  });
});

describe('betService.updateBet', () => {
  it('should update bet with given data', async () => {
    const updatedData = { status: 'completed', winAmount: 6 };
    const fakeUpdatedBet = { id: 1, externalBetId: 123, amount: 3, ...updatedData };
    (betRepository.updateBet as jest.Mock).mockResolvedValue(fakeUpdatedBet);
    
    const result = await betService.updateBet(1, 1, updatedData);
    expect(betRepository.updateBet).toHaveBeenCalledWith(1, 1, updatedData);
    expect(result).toEqual(fakeUpdatedBet);
  });
});

describe('betService.getBets', () => {
  it('should return updated bets array', async () => {
    const fakeBets = [
      { id: 1, externalBetId: 101, amount: 3, status: 'pending', completedAt: null },
      { id: 2, externalBetId: 102, amount: 2, status: 'pending', completedAt: null },
    ];
    (betRepository.findBetsByUser as jest.Mock).mockResolvedValue(fakeBets);

    // Переопределяем refreshBet для каждого bet
    betService.refreshBet = jest.fn().mockImplementation((userId, bet) =>
      Promise.resolve({ ...bet, status: 'completed', winAmount: bet.amount * 2, completedAt: new Date() })
    );

    const result = await betService.getBets(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    result.forEach((bet, index) => {
      expect(bet.status).toBe('completed');
      expect(bet.winAmount).toBe(fakeBets[index].amount * 2);
    });
  });
});

describe('betService.getBetsList', () => {
  it('should return list of bets from repository', async () => {
    const fakeBets = [
      { id: 1, externalBetId: 101, amount: 3, status: 'pending' },
      { id: 2, externalBetId: 102, amount: 2, status: 'completed' },
    ];
    (betRepository.findBetsByUser as jest.Mock).mockResolvedValue(fakeBets);

    const result = await betService.getBetsList(1);
    expect(result).toEqual(fakeBets);
  });
});

describe('balanceService.checkBalance', () => {
  it('should return result with is_correct true when balance is correct', async () => {
    // Мокаем вызов external API для проверки баланса, возвращая корректный баланс
    (callExternalAPI as unknown as jest.Mock).mockResolvedValue({
      data: { is_correct: true, balance: 1150 },
    });

    const result = await balanceService.checkBalance(1);
    expect(result).toEqual({ is_correct: true, balance: 1150 });
  });

  it('should return result with is_correct false when balance is incorrect', async () => {
    // Мокаем вызов external API для проверки баланса, возвращая некорректный баланс
    (callExternalAPI as unknown as jest.Mock).mockResolvedValue({
      data: { 
        is_correct: false, 
        message: "Incorrect balance. Expected: 1010, Actual: 1006", 
        correct_balance: 1006 
      },
    });

    const result = await balanceService.checkBalance(1);
    expect(result).toEqual({
      is_correct: false,
      message: "Incorrect balance. Expected: 1010, Actual: 1006",
      correct_balance: 1006,
    });
  });
});