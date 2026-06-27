import { create } from 'zustand';
import { Holding, insertHolding, getHoldings, deleteHolding } from '../db/holdings';
import { fetchQuotes, fetchMasi, StockQuote, IndexQuote } from '../api/mansa';

interface PortfolioStore {
  holdings: Holding[];
  quotes: Record<string, StockQuote>;
  masi: IndexQuote | null;
  loading: boolean;
  error: string | null;
  loadHoldings: () => void;
  addHolding: (h: Omit<Holding, 'id'>) => void;
  removeHolding: (id: number) => void;
  refreshPrices: () => Promise<void>;
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  holdings: [],
  quotes: {},
  masi: null,
  loading: false,
  error: null,

  loadHoldings() {
    set({ holdings: getHoldings() });
  },

  addHolding(h) {
    insertHolding(h);
    get().loadHoldings();
  },

  removeHolding(id) {
    deleteHolding(id);
    get().loadHoldings();
  },

  async refreshPrices() {
    const { holdings } = get();
    set({ loading: true, error: null });
    try {
      const [quotes, masi] = await Promise.all([
        holdings.length > 0 ? fetchQuotes(holdings.map(h => h.ticker)) : Promise.resolve({}),
        fetchMasi(),
      ]);
      set({ quotes, masi, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Erreur réseau' });
    }
  },
}));
