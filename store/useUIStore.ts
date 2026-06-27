import { create } from 'zustand';

interface UIState {
  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  quickAddOpen: false,
  openQuickAdd:  () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
}));
