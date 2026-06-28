import { Account } from '../db/accounts';
import { Holding } from '../db/holdings';
import { Goal } from '../db/goals';
import { StockQuote } from '../api/mansa';

export interface NetWorth {
  cash: number;        // checking + savings + card balances
  emergency: number;   // emergency-fund accounts
  invest: number;      // portfolio market value
  goals: number;       // money set aside in goals
  total: number;
}

export function computeNetWorth(
  accounts: Account[],
  holdings: Holding[],
  quotes: Record<string, StockQuote>,
  goals: Goal[],
): NetWorth {
  const emergency = accounts.filter(a => a.type === 'emergency').reduce((s, a) => s + a.balance, 0);
  const cash = accounts.filter(a => a.type !== 'emergency').reduce((s, a) => s + a.balance, 0);
  const invest = holdings.reduce((s, h) => s + h.shares * (quotes[h.ticker]?.price ?? h.buy_price), 0);
  const goalsSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  return { cash, emergency, invest, goals: goalsSaved, total: cash + emergency + invest + goalsSaved };
}

/* ── Financial health ─────────────────────────────────────────────────── */
export interface Advice {
  key: string;
  label: string;
  status: 'good' | 'warn' | 'bad';
  detail: string;
}

export interface Health {
  score: number;            // 0–100
  rating: string;           // label
  savingsRate: number;      // %
  emergencyMonths: number;  // months of expenses covered
  advice: Advice[];
}

export function computeHealth(opts: {
  avgIncome: number;
  avgExpense: number;
  avgNet: number;
  emergency: number;
  netWorthTrendUp: boolean | null;
  overBudgetCount: number;
}): Health {
  const { avgIncome, avgExpense, avgNet, emergency, netWorthTrendUp, overBudgetCount } = opts;
  const savingsRate = avgIncome > 0 ? (avgNet / avgIncome) * 100 : 0;
  const emergencyMonths = avgExpense > 0 ? emergency / avgExpense : (emergency > 0 ? 6 : 0);

  const advice: Advice[] = [];
  let score = 0;

  // Savings rate (40 pts) — target 40% under the 40/20/40 plan
  if (savingsRate >= 40) { score += 40; advice.push({ key: 'save', label: "Taux d'épargne", status: 'good', detail: `Vous épargnez ${Math.round(savingsRate)}% — objectif 40% atteint. 👏` }); }
  else if (savingsRate >= 20) { score += 28; advice.push({ key: 'save', label: "Taux d'épargne", status: 'warn', detail: `${Math.round(savingsRate)}% épargnés. Visez 40% pour le plan 40/20/40.` }); }
  else if (savingsRate > 0) { score += 12; advice.push({ key: 'save', label: "Taux d'épargne", status: 'bad', detail: `Seulement ${Math.round(savingsRate)}% épargnés ce mois. Réduisez les envies.` }); }
  else { advice.push({ key: 'save', label: "Taux d'épargne", status: 'bad', detail: 'Vous dépensez autant ou plus que vos revenus.' }); }

  // Emergency fund (35 pts) — target 3+ months
  if (emergencyMonths >= 3) { score += 35; advice.push({ key: 'emg', label: "Fonds d'urgence", status: 'good', detail: `${emergencyMonths.toFixed(1)} mois de dépenses couverts. Solide.` }); }
  else if (emergencyMonths >= 1) { score += 20; advice.push({ key: 'emg', label: "Fonds d'urgence", status: 'warn', detail: `${emergencyMonths.toFixed(1)} mois couverts. Visez au moins 3 mois.` }); }
  else { advice.push({ key: 'emg', label: "Fonds d'urgence", status: 'bad', detail: "Aucun fonds d'urgence. Créez un compte « Fonds d'urgence ». " }); }

  // Budget adherence (15 pts)
  if (overBudgetCount === 0) { score += 15; advice.push({ key: 'bud', label: 'Budgets', status: 'good', detail: 'Aucun budget dépassé ce mois.' }); }
  else { score += Math.max(0, 15 - overBudgetCount * 5); advice.push({ key: 'bud', label: 'Budgets', status: overBudgetCount > 2 ? 'bad' : 'warn', detail: `${overBudgetCount} budget(s) dépassé(s) ce mois.` }); }

  // Net worth trend (10 pts)
  if (netWorthTrendUp === true) { score += 10; advice.push({ key: 'nw', label: 'Patrimoine', status: 'good', detail: 'Votre patrimoine progresse. 📈' }); }
  else if (netWorthTrendUp === false) { advice.push({ key: 'nw', label: 'Patrimoine', status: 'warn', detail: 'Votre patrimoine recule. Surveillez vos dépenses.' }); }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating = score >= 80 ? 'Excellente' : score >= 60 ? 'Bonne' : score >= 40 ? 'Correcte' : 'Fragile';
  return { score, rating, savingsRate, emergencyMonths, advice };
}
