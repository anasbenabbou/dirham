import { create } from 'zustand';
import { Category, CategoryType } from '../constants/categories';
import { getCategories, insertCategory, deleteCategory } from '../db/categories';

interface CategoriesStore {
  categories: Category[];
  load: () => void;
  add: (c: Category) => void;
  update: (c: Category) => void;
  remove: (key: string) => void;
  byType: (type: CategoryType) => Category[];
}

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: [],
  load: () => set({ categories: getCategories() }),
  add: (c) => { insertCategory(c); set({ categories: getCategories() }); },
  update: (c) => { insertCategory(c); set({ categories: getCategories() }); },
  remove: (key) => { deleteCategory(key); set({ categories: getCategories() }); },
  byType: (type) => get().categories.filter(c => c.type === type),
}));
