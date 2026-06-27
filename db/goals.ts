import { getDb } from './schema';

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  completed: number;
}

export function insertGoal(g: Omit<Goal, 'id' | 'current_amount' | 'completed'>): void {
  getDb().runSync(
    `INSERT INTO goals (name, target_amount, target_date) VALUES (?, ?, ?)`,
    [g.name, g.target_amount, g.target_date ?? null]
  );
}

export function getGoals(): Goal[] {
  return getDb().getAllSync<Goal>(`SELECT * FROM goals ORDER BY completed ASC, id DESC`);
}

export function updateGoalAmount(id: number, current_amount: number, target_amount: number): void {
  getDb().runSync(
    `UPDATE goals SET current_amount = ?, completed = ? WHERE id = ?`,
    [current_amount, current_amount >= target_amount ? 1 : 0, id]
  );
}

export function deleteGoal(id: number): void {
  getDb().runSync(`DELETE FROM goals WHERE id = ?`, [id]);
}
