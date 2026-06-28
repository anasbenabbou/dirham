import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) _db = SQLite.openDatabaseSync('dirham.db');
  return _db;
}

/** True if `table` already has a column named `col` (for safe ALTERs). */
function hasColumn(db: SQLite.SQLiteDatabase, table: string, col: string): boolean {
  const cols = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  return cols.some(c => c.name === col);
}

function addColumn(db: SQLite.SQLiteDatabase, table: string, col: string, def: string): void {
  if (!hasColumn(db, table, col)) db.execSync(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}

export function initDb(): void {
  const db = getDb();

  db.execSync(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT DEFAULT '',
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense'))
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    month TEXT NOT NULL,
    UNIQUE(category, month)
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    target_date TEXT,
    completed INTEGER NOT NULL DEFAULT 0
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL DEFAULT '',
    shares REAL NOT NULL,
    buy_price REAL NOT NULL
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bank TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'checking',
    balance REAL NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#0057FF',
    last_four TEXT DEFAULT ''
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  // ── v2 additions ──────────────────────────────────────────────────────
  db.execSync(`CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account INTEGER NOT NULL,
    to_account INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT DEFAULT ''
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS recurring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT DEFAULT '',
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    frequency TEXT NOT NULL DEFAULT 'monthly',
    anchor_day INTEGER NOT NULL DEFAULT 1,
    next_date TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS networth_snapshots (
    date TEXT PRIMARY KEY,
    total REAL NOT NULL
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS watchlist (
    ticker TEXT PRIMARY KEY,
    company_name TEXT NOT NULL DEFAULT ''
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS dividends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT DEFAULT ''
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS instruments (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    klass TEXT NOT NULL DEFAULT 'action',
    sector TEXT DEFAULT ''
  )`);
  db.execSync(`CREATE TABLE IF NOT EXISTS categories (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'pricetag',
    color TEXT NOT NULL DEFAULT '#9AA7C0',
    type TEXT NOT NULL DEFAULT 'expense',
    sort INTEGER NOT NULL DEFAULT 0
  )`);

  // Columns added to pre-existing tables
  addColumn(db, 'transactions', 'account_id', 'INTEGER');
  addColumn(db, 'transactions', 'receipt_uri', 'TEXT');
  addColumn(db, 'categories', 'budget', 'TEXT');
}
