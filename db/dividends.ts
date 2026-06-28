import { getDb } from './schema';

export interface Dividend {
  id: number;
  ticker: string;
  amount: number;
  date: string;
  note: string;
}

export function insertDividend(d: Omit<Dividend, 'id'>): void {
  getDb().runSync(
    `INSERT INTO dividends (ticker, amount, date, note) VALUES (?, ?, ?, ?)`,
    [d.ticker, d.amount, d.date, d.note]
  );
}

export function getDividends(ticker?: string): Dividend[] {
  const db = getDb();
  return ticker
    ? db.getAllSync<Dividend>(`SELECT * FROM dividends WHERE ticker = ? ORDER BY date DESC`, [ticker])
    : db.getAllSync<Dividend>(`SELECT * FROM dividends ORDER BY date DESC`);
}

export function deleteDividend(id: number): void {
  getDb().runSync(`DELETE FROM dividends WHERE id = ?`, [id]);
}

export function totalDividends(ticker?: string): number {
  const db = getDb();
  const row = ticker
    ? db.getFirstSync<{ t: number }>(`SELECT COALESCE(SUM(amount),0) as t FROM dividends WHERE ticker = ?`, [ticker])
    : db.getFirstSync<{ t: number }>(`SELECT COALESCE(SUM(amount),0) as t FROM dividends`);
  return row?.t ?? 0;
}
