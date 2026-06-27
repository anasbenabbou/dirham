import { create } from 'zustand';
import { Goal, insertGoal, getGoals, updateGoalAmount, deleteGoal } from '../db/goals';

interface GoalsStore {
  goals: Goal[];
  load: () => void;
  addGoal: (g: Omit<Goal, 'id' | 'current_amount' | 'completed'>) => void;
  deposit: (id: number, amount: number) => void;
  removeGoal: (id: number) => void;
}

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: [],

  load() {
    set({ goals: getGoals() });
  },

  addGoal(g) {
    insertGoal(g);
    get().load();
  },

  deposit(id, amount) {
    const goal = get().goals.find(g => g.id === id);
    if (!goal) return;
    updateGoalAmount(id, goal.current_amount + amount, goal.target_amount);
    get().load();
  },

  removeGoal(id) {
    deleteGoal(id);
    get().load();
  },
}));
