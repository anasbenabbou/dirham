import { getDb } from './schema';

export interface Transfer {
  id: number;
  from_account: number;
  to_account: number;
  amount: number;
  date: string;
  note: string;
}

/** Records a transfer AND moves the balance between the two accounts atomically. */
export function insertTransfer(tr: Omit<Transfer, 'id'>): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync(`INSERT INTO transfers (from_account, to_account, amount, date, note) VALUES (?, ?, ?, ?, ?)`,
      [tr.from_account, tr.to_account, tr.amount, tr.date, tr.note]);
    db.runSync(`UPDATE accounts SET balance = balance - ? WHERE id = ?`, [tr.amount, tr.from_account]);
    db.runSync(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [tr.amount, tr.to_account]);
  });
}

export function getTransfers(month?: string): Transfer[] {
  const db = getDb();
  return month
    ? db.getAllSync<Transfer>(`SELECT * FROM transfers WHERE date LIKE ? ORDER BY date DESC, id DESC`, [`${month}%`])
    : db.getAllSync<Transfer>(`SELECT * FROM transfers ORDER BY date DESC, id DESC`);
}

/** Deletes a transfer and reverses its balance effect. */
export function deleteTransfer(id: number): void {
  const db = getDb();
  const tr = db.getFirstSync<Transfer>(`SELECT * FROM transfers WHERE id = ?`, [id]);
  if (!tr) return;
  db.withTransactionSync(() => {
    db.runSync(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [tr.amount, tr.from_account]);
    db.runSync(`UPDATE accounts SET balance = balance - ? WHERE id = ?`, [tr.amount, tr.to_account]);
    db.runSync(`DELETE FROM transfers WHERE id = ?`, [id]);
  });
}
