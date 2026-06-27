import { Ionicons } from '@expo/vector-icons';

export type CategoryType = 'expense' | 'income';
type IconName = keyof typeof Ionicons.glyphMap;

export interface Category {
  key: string;
  label: string;
  /** Ionicons glyph — the production icon system */
  icon: IconName;
  /** Accent color for the icon chip */
  color: string;
  /** Kept for legacy/quick reference, no longer rendered as the icon */
  emoji: string;
  type: CategoryType;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { key: 'food',          label: 'Alimentation', icon: 'fast-food',         color: '#FF8A3D', emoji: '🍔', type: 'expense' },
  { key: 'transport',     label: 'Transport',     icon: 'car-sport',         color: '#4D8DFF', emoji: '🚗', type: 'expense' },
  { key: 'housing',       label: 'Logement',      icon: 'home',              color: '#8B7CFF', emoji: '🏠', type: 'expense' },
  { key: 'utilities',     label: 'Factures',      icon: 'flash',             color: '#FFC53D', emoji: '💡', type: 'expense' },
  { key: 'health',        label: 'Santé',         icon: 'medkit',            color: '#FF5C7A', emoji: '🏥', type: 'expense' },
  { key: 'education',     label: 'Éducation',     icon: 'school',            color: '#3DD6C4', emoji: '📚', type: 'expense' },
  { key: 'entertainment', label: 'Loisirs',       icon: 'game-controller',   color: '#FF6FD8', emoji: '🎬', type: 'expense' },
  { key: 'clothing',      label: 'Vêtements',     icon: 'shirt',             color: '#5CC8FF', emoji: '👕', type: 'expense' },
  { key: 'other_expense', label: 'Autre',         icon: 'ellipsis-horizontal', color: '#9AA7C0', emoji: '📦', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { key: 'salary',        label: 'Salaire',        icon: 'briefcase',        color: '#0ECB81', emoji: '💼', type: 'income' },
  { key: 'freelance',     label: 'Freelance',      icon: 'laptop',           color: '#4D8DFF', emoji: '💻', type: 'income' },
  { key: 'investment',    label: 'Investissement', icon: 'trending-up',      color: '#F0B90B', emoji: '📈', type: 'income' },
  { key: 'gift',          label: 'Cadeau',         icon: 'gift',             color: '#FF6FD8', emoji: '🎁', type: 'income' },
  { key: 'other_income',  label: 'Autre revenu',   icon: 'add-circle',       color: '#3DD6C4', emoji: '💰', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryByKey(key: string): Category {
  return ALL_CATEGORIES.find(c => c.key === key) ?? {
    key: 'other_expense', label: 'Autre', icon: 'ellipsis-horizontal', color: '#9AA7C0', emoji: '📦', type: 'expense',
  };
}
