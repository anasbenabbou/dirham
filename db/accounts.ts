import { getDb } from './schema';

export interface Account {
  id: number;
  name: string;
  bank: string;
  type: 'checking' | 'savings' | 'card';
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

export function deleteAccount(id: number): void {
  getDb().runSync(`DELETE FROM accounts WHERE id = ?`, [id]);
}
