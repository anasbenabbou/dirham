import { Account } from '../db/accounts';
import { Holding } from '../db/holdings';
import { IndexQuote, MarketRow } from '../api/mansa';
import { PortfolioIntelligence } from './portfolioIntelligence';

export type CoachStance = 'cash' | 'watch' | 'deploy' | 'rebalance';

export interface CoachSignal {
  label: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface CoachCandidate {
  ticker: string;
  name: string;
  price: number;
  dayChange: number;
  yearChange: number | null;
  volume: number | null;
  score: number;
}

export interface CoachPlan {
  stance: CoachStance;
  title: string;
  summary: string;
  maxDeploy: number;
  investableCash: number;
  marketBreadth: number;
  cashRatio: number;
  signals: CoachSignal[];
  candidates: CoachCandidate[];
  rules: string[];
}

const STANCE_COPY: Record<CoachStance, { title: string; summary: string }> = {
  cash: {
    title: 'Cash first',
    summary: 'Les règles favorisent la patience: gardez du cash tant que le marché ou votre marge de sécurité ne valide pas une entrée.',
  },
  watch: {
    title: 'Watchlist mode',
    summary: 'Le marché donne quelques signaux, mais pas assez pour forcer une entrée. Préparez vos niveaux et attendez une meilleure asymétrie.',
  },
  deploy: {
    title: 'Small deploy allowed',
    summary: 'Les règles autorisent une petite allocation progressive, sans concentrer le portefeuille.',
  },
  rebalance: {
    title: 'Rebalance first',
    summary: 'Avant tout nouvel achat, les règles priorisent la concentration et le risque de portefeuille.',
  },
};

function toneFor(v: number, good: number, bad: number): CoachSignal['tone'] {
  if (v >= good) return 'good';
  if (v <= bad) return 'bad';
  return 'warn';
}

export function buildInvestmentCoach(opts: {
  accounts: Account[];
  holdings: Holding[];
  portfolio: PortfolioIntelligence;
  market: MarketRow[];
  masi: IndexQuote | null;
}): CoachPlan {
  const { accounts, holdings, portfolio, market, masi } = opts;
  const investableCash = accounts
    .filter(a => a.type === 'cash' || a.type === 'checking' || a.type === 'savings')
    .reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  const totalLiquid = investableCash + portfolio.netLiquidation;
  const cashRatio = totalLiquid > 0 ? investableCash / totalLiquid : 0;
  const breadth = market.length > 0 ? market.filter(m => m.varDay > 0).length / market.length : 0;
  const topWeight = portfolio.concentration.topWeight;
  const marketWeak = (masi?.changePercent ?? 0) < -0.8 || breadth < 0.4;
  const marketHealthy = (masi?.changePercent ?? 0) > 0 && breadth >= 0.55;
  const held = new Set(holdings.map(h => h.ticker));

  let stance: CoachStance = 'watch';
  if (investableCash <= 0) stance = 'cash';
  else if (topWeight >= 0.45) stance = 'rebalance';
  else if (cashRatio < 0.12 || marketWeak) stance = 'cash';
  else if (marketHealthy && cashRatio >= 0.2 && topWeight < 0.35) stance = 'deploy';

  const maxDeploy = stance === 'deploy'
    ? Math.max(0, Math.min(investableCash * 0.15, Math.max(portfolio.netLiquidation, 1) * 0.08))
    : 0;

  const candidates = market
    .filter(m => !held.has(m.ticker) && m.last > 0)
    .map(m => ({
      ticker: m.ticker,
      name: m.name,
      price: m.last,
      dayChange: m.varDay,
      yearChange: m.varYear,
      volume: m.volume,
      score: (m.varDay * 2) + ((m.varYear ?? 0) * 0.12) + (m.volume ? Math.log10(Math.max(m.volume, 1)) : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const copy = STANCE_COPY[stance];
  return {
    stance,
    title: copy.title,
    summary: copy.summary,
    maxDeploy,
    investableCash,
    marketBreadth: breadth,
    cashRatio,
    candidates,
    signals: [
      {
        label: 'MASI',
        detail: masi ? `${masi.changePercent >= 0 ? '+' : ''}${masi.changePercent.toFixed(2)}% aujourd'hui` : 'Indice indisponible',
        tone: masi ? toneFor(masi.changePercent, 0.4, -0.8) : 'neutral',
      },
      {
        label: 'Breadth',
        detail: `${Math.round(breadth * 100)}% des valeurs en hausse`,
        tone: toneFor(breadth, 0.55, 0.4),
      },
      {
        label: 'Cash buffer',
        detail: `${Math.round(cashRatio * 100)}% du capital liquide en cash`,
        tone: toneFor(cashRatio, 0.2, 0.08),
      },
      {
        label: 'Concentration',
        detail: portfolio.concentration.topTicker
          ? `${portfolio.concentration.topTicker} pese ${Math.round(topWeight * 100)}%`
          : 'Aucune ligne dominante',
        tone: topWeight >= 0.45 ? 'bad' : topWeight >= 0.35 ? 'warn' : 'good',
      },
    ],
    rules: [
      'Ne jamais deployer plus de 15% du cash disponible sur un seul signal.',
      'Si une ligne depasse 45% du portefeuille, reequilibrage avant achat.',
      'Si moins de 40% du marche monte ou MASI baisse fortement, cash first.',
      'Les candidats sont des valeurs a etudier, pas des ordres d achat.',
      'Les frais, impots et seuils doivent etre verifies avant execution reelle.',
    ],
  };
}
