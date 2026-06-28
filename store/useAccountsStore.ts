import { create } from 'zustand';
import { Account, getAccounts, insertAccount, updateBalance, deleteAccount } from '../db/accounts';
import { insertTransfer } from '../db/transfers';

interface AccountsState {
  accounts: Account[];
  load: () => void;
  addAccount: (a: Omit<Account, 'id'>) => void;
  setBalance: (id: number, balance: number) => void;
  removeAccount: (id: number) => void;
  transfer: (from: number, to: number, amount: number, date: string, note: string) => void;
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  load: () => set({ accounts: getAccounts() }),
  addAccount: (a) => { insertAccount(a); set({ accounts: getAccounts() }); },
  setBalance: (id, balance) => { updateBalance(id, balance); set({ accounts: getAccounts() }); },
  removeAccount: (id) => { deleteAccount(id); set({ accounts: getAccounts() }); },
  transfer: (from, to, amount, date, note) => {
    insertTransfer({ from_account: from, to_account: to, amount, date, note });
    set({ accounts: getAccounts() });
  },
}));
