export interface BudgetRule {
  category: string;
  label: string;
  emoji: string;
  percentage: number;
  type: '50' | '30' | '20';
}

export const DEFAULT_BUDGET_RULES: BudgetRule[] = [
  { category: 'housing',       label: 'Logement',      emoji: '🏠', percentage: 25, type: '50' },
  { category: 'food',          label: 'Alimentation',   emoji: '🍔', percentage: 15, type: '50' },
  { category: 'transport',     label: 'Transport',      emoji: '🚗', percentage: 10, type: '50' },
  { category: 'entertainment', label: 'Loisirs',        emoji: '🎬', percentage: 15, type: '30' },
  { category: 'clothing',      label: 'Vêtements',      emoji: '👕', percentage: 10, type: '30' },
  { category: 'other_expense', label: 'Divers',         emoji: '📦', percentage:  5, type: '30' },
  { category: 'savings',       label: 'Épargne',        emoji: '🏦', percentage: 20, type: '20' },
];

export const BUDGET_SECTIONS = {
  '50': { label: 'Besoins (50%)', color: '#2563eb' },
  '30': { label: 'Envies (30%)',  color: '#7c3aed' },
  '20': { label: 'Épargne (20%)', color: '#16a34a' },
} as const;
