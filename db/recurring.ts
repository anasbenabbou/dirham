import { getDb } from './schema';
import { insertTransaction } from './transactions';

export type Frequency = 'monthly' | 'weekly';

export interface Recurring {
  id: number;
  amount: number;
  category: string;
  note: string;
  type: 'income' | 'expense';
  frequency: Frequency;
  anchor_day: number;     // day-of-month (monthly) or day-of-week 0-6 (weekly)
  next_date: string;      // YYYY-MM-DD of the next occurrence
  active: number;
}

export function getRecurring(): Recurring[] {
  return getDb().getAllSync<Recurring>(`SELECT * FROM recurring ORDER BY active DESC, next_date ASC`);
}

export function insertRecurring(r: Omit<Recurring, 'id' | 'active'>): void {
  getDb().runSync(
    `INSERT INTO recurring (amount, category, note, type, frequency, anchor_day, next_date, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [r.amount, r.category, r.note, r.type, r.frequency, r.anchor_day, r.next_date]
  );
}

export function setRecurringActive(id: number, active: boolean): void {
  getDb().runSync(`UPDATE recurring SET active = ? WHERE id = ?`, [active ? 1 : 0, id]);
}

export function deleteRecurring(id: number): void {
  getDb().runSync(`DELETE FROM recurring WHERE id = ?`, [id]);
}

function advance(dateISO: string, freq: Frequency, anchorDay: number): string {
  const d = new Date(dateISO + 'T00:00:00');
  if (freq === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else {
    const target = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(anchorDay, daysInMonth));
    return target.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Posts every occurrence that's due up to today and rolls next_date forward.
 * Returns how many transactions were created (for an optional summary toast).
 */
export function processDueRecurring(): number {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const rules = db.getAllSync<Recurring>(`SELECT * FROM recurring WHERE active = 1`);
  let posted = 0;

  for (const r of rules) {
    let next = r.next_date;
    let guard = 0;
    while (next <= today && guard < 240) {
      insertTransaction({ amount: r.amount, category: r.category, note: r.note || 'Récurrent', date: next, type: r.type });
      posted++;
      next = advance(next, r.frequency, r.anchor_day);
      guard++;
    }
    if (next !== r.next_date) db.runSync(`UPDATE recurring SET next_date = ? WHERE id = ?`, [next, r.id]);
  }
  return posted;
}
