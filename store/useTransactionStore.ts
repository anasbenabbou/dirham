import { create } from 'zustand';
import {
  Transaction, insertTransaction, getTransactions, getTransactionById,
  updateTransaction, deleteTransaction, getMonthlyTotals, getMonthlyByCategory,
} from '../db/transactions';
import { getBudgetsForMonth } from '../db/budgets';
import { adjustBalance, ensureDefaultAccount } from '../db/accounts';
import { useAccountsStore } from './useAccountsStore';
import { getCategoryByKey } from '../db/categories';
import { notifyNow } from '../lib/notifications';
import { fmtMAD } from '../lib/format';

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Signed effect of a transaction on its linked account balance. */
function balanceDelta(t: { type: 'income' | 'expense'; amount: number }): number {
  return t.type === 'income' ? t.amount : -t.amount;
}

interface TransactionStore {
  transactions: Transaction[];
  monthlyTotals: { income: number; expenses: number };
  byCategory: Record<string, number>;
  currentMonth: string;
  loadMonth: (month: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  editTransaction: (t: Transaction) => void;
  removeTransaction: (id: number) => void;
}

function checkBudgetAlert(category: string, month: string) {
  if (month !== thisMonth()) return;
  const budget = getBudgetsForMonth(month).find(b => b.category === category);
  if (!budget) return;
  const spent = getMonthlyByCategory(month)[category] ?? 0;
  if (spent > budget.monthly_limit) {
    const cat = getCategoryByKey(category);
    notifyNow('Budget dépassé', `${cat.label} : ${fmtMAD(spent)} / ${fmtMAD(budget.monthly_limit)}`);
  }
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  monthlyTotals: { income: 0, expenses: 0 },
  byCategory: {},
  currentMonth: thisMonth(),

  loadMonth(month) {
    set({
      transactions: getTransactions(month),
      monthlyTotals: getMonthlyTotals(month),
      byCategory: getMonthlyByCategory(month),
      currentMonth: month,
    });
  },

  addTransaction(t) {
    // Every transaction must land in a real account — no phantom money.
    const account_id = t.account_id ?? ensureDefaultAccount();
    insertTransaction({ ...t, account_id });
    adjustBalance(account_id, balanceDelta(t));
    useAccountsStore.getState().load();
    get().loadMonth(get().currentMonth);
    if (t.type === 'expense') checkBudgetAlert(t.category, t.date.slice(0, 7));
  },

  editTransaction(t) {
    const old = getTransactionById(t.id);
    // reverse the old account effect, then apply the new one
    if (old?.account_id != null) adjustBalance(old.account_id, -balanceDelta(old));
    updateTransaction(t);
    if (t.account_id != null) adjustBalance(t.account_id, balanceDelta(t));
    if (old?.account_id != null || t.account_id != null) useAccountsStore.getState().load();
    get().loadMonth(get().currentMonth);
  },

  removeTransaction(id) {
    const old = getTransactionById(id);
    deleteTransaction(id);
    if (old?.account_id != null) {
      adjustBalance(old.account_id, -balanceDelta(old));
      useAccountsStore.getState().load();
    }
    get().loadMonth(get().currentMonth);
  },
}));
