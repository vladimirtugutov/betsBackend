// Функция для форматирования объекта ставки в snake_case
export function formatBet(bet: any) {
  return {
    id: String(bet.id),
    amount: bet.amount,
    status: bet.status,
    win_amount: bet.winAmount,
    created_at: bet.createdAt,
    completed_at: bet.completedAt,
  };
}

