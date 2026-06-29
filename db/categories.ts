import { getDb } from './schema';
import { getSetting, setSetting } from './settings';
import { Category, CategoryType, DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from '../constants/categories';

// In-memory cache so getCategoryByKey() stays synchronous and cheap in renders.
let _cache: Map<string, Category> | null = null;

function buildCache(): Map<string, Category> {
  const rows = getDb().getAllSync<Category>(`SELECT * FROM categories ORDER BY sort ASC, label ASC`);
  _cache = new Map(rows.map(r => [r.key, r]));
  return _cache;
}
function cache(): Map<string, Category> {
  return _cache ?? buildCache();
}
export function invalidateCategoryCache(): void { _cache = null; }

export function getCategories(): Category[] {
  return [...cache().values()];
}
export function getCategoriesByType(type: CategoryType): Category[] {
  return getCategories().filter(c => c.type === type);
}
export function getCategoryByKey(key: string): Category {
  return cache().get(key) ?? { ...FALLBACK_CATEGORY, key, label: key === FALLBACK_CATEGORY.key ? FALLBACK_CATEGORY.label : 'Supprimée' };
}
export function countCategories(): number {
  return getDb().getFirstSync<{ c: number }>(`SELECT COUNT(*) c FROM categories`)?.c ?? 0;
}

export function insertCategory(c: Category): void {
  getDb().runSync(
    `INSERT INTO categories (key, label, icon, color, type, budget, sort) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET label=excluded.label, icon=excluded.icon, color=excluded.color, type=excluded.type, budget=excluded.budget, sort=excluded.sort`,
    [c.key, c.label, c.icon, c.color, c.type, c.budget ?? null, c.sort ?? 0]
  );
  invalidateCategoryCache();
}
export function deleteCategory(key: string): void {
  getDb().runSync(`DELETE FROM categories WHERE key = ?`, [key]);
  invalidateCategoryCache();
}

/** One-time seed of the defaults (called from bootstrap when the table is empty). */
export function seedDefaultCategories(): void {
  if (countCategories() > 0) return;
  const db = getDb();
  db.withTransactionSync(() => {
    for (const c of DEFAULT_CATEGORIES) {
      db.runSync(`INSERT OR IGNORE INTO categories (key, label, icon, color, type, budget, sort) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [c.key, c.label, c.icon, c.color, c.type, c.budget ?? null, c.sort ?? 0]);
    }
  });
  invalidateCategoryCache();
}

/**
 * For installs seeded before budget groups existed: backfill the parent budget
 * group on default categories and add the new savings categories. Runs once.
 */
export function migrateCategoriesBudgetV1(): void {
  if (getSetting('cat_budget_v1') === '1') return;
  const db = getDb();
  db.withTransactionSync(() => {
    for (const c of DEFAULT_CATEGORIES) {
      if (c.budget) {
        db.runSync(`UPDATE categories SET budget = ? WHERE key = ? AND (budget IS NULL OR budget = '')`, [c.budget, c.key]);
      }
      if (c.key === 'emergency_fund' || c.key === 'investment_savings' || c.key === 'savings') {
        db.runSync(`INSERT OR IGNORE INTO categories (key, label, icon, color, type, budget, sort) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [c.key, c.label, c.icon, c.color, c.type, c.budget ?? null, c.sort ?? 0]);
      }
    }
  });
  setSetting('cat_budget_v1', '1');
  invalidateCategoryCache();
}

/**
 * Moves the `savings` category from budget group 'savings' → 'goals'
 * and updates its label/icon to reflect goal contributions. Runs once.
 */
/** Ensures `savings` key is in the savings section (not goals — that was reverted). */
export function migrateSavingsToGoalsV2(): void {
  // Always keep savings in the savings bucket — fix any prior migration that moved it to goals.
  getDb().runSync(
    `UPDATE categories SET budget = 'savings', label = 'Objectifs', icon = 'flag' WHERE key = 'savings'`
  );
  setSetting('cat_goals_v2', '1');
  invalidateCategoryCache();
}
