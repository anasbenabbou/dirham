import { getDb } from './schema';

export interface Holding {
  id: number;
  ticker: string;
  company_name: string;
  shares: number;
  buy_price: number;
}

export function insertHolding(h: Omit<Holding, 'id'>): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO holdings (ticker, company_name, shares, buy_price) VALUES (?, ?, ?, ?)`,
    [h.ticker, h.company_name, h.shares, h.buy_price]
  );
}

export function getHoldings(): Holding[] {
  return getDb().getAllSync<Holding>(`SELECT * FROM holdings ORDER BY ticker ASC`);
}

export function deleteHolding(id: number): void {
  getDb().runSync(`DELETE FROM holdings WHERE id = ?`, [id]);
}
