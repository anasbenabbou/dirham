import { create } from 'zustand';
import { Goal, insertGoal, getGoals, updateGoalAmount, deleteGoal } from '../db/goals';
import { adjustBalance, ensureDefaultAccount } from '../db/accounts';
import { insertTransaction } from '../db/transactions';
import { useAccountsStore } from './useAccountsStore';
import { useTransactionStore } from './useTransactionStore';
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
    const src = accountId ?? ensureDefaultAccount();
    const newAmount = goal.current_amount + amount;
    const wasComplete = goal.current_amount >= goal.target_amount;
    const today = new Date().toISOString().slice(0, 10);

    // 1. Record as an expense transaction so it hits the budget + history
    insertTransaction({
      amount, category: 'savings', note: `Objectif : ${goal.name}`,
      date: today, type: 'expense', account_id: src,
    });
    // 2. Deduct account balance
    adjustBalance(src, -amount);
    // 3. Credit the goal
    updateGoalAmount(id, newAmount, goal.target_amount);

    useAccountsStore.getState().load();
    useTransactionStore.getState().loadMonth(today.slice(0, 7));
    get().load();
    if (!wasComplete && newAmount >= goal.target_amount) {
      notifyNow('Objectif atteint 🎉', `« ${goal.name} » — ${fmtMAD(goal.target_amount)} atteint !`);
    }
  },

  withdraw(id, amount, accountId) {
    const goal = get().goals.find(g => g.id === id);
    if (!goal) return;
    const dest = accountId ?? ensureDefaultAccount();
    const taken = Math.min(amount, goal.current_amount);
    const today = new Date().toISOString().slice(0, 10);

    // Record as income so the budget + history are consistent on reversal
    insertTransaction({
      amount: taken, category: 'savings', note: `Retrait objectif : ${goal.name}`,
      date: today, type: 'income', account_id: dest,
    });
    adjustBalance(dest, taken);
    updateGoalAmount(id, goal.current_amount - taken, goal.target_amount);

    useAccountsStore.getState().load();
    useTransactionStore.getState().loadMonth(today.slice(0, 7));
    get().load();
  },

  removeGoal(id) {
    const goal = get().goals.find(g => g.id === id);
    // Return locked money to cash so net worth is conserved — record as income
    if (goal && goal.current_amount > 0) {
      const cashId = ensureDefaultAccount();
      const today = new Date().toISOString().slice(0, 10);
      insertTransaction({
        amount: goal.current_amount, category: 'savings',
        note: `Objectif supprimé : ${goal.name}`,
        date: today, type: 'income', account_id: cashId,
      });
      adjustBalance(cashId, goal.current_amount);
      useAccountsStore.getState().load();
      useTransactionStore.getState().loadMonth(today.slice(0, 7));
    }
    deleteGoal(id);
    get().load();
  },
}));
