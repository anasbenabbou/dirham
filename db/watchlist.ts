import { getDb } from './schema';

export interface WatchItem { ticker: string; company_name: string; }

export function getWatchlist(): WatchItem[] {
  return getDb().getAllSync<WatchItem>(`SELECT * FROM watchlist ORDER BY ticker ASC`);
}

export function addToWatchlist(ticker: string, company_name: string): void {
  getDb().runSync(
    `INSERT INTO watchlist (ticker, company_name) VALUES (?, ?) ON CONFLICT(ticker) DO NOTHING`,
    [ticker, company_name]
  );
}

export function removeFromWatchlist(ticker: string): void {
  getDb().runSync(`DELETE FROM watchlist WHERE ticker = ?`, [ticker]);
}
