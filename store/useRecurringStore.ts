import { create } from 'zustand';
import {
  Recurring, getRecurring, insertRecurring, setRecurringActive, deleteRecurring,
} from '../db/recurring';

interface RecurringStore {
  rules: Recurring[];
  load: () => void;
  add: (r: Omit<Recurring, 'id' | 'active'>) => void;
  toggle: (id: number, active: boolean) => void;
  remove: (id: number) => void;
}

export const useRecurringStore = create<RecurringStore>((set, get) => ({
  rules: [],
  load: () => set({ rules: getRecurring() }),
  add: (r) => { insertRecurring(r); get().load(); },
  toggle: (id, active) => { setRecurringActive(id, active); get().load(); },
  remove: (id) => { deleteRecurring(id); get().load(); },
}));
