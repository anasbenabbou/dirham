import { Ionicons } from '@expo/vector-icons';

export type CategoryType = 'expense' | 'income';
/** Which 40/20/40 bucket an expense category rolls up into (parent of the category). */
export type BudgetGroup = 'needs' | 'wants' | 'savings';
export type IconName = keyof typeof Ionicons.glyphMap;

export interface Category {
  key: string;
  label: string;
  icon: IconName;
  color: string;
  type: CategoryType;
  /** Parent budget section — only meaningful for expense categories. */
  budget?: BudgetGroup;
  sort?: number;
}

/** Seeded once into SQLite on first run; afterwards the user owns the list. */
export const DEFAULT_CATEGORIES: Category[] = [
  // ── Besoins (needs) ──
  { key: 'food',          label: 'Alimentation',   icon: 'fast-food',       color: '#FF8A3D', type: 'expense', budget: 'needs' },
  { key: 'transport',     label: 'Transport',       icon: 'car-sport',       color: '#4D8DFF', type: 'expense', budget: 'needs' },
  { key: 'housing',       label: 'Logement',        icon: 'home',            color: '#8B7CFF', type: 'expense', budget: 'needs' },
  { key: 'utilities',     label: 'Factures',        icon: 'flash',           color: '#FFC53D', type: 'expense', budget: 'needs' },
  { key: 'health',        label: 'Santé',           icon: 'medkit',          color: '#FF5C7A', type: 'expense', budget: 'needs' },
  { key: 'education',     label: 'Éducation',       icon: 'school',          color: '#3DD6C4', type: 'expense', budget: 'needs' },
  // ── Envies (wants) ──
  { key: 'entertainment', label: 'Loisirs',         icon: 'game-controller', color: '#FF6FD8', type: 'expense', budget: 'wants' },
  { key: 'clothing',      label: 'Vêtements',       icon: 'shirt',           color: '#5CC8FF', type: 'expense', budget: 'wants' },
  { key: 'other_expense', label: 'Autre',           icon: 'ellipsis-horizontal', color: '#9AA7C0', type: 'expense', budget: 'wants' },
  // ── Épargne (savings — includes goals contributions) ──
  { key: 'emergency_fund',     label: "Fonds d'urgence", icon: 'shield-checkmark', color: '#0ECB81', type: 'expense', budget: 'savings' },
  { key: 'investment_savings', label: 'Investissement',  icon: 'trending-up',      color: '#F0B90B', type: 'expense', budget: 'savings' },
  { key: 'savings',            label: 'Objectifs',       icon: 'flag',             color: '#3DD6C4', type: 'expense', budget: 'savings' },
  // ── Revenus (income) ──
  { key: 'salary',        label: 'Salaire',         icon: 'briefcase',       color: '#0ECB81', type: 'income' },
  { key: 'freelance',     label: 'Freelance',       icon: 'laptop',          color: '#4D8DFF', type: 'income' },
  { key: 'investment',    label: 'Investissement',  icon: 'cash',            color: '#F0B90B', type: 'income' },
  { key: 'gift',          label: 'Cadeau',          icon: 'gift',            color: '#FF6FD8', type: 'income' },
  { key: 'other_income',  label: 'Autre revenu',    icon: 'add-circle',      color: '#3DD6C4', type: 'income' },
].map((c, i) => ({ ...c, sort: i } as Category));

export const FALLBACK_CATEGORY: Category = {
  key: 'other_expense', label: 'Autre', icon: 'ellipsis-horizontal', color: '#9AA7C0', type: 'expense',
};

/** Icon choices offered when creating/editing a category. */
export const CATEGORY_ICONS: IconName[] = [
  'fast-food', 'cafe', 'cart', 'basket', 'car-sport', 'bus', 'airplane', 'home',
  'flash', 'water', 'wifi', 'phone-portrait', 'medkit', 'fitness', 'school', 'book',
  'game-controller', 'film', 'musical-notes', 'shirt', 'gift', 'paw', 'construct', 'briefcase',
  'laptop', 'trending-up', 'cash', 'card', 'business', 'people', 'heart', 'star',
];

/** Color choices offered when creating/editing a category. */
export const CATEGORY_COLORS: string[] = [
  '#FF8A3D', '#4D8DFF', '#8B7CFF', '#FFC53D', '#FF5C7A', '#3DD6C4', '#FF6FD8', '#5CC8FF',
  '#0ECB81', '#F0B90B', '#3D7BFF', '#9AA7C0',
];
