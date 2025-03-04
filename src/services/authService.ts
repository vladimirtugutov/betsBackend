import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository';

export const authService = {
  async login(username: string) {
    // Ищем пользователя по username
    const user = await userRepository.findUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Обновляем lastLogin через репозиторий
    await userRepository.updateLastLogin(user.id);
    
    const expiresIn = 3600; // время жизни токена (в секундах)
    // Генерируем JWT-токен
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn }
    );
    return { token, expiresIn };
  },
};
