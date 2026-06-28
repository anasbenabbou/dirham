import { reconcileV1 } from './reconcile';
import { processDueRecurring } from '../db/recurring';
import { snapshotNetWorth } from '../db/networth';
import { countInstruments, upsertInstruments } from '../db/instruments';
import { seedDefaultCategories, migrateCategoriesBudgetV1 } from '../db/categories';
import { BVC_STOCKS } from '../constants/bvcStocks';
import { notifyNow } from './notifications';

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
  // Offline base list until the first live sync from the exchange.
  try {
    if (countInstruments() === 0) {
      upsertInstruments(BVC_STOCKS.map(s => ({ symbol: s.ticker, name: s.name, klass: 'action' as const, sector: s.sector })));
    }
  } catch {}
  return { recurringPosted };
}

/** Fire any startup notifications (async, runs from an effect). */
export function announceStartup(r: { recurringPosted: number }): void {
  if (r.recurringPosted > 0) {
    notifyNow('Transactions récurrentes', `${r.recurringPosted} transaction(s) récurrente(s) ajoutée(s).`);
  }
}
