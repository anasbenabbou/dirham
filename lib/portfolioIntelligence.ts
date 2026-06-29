import { Dividend } from '../db/dividends';
import { Holding } from '../db/holdings';
import { StockQuote } from '../api/mansa';
import { holdingPrice } from './finance';

export const MOROCCO_CAPITAL_GAINS_TAX_RATE = 0.15;
export const MOROCCO_SECURITIES_SALE_EXEMPTION_THRESHOLD = 30000;
export const MOROCCO_DIVIDEND_TAX_RATE_2025 = 0.125;

// Public search did not surface a reliable Simple/Attijari tariff sheet.
// Keep this explicit so the model is correct once the exact tariff is known.
export const SIMPLE_SELL_FEE_RATE = 0;

export type DividendConfidence = 'history' | 'season' | 'empty';

export interface PositionIntelligence {
  id: number;
  ticker: string;
  name: string;
  shares: number;
  price: number;
  cost: number;
  value: number;
  gain: number;
  gainPct: number;
  saleFees: number;
  taxIfSold: number;
  netValue: number;
  weight: number;
}

export interface PortfolioIntelligence {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  gainPct: number;
  taxIfSold: number;
  taxApplies: boolean;
  saleFees: number;
  feeRate: number;
  netLiquidation: number;
  netGain: number;
  netGainPct: number;
  positions: PositionIntelligence[];
  concentration: {
    topTicker: string | null;
    topWeight: number;
    largestTaxDragTicker: string | null;
    largestTaxDrag: number;
  };
}

export interface DividendWaterfallItem {
  ticker: string;
  companyName: string;
  expectedDate: string;
  amount: number | null;
  confidence: DividendConfidence;
  source: string;
}

const DEFAULT_DIVIDEND_SLOTS = [
  { month: 5, day: 31 },
  { month: 6, day: 30 },
  { month: 7, day: 31 },
] as const;

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

function nextAnnualDate(month: number, day: number, from = new Date()): string {
  const y = from.getFullYear();
  const candidate = new Date(Date.UTC(y, month - 1, day));
  const today = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  if (candidate >= today) return dateKey(candidate);
  return dateKey(new Date(Date.UTC(y + 1, month - 1, day)));
}

function nearestSeasonSlot(ticker: string): string {
  const n = ticker.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const slot = DEFAULT_DIVIDEND_SLOTS[n % DEFAULT_DIVIDEND_SLOTS.length];
  return nextAnnualDate(slot.month, slot.day);
}

export function buildPortfolioIntelligence(
  holdings: Holding[],
  quotes: Record<string, StockQuote>
): PortfolioIntelligence {
  const raw = holdings.map(h => {
    const price = holdingPrice(h, quotes);
    const value = h.shares * price;
    const cost = h.shares * h.buy_price;
    const saleFees = value * SIMPLE_SELL_FEE_RATE;
    const gain = value - saleFees - cost;
    return {
      id: h.id,
      ticker: h.ticker,
      name: quotes[h.ticker]?.name ?? h.company_name ?? h.ticker,
      shares: h.shares,
      price,
      cost,
      value,
      gain,
      gainPct: cost > 0 ? (gain / cost) * 100 : 0,
      saleFees,
      taxIfSold: 0,
      netValue: value - saleFees,
      weight: 0,
    };
  });

  const totalValue = raw.reduce((sum, p) => sum + p.value, 0);
  const totalCost = raw.reduce((sum, p) => sum + p.cost, 0);
  const saleFees = raw.reduce((sum, p) => sum + p.saleFees, 0);
  const totalGain = totalValue - saleFees - totalCost;
  const taxApplies = totalValue >= MOROCCO_SECURITIES_SALE_EXEMPTION_THRESHOLD;
  const taxedRaw = raw.map(p => {
    const taxIfSold = taxApplies ? Math.max(p.gain, 0) * MOROCCO_CAPITAL_GAINS_TAX_RATE : 0;
    return { ...p, taxIfSold, netValue: p.value - p.saleFees - taxIfSold };
  });
  const taxIfSold = taxedRaw.reduce((sum, p) => sum + p.taxIfSold, 0);
  const netLiquidation = totalValue - saleFees - taxIfSold;
  const netGain = netLiquidation - totalCost;
  const positions = taxedRaw
    .map(p => ({ ...p, weight: totalValue > 0 ? p.value / totalValue : 0 }))
    .sort((a, b) => b.value - a.value);

  const top = positions[0] ?? null;
  const taxDrag = [...positions].sort((a, b) => b.taxIfSold - a.taxIfSold)[0] ?? null;

  return {
    totalValue,
    totalCost,
    totalGain,
    gainPct: totalCost > 0 ? (totalGain / totalCost) * 100 : 0,
    taxIfSold,
    taxApplies,
    saleFees,
    feeRate: SIMPLE_SELL_FEE_RATE,
    netLiquidation,
    netGain,
    netGainPct: totalCost > 0 ? (netGain / totalCost) * 100 : 0,
    positions,
    concentration: {
      topTicker: top?.ticker ?? null,
      topWeight: top?.weight ?? 0,
      largestTaxDragTicker: taxDrag?.ticker ?? null,
      largestTaxDrag: taxDrag?.taxIfSold ?? 0,
    },
  };
}

export function buildDividendWaterfall(
  holdings: Holding[],
  dividends: Dividend[],
  horizonMonths = 12
): DividendWaterfallItem[] {
  const today = new Date();
  const horizon = new Date(today);
  horizon.setMonth(horizon.getMonth() + horizonMonths);

  return holdings
    .map(h => {
      const history = dividends
        .filter(d => d.ticker === h.ticker)
        .sort((a, b) => b.date.localeCompare(a.date));

      if (history.length > 0) {
        const latest = history[0];
        const latestDate = new Date(`${latest.date}T00:00:00Z`);
        const expectedDate = nextAnnualDate(latestDate.getUTCMonth() + 1, latestDate.getUTCDate(), today);
        const amount = latest.amount;
        return {
          ticker: h.ticker,
          companyName: h.company_name || h.ticker,
          expectedDate,
          amount,
          confidence: 'history' as const,
          source: 'Dernier dividende enregistré',
        };
      }

      return {
        ticker: h.ticker,
        companyName: h.company_name || h.ticker,
        expectedDate: nearestSeasonSlot(h.ticker),
        amount: null,
        confidence: 'season' as const,
        source: 'Fenêtre saisonnière BVC',
      };
    })
    .filter(x => {
      const d = new Date(`${x.expectedDate}T00:00:00Z`);
      return d <= horizon;
    })
    .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
}
