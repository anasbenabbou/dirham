import { getDb } from './schema';

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  month: string;
}

export function upsertBudget(category: string, monthly_limit: number, month: string): void {
  getDb().runSync(
    `INSERT INTO budgets (category, monthly_limit, month) VALUES (?, ?, ?)
     ON CONFLICT(category, month) DO UPDATE SET monthly_limit = excluded.monthly_limit`,
    [category, monthly_limit, month]
  );
}

export function getBudgetsForMonth(month: string): Budget[] {
  return getDb().getAllSync<Budget>(`SELECT * FROM budgets WHERE month = ?`, [month]);
}
