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
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS career_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Full-time',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_inq_status ON inquiries(status, created_at);
`);

// Seed the editable content with what the site shipped with (only when empty).
if (db.get('SELECT COUNT(*) c FROM team_members').c === 0) {
  [
    ['Sophia Chen', 'Chief Executive Officer', '12+ years building enterprise SaaS. Former engineering director leading distributed cloud teams across the US and APAC.', 'assets/images/team/sophia-chen.jpg'],
    ['Marcus Vance', 'Chief Technology Officer', 'Distributed systems specialist and Kubernetes contributor. Leads our high-concurrency fintech backends.', 'assets/images/team/marcus-vance.jpg'],
    ['David Miller', 'Head of Product Design', 'Design systems and micro-interactions expert whose work reaches millions of users daily.', 'assets/images/team/david-miller.jpg'],
    ['Aisha Patel', 'Lead AI & Cloud Architect', 'LLM orchestration, RAG and AWS serverless specialist. Published NLP researcher.', 'assets/images/team/aisha-patel.jpg'],
  ].forEach((t, i) => db.run('INSERT INTO team_members (name, role, bio, photo, sort_order) VALUES (?,?,?,?,?)', [...t, i]));
}
if (db.get('SELECT COUNT(*) c FROM career_roles').c === 0) {
  [
    ['Senior Full-Stack Engineer', 'Engineering', 'Dhaka / Remote', 'Build SaaS platforms with React, Node.js and PostgreSQL.'],
    ['AI / ML Engineer', 'AI', 'Remote', 'Design RAG pipelines, agents and evaluation suites for enterprise clients.'],
    ['Product Designer (UI/UX)', 'Design', 'Dhaka / Remote', 'Own research-to-prototype for web and mobile products.'],
    ['DevOps / SRE Engineer', 'Infrastructure', 'Remote', 'Run Kubernetes, CI/CD and observability for production workloads.'],
  ].forEach((r, i) => db.run('INSERT INTO career_roles (title, department, location, type, description, sort_order) VALUES (?,?,?,?,?,?)', [r[0], r[1], r[2], 'Full-time', r[3], i]));
}

module.exports = db;
