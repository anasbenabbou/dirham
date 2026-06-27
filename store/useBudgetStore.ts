import { create } from 'zustand';
import { Budget, upsertBudget, getBudgetsForMonth } from '../db/budgets';

interface BudgetStore {
  budgets: Budget[];
  currentMonth: string;
  loadMonth: (month: string) => void;
  setBudget: (category: string, limit: number, month: string) => void;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],
  currentMonth: new Date().toISOString().slice(0, 7),

  loadMonth(month) {
    set({ budgets: getBudgetsForMonth(month), currentMonth: month });
  },

  setBudget(category, limit, month) {
    upsertBudget(category, limit, month);
    get().loadMonth(month);
  },
}));
