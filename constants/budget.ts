export type BudgetType = 'needs' | 'wants' | 'savings';

export const BUDGET_SECTIONS: Record<BudgetType, { label: string; desc: string }> = {
  needs:   { label: 'Besoins',  desc: 'Logement, alimentation, transport, santé...' },
  wants:   { label: 'Envies',   desc: 'Loisirs, vêtements, sorties...' },
  savings: { label: 'Épargne',  desc: "Épargne, urgence, investissement, objectifs" },
};

export const BUDGET_ORDER: BudgetType[] = ['needs', 'wants', 'savings'];

/** Default % allocation — user can override via settings (must sum to 100). */
export const DEFAULT_PCT: Record<BudgetType, number> = {
  needs: 40, wants: 20, savings: 40,
};

/** Categories that represent goal contributions — shown separately inside the Épargne card. */
export const GOAL_CATEGORIES = ['savings'];

/**
 * Rebalancing rule: if section A overspends by X,
 * each other section's effective limit is reduced by X / (n-1).
 *
 * Returns adjusted limits that always reflect total income correctly.
 */
export function computeAdjustedLimits(
  income: number,
  pct: Record<BudgetType, number>,
  spent: Record<BudgetType, number>,
): Record<BudgetType, { base: number; adjusted: number; overflow: number; reduction: number }> {
  const sections = BUDGET_ORDER;
  const n = sections.length;

  const base: Record<string, number> = {};
  const overflow: Record<string, number> = {};
  let totalOverflow = 0;

  for (const sec of sections) {
    base[sec] = income * pct[sec] / 100;
    overflow[sec] = Math.max(0, (spent[sec] ?? 0) - base[sec]);
    totalOverflow += overflow[sec];
  }

  const result: Record<string, { base: number; adjusted: number; overflow: number; reduction: number }> = {};
  for (const sec of sections) {
    const overflowFromOthers = totalOverflow - overflow[sec];
    const reduction = overflowFromOthers / (n - 1);
    result[sec] = {
      base: base[sec],
      adjusted: Math.max(0, base[sec] - reduction),
      overflow: overflow[sec],
      reduction,
    };
  }
  return result as Record<BudgetType, { base: number; adjusted: number; overflow: number; reduction: number }>;
}
