import { create } from 'zustand';

interface UIState {
  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  quickAddOpen: false,
  openQuickAdd:  () => set({ quickAddOpen: true, menuOpen: false }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  menuOpen: false,
  openMenu:  () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
}));
