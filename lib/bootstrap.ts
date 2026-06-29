import { reconcileV1 } from './reconcile';
import { processDueRecurring } from '../db/recurring';
import { snapshotNetWorth } from '../db/networth';
import { countInstruments, upsertInstruments } from '../db/instruments';
import { seedDefaultCategories, migrateCategoriesBudgetV1, migrateSavingsToGoalsV2 } from '../db/categories';
import { ensureCashAccount } from '../db/accounts';
import { insertHolding } from '../db/holdings';
import { getSetting, setSetting } from '../db/settings';
import { BVC_STOCKS } from '../constants/bvcStocks';
import { notifyNow } from './notifications';

const SIMPLE_PORTFOLIO_IMPORT_KEY = 'simple_portfolio_import_2026_06_28_v1';

const SIMPLE_PORTFOLIO_POSITIONS = [
  { ticker: 'SGT', company_name: 'SGTM', shares: 2, buy_price: 770.86, manual_price: 715.00 },
  { ticker: 'SICAV-ATD', company_name: 'SICAV Attijari Diversifie', shares: 2, buy_price: 731.09, manual_price: 749.19 },
  { ticker: 'IAM', company_name: 'Itissalat Al Maghrib', shares: 20, buy_price: 95.94, manual_price: 91.70 },
  { ticker: 'FCP-ATA', company_name: 'FCP Attijari Actions', shares: 4, buy_price: 947.635, manual_price: 901.74 },
  { ticker: 'MSA', company_name: 'SODEP-Marsa Maroc', shares: 2, buy_price: 885.69, manual_price: 855.20 },
  { ticker: 'AKT', company_name: 'Akdital', shares: 2, buy_price: 1110.89, manual_price: 1178.00 },
  { ticker: 'FCP-AAM', company_name: 'FCP Attijari Al Moucharaka', shares: 1.6020033463, buy_price: 1248.3244836, manual_price: 1350.74 },
];

function importSimplePortfolio(): void {
  if (getSetting(SIMPLE_PORTFOLIO_IMPORT_KEY) === 'done') return;
  for (const h of SIMPLE_PORTFOLIO_POSITIONS) insertHolding(h);
  upsertInstruments([
    { symbol: 'SGT', name: 'SGTM', klass: 'action', sector: 'BTP' },
    { symbol: 'IAM', name: 'Itissalat Al Maghrib', klass: 'action', sector: 'Telecom' },
    { symbol: 'MSA', name: 'SODEP-Marsa Maroc', klass: 'action', sector: 'Transport' },
    { symbol: 'AKT', name: 'Akdital', klass: 'action', sector: 'Sante' },
    { symbol: 'SICAV-ATD', name: 'SICAV Attijari Diversifie', klass: 'fond', sector: 'OPCVM' },
    { symbol: 'FCP-ATA', name: 'FCP Attijari Actions', klass: 'fond', sector: 'OPCVM' },
    { symbol: 'FCP-AAM', name: 'FCP Attijari Al Moucharaka', klass: 'fond', sector: 'OPCVM' },
  ]);
  setSetting(SIMPLE_PORTFOLIO_IMPORT_KEY, 'done');
}

/**
 * Synchronous maintenance run at module load (before any screen reads the DB):
 * repair phantom money, post due recurring transactions, snapshot net worth.
 */
export function runStartupTasks(): { recurringPosted: number } {
  let recurringPosted = 0;
  try { reconcileV1(); } catch {}
  try { recurringPosted = processDueRecurring(); } catch {}
  try { snapshotNetWorth(); } catch {}
  try { seedDefaultCategories(); } catch {}
  try { migrateCategoriesBudgetV1(); } catch {}
  try { migrateSavingsToGoalsV2(); } catch {}
  try { ensureCashAccount(); } catch {}
  // Offline base list until the first live sync from the exchange.
  try {
    if (countInstruments() === 0) {
      upsertInstruments(BVC_STOCKS.map(s => ({ symbol: s.ticker, name: s.name, klass: 'action' as const, sector: s.sector })));
    }
  } catch {}
  try { importSimplePortfolio(); } catch {}
  return { recurringPosted };
}

/** Fire any startup notifications (async, runs from an effect). */
export function announceStartup(r: { recurringPosted: number }): void {
  if (r.recurringPosted > 0) {
    notifyNow('Transactions récurrentes', `${r.recurringPosted} transaction(s) récurrente(s) ajoutée(s).`);
  }
}
