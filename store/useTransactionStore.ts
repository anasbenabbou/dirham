import { create } from 'zustand';
import {
  Transaction, insertTransaction, getTransactions,
  deleteTransaction, getMonthlyTotals, getMonthlyByCategory,
} from '../db/transactions';

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

interface TransactionStore {
  transactions: Transaction[];
  monthlyTotals: { income: number; expenses: number };
  byCategory: Record<string, number>;
  currentMonth: string;
  loadMonth: (month: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: number) => void;
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
    insertTransaction(t);
    get().loadMonth(get().currentMonth);
  },

  removeTransaction(id) {
    deleteTransaction(id);
    get().loadMonth(get().currentMonth);
  },
}));
