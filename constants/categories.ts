export type CategoryType = 'expense' | 'income';

export interface Category {
  key: string;
  label: string;
  emoji: string;
  type: CategoryType;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { key: 'food', label: 'Alimentation', emoji: '🍔', type: 'expense' },
  { key: 'transport', label: 'Transport', emoji: '🚗', type: 'expense' },
  { key: 'housing', label: 'Logement', emoji: '🏠', type: 'expense' },
  { key: 'utilities', label: 'Factures', emoji: '💡', type: 'expense' },
  { key: 'health', label: 'Santé', emoji: '🏥', type: 'expense' },
  { key: 'education', label: 'Éducation', emoji: '📚', type: 'expense' },
  { key: 'entertainment', label: 'Loisirs', emoji: '🎬', type: 'expense' },
  { key: 'clothing', label: 'Vêtements', emoji: '👕', type: 'expense' },
  { key: 'other_expense', label: 'Autre', emoji: '📦', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { key: 'salary', label: 'Salaire', emoji: '💼', type: 'income' },
  { key: 'freelance', label: 'Freelance', emoji: '💻', type: 'income' },
  { key: 'investment', label: 'Investissement', emoji: '📈', type: 'income' },
  { key: 'gift', label: 'Cadeau', emoji: '🎁', type: 'income' },
  { key: 'other_income', label: 'Autre revenu', emoji: '💰', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryByKey(key: string): Category {
  return ALL_CATEGORIES.find(c => c.key === key) ?? {
    key: 'other_expense', label: 'Autre', emoji: '📦', type: 'expense',
  };
}
