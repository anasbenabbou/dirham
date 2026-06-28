import { getDb } from '../db/schema';
import { getSetting, setSetting } from '../db/settings';
import { getAccounts, adjustBalance, ensureDefaultAccount } from '../db/accounts';
import { Transaction } from '../db/transactions';

/**
 * One-time repair of "phantom money" created before the strict linked model:
 *  - account-less income/expense never touched a balance
 *  - account-less goal deposits added to goals without removing cash anywhere
 *
 * After this, every dirham lives in exactly one bucket and net worth balances.
 * Guarded so it only runs once.
 */
export function reconcileV1(): void {
  if (getSetting('reconciled_v1') === '1') return;
  const db = getDb();

  const orphans = db.getAllSync<Transaction>(`SELECT * FROM transactions WHERE account_id IS NULL`);
  const totalGoals = db.getFirstSync<{ t: number }>(`SELECT COALESCE(SUM(current_amount),0) t FROM goals`)?.t ?? 0;
  const hadNoAccounts = getAccounts().length === 0;

  if (orphans.length > 0 || (hadNoAccounts && totalGoals > 0)) {
    const cashId = ensureDefaultAccount();

    // Fold the net of every account-less transaction into the cash wallet.
    const orphanNet = orphans.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    if (orphanNet !== 0) adjustBalance(cashId, orphanNet);
    db.runSync(`UPDATE transactions SET account_id = ? WHERE account_id IS NULL`, [cashId]);

    // If there were no accounts at all, goal money must have come from this cash
    // (it was added with no source), so remove it from cash to avoid double-count.
    if (hadNoAccounts && totalGoals > 0) adjustBalance(cashId, -totalGoals);
  }

  setSetting('reconciled_v1', '1');
}
