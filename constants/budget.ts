export type BudgetType = 'needs' | 'wants' | 'savings';

export interface BudgetRule {
  category: string;
  label: string;
  percentage: number;   // share of total income
  type: BudgetType;
}

/** The 40 / 20 / 40 plan: 40% essential needs, 20% lifestyle wants, 40% savings. */
export const BUDGET_SECTIONS: Record<BudgetType, { label: string; pct: number }> = {
  needs:   { label: 'Besoins',  pct: 40 },
  wants:   { label: 'Envies',   pct: 20 },
  savings: { label: 'Épargne',  pct: 40 },
};

export const BUDGET_ORDER: BudgetType[] = ['needs', 'wants', 'savings'];

export const DEFAULT_BUDGET_RULES: BudgetRule[] = [
  { category: 'housing',       label: 'Logement',     percentage: 20, type: 'needs' },
  { category: 'food',          label: 'Alimentation', percentage: 12, type: 'needs' },
  { category: 'transport',     label: 'Transport',    percentage: 8,  type: 'needs' },
  { category: 'entertainment', label: 'Loisirs',      percentage: 10, type: 'wants' },
  { category: 'clothing',      label: 'Vêtements',    percentage: 6,  type: 'wants' },
  { category: 'other_expense', label: 'Divers',       percentage: 4,  type: 'wants' },
  { category: 'savings',       label: 'Épargne',      percentage: 40, type: 'savings' },
];
