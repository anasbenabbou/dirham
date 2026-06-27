import { getDb } from './schema';

export interface Transaction {
  id: number;
  amount: number;
  category: string;
  note: string;
  date: string;
  type: 'income' | 'expense';
}

export function insertTransaction(t: Omit<Transaction, 'id'>): void {
  getDb().runSync(
    `INSERT INTO transactions (amount, category, note, date, type) VALUES (?, ?, ?, ?, ?)`,
    [t.amount, t.category, t.note, t.date, t.type]
  );
}

export function getTransactions(month: string): Transaction[] {
  return getDb().getAllSync<Transaction>(
    `SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC`,
    [`${month}%`]
  );
}

export function updateTransaction(t: Transaction): void {
  getDb().runSync(
    `UPDATE transactions SET amount=?, category=?, note=?, date=?, type=? WHERE id=?`,
    [t.amount, t.category, t.note, t.date, t.type, t.id]
  );
}

export function deleteTransaction(id: number): void {
  getDb().runSync(`DELETE FROM transactions WHERE id = ?`, [id]);
}

export function getMonthlyTotals(month: string): { income: number; expenses: number } {
  const rows = getDb().getAllSync<{ type: string; total: number }>(
    `SELECT type, SUM(amount) as total FROM transactions WHERE date LIKE ? GROUP BY type`,
    [`${month}%`]
  );
  return {
    income: rows.find(r => r.type === 'income')?.total ?? 0,
    expenses: rows.find(r => r.type === 'expense')?.total ?? 0,
  };
}

export function getMonthlyByCategory(month: string): Record<string, number> {
  const rows = getDb().getAllSync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total FROM transactions WHERE date LIKE ? AND type='expense' GROUP BY category`,
    [`${month}%`]
  );
  return Object.fromEntries(rows.map(r => [r.category, r.total]));
}
