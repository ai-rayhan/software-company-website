const path = require('path');
const fs = require('fs');
const { Database } = require('node-sqlite3-wasm');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(process.env.DB_FILE || path.join(dataDir, 'shopsync.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  service TEXT,
  budget TEXT,
  timeline TEXT,
  message TEXT NOT NULL,
  nda INTEGER NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'contact',
  status TEXT NOT NULL DEFAULT 'new',
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  selections TEXT NOT NULL,
  price_min INTEGER NOT NULL,
  price_max INTEGER NOT NULL,
  weeks_min INTEGER NOT NULL,
  weeks_max INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inq_status ON inquiries(status, created_at);
`);

module.exports = db;
