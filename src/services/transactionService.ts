import { transactionRepository } from '../repositories/transactionRepository';
import { formatTransaction } from '../utils/formatTransaction';

export const transactionService = {
  async getTransactions(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    // Одновременный запрос списка транзакций и их количества
    const [transactions, total] = await Promise.all([
      transactionRepository.findTransactionsByUser(userId, skip, limit),
      transactionRepository.countTransactionsByUser(userId),
    ]);

    const pages = Math.ceil(total / limit);
    const formattedTransactions = transactions.map(tx => formatTransaction(tx));

    return {
      transactions: formattedTransactions,
      pagination: { total, page, limit, pages },
    };
  },
};
