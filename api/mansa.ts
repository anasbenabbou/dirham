import { BVC_STOCKS } from '../constants/bvcStocks';

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface IndexQuote {
  value: number;
  change: number;
  changePercent: number;
}

/**
 * Live data from the OFFICIAL Bourse de Casablanca API (the same backend the
 * casablanca-bourse.com site uses). No API key required.
 *   equities: /fr/api/bourse_data/market_watch   (ticker = `code` prefix)
 *   indices : /fr/api/bourse_data/index_watch     (MASI = code "MASI")
 * The user's money/data stays local — only market prices come from the network.
 */
const API = 'https://api.casablanca-bourse.com/fr/api/bourse_data';

const num = (v: any): number | null => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

async function fetchJson(url: string, timeoutMs = 12000): Promise<any | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const nameFor = (ticker: string) => BVC_STOCKS.find(s => s.ticker === ticker)?.name ?? ticker;

// ── Stock quotes ────────────────────────────────────────────────────────────
export async function fetchQuotes(tickers: string[]): Promise<Record<string, StockQuote>> {
  if (tickers.length === 0) return {};

  // Two newest pages cover the full ~76-stock snapshot; dedupe to latest per ticker.
  // NOTE: brackets MUST be %5B/%5D encoded — React Native's fetch fails on literal [].
  const base = `${API}/market_watch`
    + `?filter%5Bpublished%5D%5Bvalue%5D=1&sort=-drupal_internal__id`
    + `&fields%5Bmarket_watch%5D=code,coursCourant,coursCloture,varVeille`
    + `&page%5Blimit%5D=50`;

  const latest: Record<string, { price: number; pct: number }> = {};
  for (const offset of [0, 50]) {
    const json = await fetchJson(`${base}&page%5Boffset%5D=${offset}`);
    const rows: any[] = json?.data ?? [];
    for (const row of rows) {
      const a = row.attributes ?? {};
      const ticker = String(a.code ?? '').split('-')[0];
      if (!ticker || latest[ticker]) continue; // first (newest) wins
      const price = num(a.coursCourant) ?? num(a.coursCloture);
      if (price == null) continue;
      latest[ticker] = { price, pct: num(a.varVeille) ?? 0 };
    }
  }

  const out: Record<string, StockQuote> = {};
  for (const ticker of tickers) {
    const q = latest[ticker];
    if (!q) continue;
    const prev = q.pct !== 0 ? q.price / (1 + q.pct / 100) : q.price;
    out[ticker] = {
      ticker,
      name: nameFor(ticker),
      price: q.price,
      change: q.price - prev,
      changePercent: q.pct,
    };
  }
  return out;
}

// ── MASI index ──────────────────────────────────────────────────────────────
// The feed holds many intraday MASI snapshots; pick the most recent by transactTime.
export async function fetchMasi(): Promise<IndexQuote | null> {
  const json = await fetchJson(
    `${API}/index_watch?filter%5Bpublished%5D%5Bvalue%5D=1`
    + `&fields%5Bindex_watch%5D=code,indexValue,indexVeilleValue,indexClotureValue,varVeille,transactTime&page%5Blimit%5D=150`
  );
  const rows: any[] = json?.data ?? [];
  let best: { a: any; t: string } | null = null;
  for (const row of rows) {
    const a = row.attributes ?? {};
    if (String(a.code ?? '').split('-')[0] !== 'MASI') continue; // headline MASI only
    if (num(a.indexValue) == null && num(a.indexClotureValue) == null && num(a.indexVeilleValue) == null) continue;
    const t = String(a.transactTime ?? '');
    if (!best || t > best.t) best = { a, t }; // ISO timestamps sort lexically
  }
  if (!best) return null;
  const a = best.a;
  const value = num(a.indexValue) ?? num(a.indexClotureValue) ?? num(a.indexVeilleValue)!;
  const prev = num(a.indexVeilleValue) ?? value;
  const pct = num(a.varVeille) ?? (prev > 0 ? ((value - prev) / prev) * 100 : 0);
  return { value, change: value - prev, changePercent: pct };
}

// ── Full instrument universe (for the picker) ────────────────────────────────
export interface ApiInstrument {
  symbol: string;
  name: string;
  klass: 'action' | 'obligation' | 'fond' | 'droit';
}

// codeClasse.field_code → our label. (10 = funds, usually empty on the exchange.)
const CLASSES: { code: string; klass: ApiInstrument['klass'] }[] = [
  { code: '1', klass: 'action' },
  { code: '5', klass: 'obligation' },
  { code: '10', klass: 'fond' },
];

