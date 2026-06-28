import { getDb } from './schema';

export type InstrumentClass = 'action' | 'obligation' | 'fond' | 'droit';

export interface Instrument {
  symbol: string;
  name: string;
  klass: InstrumentClass;
  sector: string;
}

export function getInstruments(klass?: InstrumentClass): Instrument[] {
  const db = getDb();
  return klass
    ? db.getAllSync<Instrument>(`SELECT * FROM instruments WHERE klass = ? ORDER BY name ASC`, [klass])
    : db.getAllSync<Instrument>(`SELECT * FROM instruments ORDER BY name ASC`);
}

export function countInstruments(): number {
  return getDb().getFirstSync<{ c: number }>(`SELECT COUNT(*) c FROM instruments`)?.c ?? 0;
}

/** Upsert a batch (merges; never wipes other classes). */
export function upsertInstruments(items: Instrument[]): void {
  const db = getDb();
  db.withTransactionSync(() => {
    for (const it of items) {
      db.runSync(
        `INSERT INTO instruments (symbol, name, klass, sector) VALUES (?, ?, ?, ?)
         ON CONFLICT(symbol) DO UPDATE SET name = excluded.name, klass = excluded.klass, sector = excluded.sector`,
        [it.symbol, it.name, it.klass, it.sector ?? '']
      );
    }
  });
}

export function nameForSymbol(symbol: string): string | null {
  return getDb().getFirstSync<{ name: string }>(`SELECT name FROM instruments WHERE symbol = ?`, [symbol])?.name ?? null;
}
