import { getDb } from './schema';

export interface Snapshot { date: string; total: number; }

/** Records today's net worth (sum of account balances). One row per day. */
export function snapshotNetWorth(): void {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const row = db.getFirstSync<{ total: number }>(`SELECT COALESCE(SUM(balance),0) as total FROM accounts`);
  db.runSync(
    `INSERT INTO networth_snapshots (date, total) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET total = excluded.total`,
    [today, row?.total ?? 0]
  );
}

export function getSnapshots(limit = 30): Snapshot[] {
  const rows = getDb().getAllSync<Snapshot>(
    `SELECT * FROM networth_snapshots ORDER BY date DESC LIMIT ?`, [limit]
  );
  return rows.reverse(); // oldest → newest for charting
}
