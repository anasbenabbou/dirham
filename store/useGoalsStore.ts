import { create } from 'zustand';
import { Goal, insertGoal, getGoals, updateGoalAmount, deleteGoal } from '../db/goals';
import { adjustBalance, ensureDefaultAccount } from '../db/accounts';
import { useAccountsStore } from './useAccountsStore';
import { notifyNow } from '../lib/notifications';
import { fmtMAD } from '../lib/format';

interface GoalsStore {
  goals: Goal[];
  load: () => void;
  addGoal: (g: Omit<Goal, 'id' | 'current_amount' | 'completed'>) => void;
  /** Moves `amount` from `accountId` (if given) into the goal. */
  deposit: (id: number, amount: number, accountId?: number | null) => void;
  /** Pulls `amount` back out of the goal into `accountId` (if given). */
  withdraw: (id: number, amount: number, accountId?: number | null) => void;
  removeGoal: (id: number) => void;
}

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: [],

  load() { set({ goals: getGoals() }); },

  addGoal(g) { insertGoal(g); get().load(); },

  deposit(id, amount, accountId) {
    const goal = get().goals.find(g => g.id === id);
    if (!goal) return;
    const src = accountId ?? ensureDefaultAccount();   // money always comes from somewhere
    const newAmount = goal.current_amount + amount;
    const wasComplete = goal.current_amount >= goal.target_amount;
    updateGoalAmount(id, newAmount, goal.target_amount);
    adjustBalance(src, -amount);
    useAccountsStore.getState().load();
    get().load();
    if (!wasComplete && newAmount >= goal.target_amount) {
      notifyNow('Objectif atteint 🎉', `« ${goal.name} » — ${fmtMAD(goal.target_amount)} atteint !`);
    }
  },

  withdraw(id, amount, accountId) {
    const goal = get().goals.find(g => g.id === id);
    if (!goal) return;
    const dest = accountId ?? ensureDefaultAccount();  // money always goes somewhere
    const taken = Math.min(amount, goal.current_amount);
    updateGoalAmount(id, goal.current_amount - taken, goal.target_amount);
    adjustBalance(dest, taken);
    useAccountsStore.getState().load();
    get().load();
  },

  removeGoal(id) {
    const goal = get().goals.find(g => g.id === id);
    // Return any money still in the goal so net worth stays conserved.
    if (goal && goal.current_amount > 0) {
      adjustBalance(ensureDefaultAccount(), goal.current_amount);
      useAccountsStore.getState().load();
    }
    deleteGoal(id);
    get().load();
  },
}));
