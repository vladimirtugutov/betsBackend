import jwt from 'jsonwebtoken';
import { authService } from '../src/services/authService';
import { userRepository } from '../src/repositories/userRepository';

// Мокаем репозиторий пользователей
jest.mock('../src/repositories/userRepository');

describe('authService.login', () => {
  it('should throw error if user not found', async () => {
    (userRepository.findUserByUsername as jest.Mock).mockResolvedValue(null);
    await expect(authService.login('nonexistent')).rejects.toThrow('User not found');
  });

  it('should update lastLogin and return token if user exists', async () => {
    const user = { id: 1, username: 'user1', email: 'user1@example.com' };
    (userRepository.findUserByUsername as jest.Mock).mockResolvedValue(user);
    (userRepository.updateLastLogin as jest.Mock) = jest.fn().mockResolvedValue(user);

    const result = await authService.login('user1');

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('expiresIn', 3600);

    const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'default_secret') as any;
    expect(decoded.userId).toBe(user.id);
    expect(decoded.username).toBe(user.username);
  });
});
