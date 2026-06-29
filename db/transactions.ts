import { getDb } from './schema';

export interface Transaction {
  id: number;
  amount: number;
  category: string;
  note: string;
  date: string;
  type: 'income' | 'expense';
  account_id?: number | null;
  receipt_uri?: string | null;
}

export function insertTransaction(t: Omit<Transaction, 'id'>): number {
  const res = getDb().runSync(
    `INSERT INTO transactions (amount, category, note, date, type, account_id, receipt_uri) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [t.amount, t.category, t.note, t.date, t.type, t.account_id ?? null, t.receipt_uri ?? null]
  );
  return res.lastInsertRowId;
}

export function getTransactions(month: string): Transaction[] {
  return getDb().getAllSync<Transaction>(
    `SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC, id DESC`,
    [`${month}%`]
  );
}

export function getAllTransactions(): Transaction[] {
  return getDb().getAllSync<Transaction>(`SELECT * FROM transactions ORDER BY date DESC, id DESC`);
}

export function getTransactionById(id: number): Transaction | null {
  return getDb().getFirstSync<Transaction>(`SELECT * FROM transactions WHERE id = ?`, [id]) ?? null;
}

export function getTransactionsByCategory(category: string): Transaction[] {
  return getDb().getAllSync<Transaction>(
    `SELECT * FROM transactions WHERE category = ? ORDER BY date DESC, id DESC`, [category]
  );
}

/** Distinct months that contain at least one transaction, newest first. */
export function getMonthsWithData(): string[] {
  const rows = getDb().getAllSync<{ m: string }>(
    `SELECT DISTINCT substr(date,1,7) as m FROM transactions ORDER BY m DESC`
  );
  return rows.map(r => r.m);
}

export function updateTransaction(t: Transaction): void {
  getDb().runSync(
    `UPDATE transactions SET amount=?, category=?, note=?, date=?, type=?, account_id=?, receipt_uri=? WHERE id=?`,
    [t.amount, t.category, t.note, t.date, t.type, t.account_id ?? null, t.receipt_uri ?? null, t.id]
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

/** Only salary + freelance count as the budget envelope — not goal withdrawals, gifts, etc. */
const BUDGET_INCOME_CATEGORIES = ['salary', 'freelance'];

export function getBudgetIncome(month: string): number {
  const placeholders = BUDGET_INCOME_CATEGORIES.map(() => '?').join(',');
  const row = getDb().getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions
     WHERE date LIKE ? AND type='income' AND category IN (${placeholders})`,
    [`${month}%`, ...BUDGET_INCOME_CATEGORIES]
  );
  return row?.total ?? 0;
}

export function getMonthlyByCategory(month: string): Record<string, number> {
  const rows = getDb().getAllSync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total FROM transactions WHERE date LIKE ? AND type='expense' GROUP BY category`,
    [`${month}%`]
  );
  return Object.fromEntries(rows.map(r => [r.category, r.total]));
}

/** Income/expense totals per month for the trailing `n` months (oldest→newest). */
export function getTrend(n: number): { month: string; income: number; expenses: number }[] {
  const out: { month: string; income: number; expenses: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toISOString().slice(0, 7);
    out.push({ month, ...getMonthlyTotals(month) });
  }
  return out;
}
