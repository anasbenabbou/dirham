import { getDb } from './schema';

export type AccountType = 'checking' | 'savings' | 'card' | 'emergency';

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
    ['Espèces', 'Liquide', 'checking', 0, '#0ECB81', '']
  );
  return res.lastInsertRowId;
}

export function deleteAccount(id: number): void {
  getDb().runSync(`DELETE FROM accounts WHERE id = ?`, [id]);
}