// ── Full market snapshot (rich, all stocks) ─────────────────────────────────
export interface MarketRow {
  ticker: string;
  name: string;
  last: number;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  volume: number | null;
  marketCap: number | null;
  varDay: number;       // % vs previous close
  varYear: number | null; // % year-to-date
}

/** Current snapshot of every traded equity (2 newest pages → ~76 stocks). */
export async function fetchMarket(): Promise<MarketRow[]> {
  const base = `${API}/market_watch`
    + `?filter%5Bpublished%5D%5Bvalue%5D=1&sort=-drupal_internal__id`
    + `&fields%5Bmarket_watch%5D=code,coursCourant,coursCloture,openingPrice,highPrice,lowPrice,dynamicReferencePrice,cumulVolumeEchange,capitalisation,varVeille,instrumentVarYear`
    + `&page%5Blimit%5D=50`;
  const seen: Record<string, MarketRow> = {};
  for (const offset of [0, 50]) {
    const json = await fetchJson(`${base}&page%5Boffset%5D=${offset}`);
    for (const row of json?.data ?? []) {
      const a = row.attributes ?? {};
      const ticker = String(a.code ?? '').split('-')[0];
      if (!ticker || seen[ticker]) continue;
      const last = num(a.coursCourant) ?? num(a.coursCloture);
      if (last == null) continue;
      seen[ticker] = {
        ticker, name: nameFor(ticker), last,
        open: num(a.openingPrice), high: num(a.highPrice), low: num(a.lowPrice),
        prevClose: num(a.dynamicReferencePrice),
        volume: num(a.cumulVolumeEchange), marketCap: num(a.capitalisation),
        varDay: num(a.varVeille) ?? 0, varYear: num(a.instrumentVarYear),
      };
    }
  }
  return Object.values(seen);
}

// ── Daily price history (for charts) ─────────────────────────────────────────
export interface Candle {
  date: string; // YYYY-MM-DD
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
}

/** Daily OHLC history for a ticker, oldest→newest. ~50 rows/page; default ~1 year. */
export async function fetchHistory(ticker: string, maxPages = 5): Promise<Candle[]> {
  let url: string | null =
    `${API}/instrument_history?filter%5Bpublished%5D%5Bvalue%5D=1`
    + `&filter%5Bsymbol.symbol%5D=${encodeURIComponent(ticker)}&sort=-drupal_internal__id`
    + `&fields%5Binstrument_history%5D=code,coursAjuste,closingPrice,openingPrice,highPrice,lowPrice,cumulVolumeEchange`
    + `&page%5Blimit%5D=50`;
  const out: Candle[] = [];
  let pages = 0;
  while (url && pages < maxPages) {
    const json: any = await fetchJson(url);
    if (!json) break;
    for (const x of json.data ?? []) {
      const a = x.attributes ?? {};
      const ds = String(a.code ?? '').split('-')[1] ?? '';
      if (ds.length < 8) continue;
      const close = num(a.coursAjuste) ?? num(a.closingPrice);
      if (close == null) continue;
      out.push({
        date: `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`,
        close, open: num(a.openingPrice), high: num(a.highPrice), low: num(a.lowPrice),
        volume: num(a.cumulVolumeEchange),
      });
    }
    url = json.links?.next?.href ?? null;
    pages++;
  }
  return out.reverse(); // oldest → newest for charting
}

/** Fetches every listed instrument (paginated, following links.next). */
export async function fetchInstruments(): Promise<ApiInstrument[]> {
  const out: ApiInstrument[] = [];
  for (const { code, klass } of CLASSES) {
    let url: string | null =
      `${API}/instrument?filter%5Bpublished%5D%5Bvalue%5D=1`
      + `&filter%5Bcls%5D%5Bcondition%5D%5Bpath%5D=codeClasse.field_code`
      + `&filter%5Bcls%5D%5Bcondition%5D%5Bvalue%5D=${code}`
      + `&filter%5Bcls%5D%5Bcondition%5D%5Boperator%5D==`
      + `&fields%5Binstrument%5D=symbol,libelleFR&page%5Blimit%5D=50`;
    let pages = 0;
    while (url && pages < 12) {
      const json: any = await fetchJson(url);
      if (!json) break;
      for (const x of json.data ?? []) {
        const symbol = x.attributes?.symbol;
        if (!symbol) continue;
        out.push({ symbol, name: x.attributes?.libelleFR || symbol, klass });
      }
      url = json.links?.next?.href ?? null; // API returns properly-encoded next links
      pages++;
    }
  }
  return out;
}
