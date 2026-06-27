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

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
};

// ── Stock quotes via LeBoursier.ma ──────────────────────────────────────────
export async function fetchQuotes(tickers: string[]): Promise<Record<string, StockQuote>> {
  if (tickers.length === 0) return {};
  const results: Record<string, StockQuote> = {};

  await Promise.allSettled(tickers.map(async (ticker) => {
    try {
      // Try LeBoursier.ma first
      const res = await fetch(
        `https://www.leboursier.ma/api?method=getStockInfo&format=json&search=${encodeURIComponent(ticker)}`,
        { headers: HEADERS }
      );
      if (res.ok) {
        const json = await res.json();
        const data = json?.result?.[0] ?? json?.[0];
        if (data) {
          const price = parseFloat(data.lastPrice ?? data.price ?? data.cours ?? 0);
          const prev  = parseFloat(data.previousPrice ?? data.referencePrice ?? price);
          const change = price - prev;
          if (price > 0) {
            results[ticker] = {
              ticker,
              name: data.name ?? data.stockName ?? ticker,
              price,
              change,
              changePercent: prev > 0 ? (change / prev) * 100 : 0,
            };
            return;
          }
        }
      }
      // Fallback: Yahoo Finance
      const yRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker + '.CS')}?interval=1d&range=1d`,
        { headers: { Accept: 'application/json' } }
      );
      if (!yRes.ok) return;
      const yJson = await yRes.json();
      const meta = yJson?.chart?.result?.[0]?.meta;
      if (!meta) return;
      const price = meta.regularMarketPrice ?? 0;
      const prev  = meta.previousClose ?? price;
      const change = price - prev;
      results[ticker] = {
        ticker,
        name: meta.shortName ?? ticker,
        price,
        change,
        changePercent: prev > 0 ? (change / prev) * 100 : 0,
      };
    } catch { /* offline — caller shows buy price */ }
  }));

  return results;
}

// ── MASI index via Yahoo Finance chart (5d range = always has data) ─────────
export async function fetchMasi(): Promise<IndexQuote | null> {
  try {
    // v8 chart with 5d range: weekend/holiday-proof, no auth needed
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EMASI?interval=1d&range=5d',
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
    const nonNull = closes.filter((c): c is number => c != null);
    if (nonNull.length < 2) return null;
    const value  = nonNull[nonNull.length - 1];
    const prev   = nonNull[nonNull.length - 2];
    const change = value - prev;
    return { value, change, changePercent: prev > 0 ? (change / prev) * 100 : 0 };
  } catch {
    return null;
  }
}
