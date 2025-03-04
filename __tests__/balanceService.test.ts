import { balanceService } from '../src/services/balanceService';
import { callExternalAPI } from '../src/apiClients/externalApiClient';
import { balanceRepository } from '../src/repositories/balanceRepository';
import { userRepository } from '../src/repositories/userRepository';
import { prisma } from '../src/database/prismaClient';

jest.mock('../src/apiClients/externalApiClient');
jest.mock('../src/repositories/balanceRepository');
jest.mock('../src/database/prismaClient');
jest.mock('../src/repositories/userRepository');

jest.mock('../src/database/prismaClient', () => ({
  prisma: {
    userBalance: {
      findUnique: jest.fn(),
    },
    // Если нужны и другие методы, например, update, можно добавить их тоже:
    update: jest.fn(),
  },
}));

describe('balanceService.getBalance', () => {
  it('should return balance and last_updated from external API and update local record', async () => {
    const externalData = {
      balance: 1150,
      last_updated: "2025-03-04T12:49:04.697Z",
    };
    (callExternalAPI as jest.Mock).mockResolvedValue({ data: externalData, status: 200 });
    (balanceRepository.upsertUserBalance as jest.Mock).mockResolvedValue(externalData);

    const result = await balanceService.getBalance(1);
    expect(result.balance).toBe(1150);
    expect(result.last_updated).toBe(new Date(externalData.last_updated).toISOString());
  });
});

describe('balanceService.checkBalance', () => {
  beforeEach(() => {
    // Мокаем getUserBalance, чтобы он возвращал объект с балансом 1050
    (balanceRepository.getUserBalance as jest.Mock).mockResolvedValue({
      balance: { toNumber: () => 1050 },
    });
  });
  it('should update local balance if external API returns incorrect balance', async () => {
    // Мокаем локальный баланс
    const localBalance = { balance: { toNumber: () => 1050 } };
    // Мокаем репозиторий: используем его метод getUserBalance через prisma
    (prisma.userBalance.findUnique as jest.Mock).mockResolvedValue(localBalance);
    
    // Внешний API возвращает неправильный баланс
    const externalData = {
      is_correct: false,
      correct_balance: 1024,
    };
    (callExternalAPI as jest.Mock).mockResolvedValue({ data: externalData });
    (balanceRepository.upsertUserBalance as jest.Mock).mockResolvedValue({ balance: 1024 });

    const result = await balanceService.checkBalance(1);
    expect(result.is_correct).toBe(false);
  });
});

describe('balanceService.getBalance - additional branch', () => {
  it('should fallback to current date if externalData.last_updated is invalid', async () => {
    const externalData = { balance: 1200, last_updated: "invalid-date" };
    (callExternalAPI as jest.Mock).mockResolvedValue({ data: externalData, status: 200 });
    (balanceRepository.upsertUserBalance as jest.Mock).mockResolvedValue(externalData);
    
    const result = await balanceService.getBalance(1);
    expect(result.balance).toBe(1200);
    // Проверяем, что last_updated возвращается в корректном формате ISO,
    // т.е. new Date(result.last_updated) не является "Invalid Date"
    expect(new Date(result.last_updated).toString()).not.toBe("Invalid Date");
  });
});

describe('balanceService.checkBalance - additional branches', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  it('should throw error if local balance not found', async () => {
    (balanceRepository.getUserBalance as jest.Mock).mockResolvedValue(null);
    await expect(balanceService.checkBalance(1)).rejects.toThrow("Local balance not found");
  });

  it('should not update local balance if external API returns is_correct true', async () => {
    const localBalance = { balance: 1050 };
    (balanceRepository.getUserBalance as jest.Mock).mockResolvedValue(localBalance);
    const externalData = { is_correct: true, balance: 1050 };
    (callExternalAPI as jest.Mock).mockResolvedValue({ data: externalData });
    const upsertSpy = jest.spyOn(balanceRepository, 'upsertUserBalance');

    const result = await balanceService.checkBalance(1);
    expect(result.is_correct).toBe(true);
    // Если баланс корректен, upsertUserBalance не должен вызываться
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});

describe('balanceService.syncAllUserBalances', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sync results for all users', async () => {
    // Мокаем репозиторий для получения пользователей с внешней учетной записью
    const users = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ];
    (userRepository.findUsersWithExternalAccount as jest.Mock).mockResolvedValue(users);

    // Мокаем метод getBalance для каждого пользователя:
    // для userId = 2 имитируем ошибку, для остальных – возвращаем корректное значение
    jest.spyOn(balanceService, 'getBalance').mockImplementation((userId: number) => {
      if (userId === 2) {
        return Promise.reject(new Error('Test error'));
      }
      return Promise.resolve({ balance: 1000 + userId, last_updated: new Date().toISOString() });
    });

    const syncResults = await balanceService.syncAllUserBalances();

    // Проверяем, что получен массив длины 3
    expect(syncResults).toHaveLength(3);
    // Для userId = 1 ожидаем корректный результат
    expect(syncResults[0]).toEqual(expect.objectContaining({ balance: 1001 }));
    // Для userId = 2 ожидаем объект с ошибкой
    expect(syncResults[1]).toEqual({ userId: 2, error: 'Test error' });
    // Для userId = 3 ожидаем корректный результат
    expect(syncResults[2]).toEqual(expect.objectContaining({ balance: 1003 }));
  });
});