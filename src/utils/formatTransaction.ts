export function formatTransaction(tx: any) {
  return {
    id: String(tx.id),
    type: tx.type,
    amount: tx.amount,
    balance_before: tx.balanceBefore,
    balance_after: tx.balanceAfter,
    description: tx.description,
    created_at: tx.createdAt,
  };
}
