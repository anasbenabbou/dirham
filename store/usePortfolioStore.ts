import { create } from 'zustand';
import { Holding, insertHolding, getHoldings, deleteHolding } from '../db/holdings';
import { WatchItem, getWatchlist, addToWatchlist, removeFromWatchlist } from '../db/watchlist';
import { Dividend, getDividends, insertDividend, deleteDividend, totalDividends } from '../db/dividends';
import { Instrument, getInstruments, upsertInstruments } from '../db/instruments';
import { fetchMarket, fetchMasi, fetchInstruments, StockQuote, IndexQuote, MarketRow } from '../api/mansa';

interface PortfolioStore {
  holdings: Holding[];
  watchlist: WatchItem[];
  dividends: Dividend[];
  dividendTotal: number;
  quotes: Record<string, StockQuote>;
  market: MarketRow[];
  masi: IndexQuote | null;
  loading: boolean;
  error: string | null;
  instruments: Instrument[];
  instrumentsSyncing: boolean;
  loadHoldings: () => void;
  loadWatchlist: () => void;
  loadDividends: () => void;
  loadInstruments: () => void;
  syncInstruments: () => Promise<void>;
  addHolding: (h: Omit<Holding, 'id'>) => void;
  removeHolding: (id: number) => void;
  watch: (ticker: string, name: string) => void;
  unwatch: (ticker: string) => void;
  addDividend: (d: Omit<Dividend, 'id'>) => void;
  removeDividend: (id: number) => void;
  refreshPrices: () => Promise<void>;
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  holdings: [],
  watchlist: [],
  dividends: [],
  dividendTotal: 0,
  quotes: {},
  market: [],
  masi: null,
  loading: false,
  error: null,
  instruments: [],
  instrumentsSyncing: false,

  loadHoldings() { set({ holdings: getHoldings() }); },
  loadWatchlist() { set({ watchlist: getWatchlist() }); },
  loadDividends() { set({ dividends: getDividends(), dividendTotal: totalDividends() }); },
  loadInstruments() { set({ instruments: getInstruments() }); },

  async syncInstruments() {
    set({ instrumentsSyncing: true });
    try {
      const list = await fetchInstruments();
      if (list.length) {
        upsertInstruments(list.map(i => ({ symbol: i.symbol, name: i.name, klass: i.klass, sector: '' })));
        set({ instruments: getInstruments() });
      }
    } catch { /* keep cached list */ }
    set({ instrumentsSyncing: false });
  },

  addHolding(h) { insertHolding(h); get().loadHoldings(); },
  removeHolding(id) { deleteHolding(id); get().loadHoldings(); },

  watch(ticker, name) { addToWatchlist(ticker, name); get().loadWatchlist(); },
  unwatch(ticker) { removeFromWatchlist(ticker); get().loadWatchlist(); },

  addDividend(d) { insertDividend(d); get().loadDividends(); },
  removeDividend(id) { deleteDividend(id); get().loadDividends(); },

  async refreshPrices() {
    set({ loading: true, error: null });
    try {
      const [market, masi] = await Promise.all([fetchMarket(), fetchMasi()]);
      // Derive the per-ticker quote map (used by holdings, watchlist, detail).
      const quotes: Record<string, StockQuote> = {};
      for (const m of market) {
        const prev = m.prevClose ?? (m.varDay ? m.last / (1 + m.varDay / 100) : m.last);
        quotes[m.ticker] = { ticker: m.ticker, name: m.name, price: m.last, change: m.last - prev, changePercent: m.varDay };
      }
      set({ market, quotes, masi, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Erreur réseau' });
    }
  },
}));
