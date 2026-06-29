import { getDb } from './schema';

export type AccountType = 'cash' | 'checking' | 'savings' | 'card' | 'emergency';

export interface Account {
  id: number;
  name: string;
  bank: string;
  type: AccountType;
  balance: number;
  color: string;
  last_four: string;
}

export function getAccounts(): Account[] {
  return getDb().getAllSync<Account>(`SELECT * FROM accounts ORDER BY id DESC`);
}

export function insertAccount(a: Omit<Account, 'id'>): void {
  getDb().runSync(
    `INSERT INTO accounts (name, bank, type, balance, color, last_four) VALUES (?, ?, ?, ?, ?, ?)`,
    [a.name, a.bank, a.type, a.balance, a.color, a.last_four]
  );
}

export function updateBalance(id: number, balance: number): void {
  getDb().runSync(`UPDATE accounts SET balance = ? WHERE id = ?`, [balance, id]);
}

/** Adds a (signed) delta to an account's balance. Used by linked transactions/goals. */
export function adjustBalance(id: number, delta: number): void {
  getDb().runSync(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [delta, id]);
}

/**
 * Returns the id of the first account, creating a default "Espèces" cash
 * wallet if none exist. Guarantees money always has a real home.
 */
export function ensureDefaultAccount(): number {
  const db = getDb();
  const first = db.getFirstSync<{ id: number }>(`SELECT id FROM accounts ORDER BY id ASC LIMIT 1`);
  if (first) return first.id;
  const res = db.runSync(
    `INSERT INTO accounts (name, bank, type, balance, color, last_four) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Espèces', 'Liquide', 'cash', 0, '#0ECB81', '']
  );
  return res.lastInsertRowId;
}

/**
 * Ensures a "Espèces" cash account always exists, regardless of other accounts.
 * Safe to call every startup — no-op if one already exists.
 */
export function ensureCashAccount(): void {
  const db = getDb();
  const exists = db.getFirstSync<{ id: number }>(
    `SELECT id FROM accounts WHERE type = 'cash' LIMIT 1`
  );
  if (exists) return;
  db.runSync(
    `INSERT INTO accounts (name, bank, type, balance, color, last_four) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Espèces', 'Liquide', 'cash', 0, '#0ECB81', '']
  );
}

export function deleteAccount(id: number): void {
  getDb().runSync(`DELETE FROM accounts WHERE id = ?`, [id]);
}
