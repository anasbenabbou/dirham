import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) _db = SQLite.openDatabaseSync('dirham.db');
  return _db;
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
}
