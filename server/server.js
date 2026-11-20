require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const fs = require('fs');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) console.warn('[warn] JWT_SECRET not set — admin sessions reset on restart.');

/* ── Seed / sync admin ─────────────────────────────────────────── */
(function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@shopsynctech.com').toLowerCase();
  const pass = process.env.ADMIN_PASSWORD || 'ShopSync2026!Secure';
  const existing = db.get('SELECT id, password_hash FROM admins WHERE email = ?', [email]);
  if (existing) {
    if (!bcrypt.compareSync(pass, existing.password_hash)) {
      db.run('UPDATE admins SET password_hash = ? WHERE id = ?', [bcrypt.hashSync(pass, 10), existing.id]);
      console.log(`[setup] Admin password updated for ${email}`);
    }
    return;
  }
  db.run('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [email, bcrypt.hashSync(pass, 10)]);
  console.log(`[setup] Admin created → ${email}`);
})();

/* ── Mail (optional) ────────────────────────────────────── */
const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: +(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;
async function notify(subject, text) {
  if (!mailer) return;
  try {
    await mailer.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_TO || process.env.SMTP_USER,
      subject, text,
    });
  } catch (e) { console.error('[mail] failed:', e.message); }
}

/* ── App ────────────────────────────────────────────────── */
const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", 'https://unpkg.com'],
      'script-src-attr': ["'none'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'upgrade-insecure-requests': IS_PROD ? [] : null,
    },
  },
}));
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: 'Too many submissions. Please try again in a few minutes.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: 'Too many login attempts. Try again later.' } });

/* ── Validation helpers ─────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const fail = (res, error, code = 400) => res.status(code).json({ ok: false, error });

/* ── Public API ─────────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.post('/api/contact', formLimiter, async (req, res) => {
  const b = req.body || {};
  if (str(b.website, 200)) return res.json({ ok: true }); // honeypot — silently drop bots
  const name = str(b.name, 120), email = str(b.email, 200).toLowerCase(), message = str(b.message, 5000);
  if (name.length < 2) return fail(res, 'Please enter your name.');
  if (!EMAIL_RE.test(email)) return fail(res, 'Please enter a valid email address.');
  if (message.length < 10) return fail(res, 'Please tell us a bit more about your project (10+ characters).');
  const row = {
    company: str(b.company, 160), service: str(b.service, 120), budget: str(b.budget, 80),
    timeline: str(b.timeline, 80), source: str(b.source, 40) || 'contact',
  };
  db.run(
    `INSERT INTO inquiries (name,email,company,service,budget,timeline,message,nda,source,ip) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [name, email, row.company, row.service, row.budget, row.timeline, message, b.nda ? 1 : 0, row.source, req.ip]
  );
  notify(`New inquiry from ${name}`,
    `Name: ${name}\nEmail: ${email}\nCompany: ${row.company}\nService: ${row.service}\nBudget: ${row.budget}\nTimeline: ${row.timeline}\nNDA: ${b.nda ? 'yes' : 'no'}\n\n${message}`);
  res.status(201).json({ ok: true, message: "Thanks! We've received your message and will reply within one business day." });
});

app.post('/api/newsletter', formLimiter, (req, res) => {
  const email = str(req.body && req.body.email, 200).toLowerCase();
  if (!EMAIL_RE.test(email)) return fail(res, 'Please enter a valid email address.');
  const exists = db.get('SELECT id FROM subscribers WHERE email = ?', [email]);
  if (!exists) db.run('INSERT INTO subscribers (email) VALUES (?)', [email]);
  res.status(201).json({ ok: true, message: exists ? "You're already subscribed — thank you!" : "You're subscribed. Welcome aboard!" });
});

// Server-side price model so quotes can't be tampered with from the browser.
const PRICING = {
  base: { pmin: 4500, pmax: 9000, wmin: 3, wmax: 6 },
  options: {
    type: [
      [0, 0, 0, 0], [1200, 2500, 1, 2], [2500, 5000, 2, 3], [3000, 6000, 2, 4],
    ],
  },
};
app.post('/api/quote', formLimiter, (req, res) => {
  const b = req.body || {};
  const name = str(b.name, 120), email = str(b.email, 200).toLowerCase();
  if (name.length < 2) return fail(res, 'Please enter your name.');
  if (!EMAIL_RE.test(email)) return fail(res, 'Please enter a valid email address.');
  const sel = Array.isArray(b.selections) ? b.selections.slice(0, 20) : [];
  let { pmin, pmax, wmin, wmax } = PRICING.base;
  const clean = [];
  for (const s of sel) {
    if (!s || typeof s !== 'object') continue;
    const n = (k) => Math.max(-10, Math.min(20000, parseInt(s[k], 10) || 0));
    pmin += n('pmin'); pmax += n('pmax'); wmin += n('wmin'); wmax += n('wmax');
    clean.push({ label: str(s.label, 80), group: str(s.group, 20) });
  }
  wmin = Math.max(1, wmin); wmax = Math.max(wmin, wmax);
  db.run(`INSERT INTO quotes (name,email,selections,price_min,price_max,weeks_min,weeks_max) VALUES (?,?,?,?,?,?,?)`,
    [name, email, JSON.stringify(clean), pmin, pmax, wmin, wmax]);
  db.run(`INSERT INTO inquiries (name,email,service,budget,message,source,ip) VALUES (?,?,?,?,?,?,?)`,
    [name, email, 'Estimator', `$${pmin}-$${pmax}`, `Estimator quote: ${clean.map(c => c.label).join(', ')} | ${wmin}-${wmax} weeks`, 'estimator', req.ip]);
  notify(`New estimator quote: ${name}`, `${name} <${email}>\n$${pmin}-$${pmax}, ${wmin}-${wmax} weeks\n${clean.map(c => c.label).join(', ')}`);
  res.status(201).json({ ok: true, message: `Estimate saved: $${pmin.toLocaleString()} – $${pmax.toLocaleString()}. We'll follow up shortly.` });
});

/* ── Admin auth ─────────────────────────────────────────── */
function requireAdmin(req, res, next) {
  try {
    req.admin = jwt.verify(req.cookies.admin_token || '', JWT_SECRET);
    next();
  } catch { fail(res, 'Unauthorized', 401); }
}

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const email = str(req.body && req.body.email, 200).toLowerCase();
  const pass = typeof req.body?.password === 'string' ? req.body.password : '';
  const admin = db.get('SELECT * FROM admins WHERE email = ?', [email]);
  if (!admin || !bcrypt.compareSync(pass, admin.password_hash)) return fail(res, 'Invalid email or password.', 401);
  const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '8h' });
  res.cookie('admin_token', token, { httpOnly: true, sameSite: 'strict', secure: IS_PROD, maxAge: 8 * 3600 * 1000 });
  res.json({ ok: true, email: admin.email });
});
app.post('/api/admin/logout', (_req, res) => { res.clearCookie('admin_token'); res.json({ ok: true }); });
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true, email: req.admin.email }));

// CSRF defence for state-changing admin calls: require JSON content type + same origin.
function sameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin && new URL(origin).host !== req.get('host')) return fail(res, 'Bad origin', 403);
  next();
}

app.get('/api/admin/summary', requireAdmin, (_req, res) => {
  const count = (sql) => db.get(sql).c;
  res.json({
    ok: true,
    inquiries: count('SELECT COUNT(*) c FROM inquiries'),
    newInquiries: count("SELECT COUNT(*) c FROM inquiries WHERE status='new'"),
    subscribers: count('SELECT COUNT(*) c FROM subscribers'),
    quotes: count('SELECT COUNT(*) c FROM quotes'),
    last7: count("SELECT COUNT(*) c FROM inquiries WHERE created_at >= datetime('now','-7 days')"),
  });
});

app.get('/api/admin/inquiries', requireAdmin, (req, res) => {
  const status = str(req.query.status, 20);
  const q = str(req.query.q, 100);
  const where = [], args = [];
  if (['new', 'in_progress', 'closed'].includes(status)) { where.push('status = ?'); args.push(status); }
  if (q) { where.push('(name LIKE ? OR email LIKE ? OR message LIKE ? OR company LIKE ?)'); args.push(...Array(4).fill(`%${q}%`)); }
  const rows = db.all(`SELECT * FROM inquiries ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT 500`, args);
  res.json({ ok: true, rows });
});

app.patch('/api/admin/inquiries/:id', requireAdmin, sameOrigin, (req, res) => {
  const status = str(req.body && req.body.status, 20);
  if (!['new', 'in_progress', 'closed'].includes(status)) return fail(res, 'Invalid status');
  db.run('UPDATE inquiries SET status = ? WHERE id = ?', [status, +req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/admin/inquiries/:id', requireAdmin, sameOrigin, (req, res) => {
  db.run('DELETE FROM inquiries WHERE id = ?', [+req.params.id]);
  res.json({ ok: true });
});
app.get('/api/admin/subscribers', requireAdmin, (_req, res) =>
  res.json({ ok: true, rows: db.all('SELECT * FROM subscribers ORDER BY id DESC LIMIT 1000') }));

const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};
app.get('/api/admin/export.csv', requireAdmin, (_req, res) => {
  const rows = db.all('SELECT id,created_at,name,email,company,service,budget,timeline,status,source,message FROM inquiries ORDER BY id DESC');
  const head = ['id', 'created_at', 'name', 'email', 'company', 'service', 'budget', 'timeline', 'status', 'source', 'message'];
  const csv = [head.join(','), ...rows.map(r => head.map(h => csvCell(r[h])).join(','))].join('\n');
  res.type('text/csv').attachment('inquiries.csv').send(csv);
});


/* ── Editable content: team + careers ───────────────────── */
const PHOTO_RE = /^assets\/images\/[\w\-\/.]+\.(jpe?g|png|webp)$/i;
const cleanPhoto = (v) => { const p = str(v, 300); return PHOTO_RE.test(p) && !p.includes('..') ? p : ''; };
const clampOrder = (v) => Math.max(0, Math.min(999, parseInt(v, 10) || 0));
const flag = (v) => (v === false || v === 0 || v === '0' ? 0 : 1);
const cleanTeam = (b) => ({ name: str(b.name, 120), role: str(b.role, 160), bio: str(b.bio, 600), photo: cleanPhoto(b.photo), sort_order: clampOrder(b.sort_order), active: flag(b.active) });
const ROLE_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const cleanRole = (b) => ({
  title: str(b.title, 160), department: str(b.department, 80), location: str(b.location, 100),
  type: ROLE_TYPES.includes(b.type) ? b.type : 'Full-time', description: str(b.description, 600),
  sort_order: clampOrder(b.sort_order), active: flag(b.active),
});

app.get('/api/team', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, rows: db.all('SELECT id,name,role,bio,photo FROM team_members WHERE active=1 ORDER BY sort_order, id') });
});
app.get('/api/careers', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, rows: db.all('SELECT id,title,department,location,type,description FROM career_roles WHERE active=1 ORDER BY sort_order, id') });
});

app.get('/api/admin/team', requireAdmin, (_req, res) => res.json({ ok: true, rows: db.all('SELECT * FROM team_members ORDER BY sort_order, id') }));
app.post('/api/admin/team', requireAdmin, sameOrigin, (req, res) => {
  const t = cleanTeam(req.body || {});
  if (t.name.length < 2 || t.role.length < 2) return fail(res, 'Name and role are required.');
  const r = db.run('INSERT INTO team_members (name,role,bio,photo,sort_order,active) VALUES (?,?,?,?,?,?)', [t.name, t.role, t.bio, t.photo, t.sort_order, t.active]);
  res.status(201).json({ ok: true, id: r.lastInsertRowid });
});
app.put('/api/admin/team/:id', requireAdmin, sameOrigin, (req, res) => {
  const t = cleanTeam(req.body || {});
  if (t.name.length < 2 || t.role.length < 2) return fail(res, 'Name and role are required.');
  db.run('UPDATE team_members SET name=?,role=?,bio=?,photo=?,sort_order=?,active=? WHERE id=?', [t.name, t.role, t.bio, t.photo, t.sort_order, t.active, +req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/admin/team/:id', requireAdmin, sameOrigin, (req, res) => { db.run('DELETE FROM team_members WHERE id=?', [+req.params.id]); res.json({ ok: true }); });

app.get('/api/admin/roles', requireAdmin, (_req, res) => res.json({ ok: true, rows: db.all('SELECT * FROM career_roles ORDER BY sort_order, id') }));
app.post('/api/admin/roles', requireAdmin, sameOrigin, (req, res) => {
  const r = cleanRole(req.body || {});
  if (r.title.length < 3) return fail(res, 'Role title is required.');
  const x = db.run('INSERT INTO career_roles (title,department,location,type,description,sort_order,active) VALUES (?,?,?,?,?,?,?)', [r.title, r.department, r.location, r.type, r.description, r.sort_order, r.active]);
  res.status(201).json({ ok: true, id: x.lastInsertRowid });
});
app.put('/api/admin/roles/:id', requireAdmin, sameOrigin, (req, res) => {
  const r = cleanRole(req.body || {});
  if (r.title.length < 3) return fail(res, 'Role title is required.');
  db.run('UPDATE career_roles SET title=?,department=?,location=?,type=?,description=?,sort_order=?,active=? WHERE id=?', [r.title, r.department, r.location, r.type, r.description, r.sort_order, r.active, +req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/admin/roles/:id', requireAdmin, sameOrigin, (req, res) => { db.run('DELETE FROM career_roles WHERE id=?', [+req.params.id]); res.json({ ok: true }); });

// Photo upload: raw image body (jpeg/png/webp, max 3 MB), verified by magic bytes.
app.post('/api/admin/upload', requireAdmin, sameOrigin, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '3mb' }), (req, res) => {
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || buf.length < 12) return fail(res, 'Send a JPG, PNG or WebP image (max 3 MB).');
  let ext = null;
  if (buf[0] === 0xff && buf[1] === 0xd8) ext = 'jpg';
  else if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ext = 'png';
  else if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') ext = 'webp';
  if (!ext) return fail(res, 'File is not a valid JPG, PNG or WebP image.');
  const staticRoot = fs.existsSync(path.join(__dirname, '..', 'public_html'))
    ? path.join(__dirname, '..', 'public_html')
    : path.join(__dirname, '..');
  const dir = path.join(staticRoot, 'assets', 'images', 'team', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  const name = crypto.randomBytes(8).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(dir, name), buf);
  const altDir = path.join(__dirname, '..', 'assets', 'images', 'team', 'uploads');
  if (dir !== altDir) {
    try {
      fs.mkdirSync(altDir, { recursive: true });
      fs.writeFileSync(path.join(altDir, name), buf);
    } catch (_) {}
  }
  res.status(201).json({ ok: true, path: 'assets/images/team/uploads/' + name });
});

// Company info endpoints (public & admin)
app.get('/api/info', (_req, res) => {
  const row = db.get('SELECT company_name, email, phone, address, presence, hours, tagline, facebook_url, updated_at FROM company_info WHERE id = 1') || {};
  res.json({ ok: true, info: row });
});
app.get('/api/admin/info', requireAdmin, (_req, res) => {
  const row = db.get('SELECT * FROM company_info WHERE id = 1') || {};
  res.json({ ok: true, info: row });
});
app.put('/api/admin/info', requireAdmin, sameOrigin, (req, res) => {
  const b = req.body || {};
  const email = String(b.email || '').trim().slice(0, 120);
  const phone = String(b.phone || '').trim().slice(0, 60);
  const address = String(b.address || '').trim().slice(0, 255);
  const presence = String(b.presence || '').trim().slice(0, 255);
  const hours = String(b.hours || '').trim().slice(0, 120);
  const tagline = String(b.tagline || '').trim().slice(0, 500);
  const facebook_url = String(b.facebook_url || '').trim().slice(0, 255);
  const company_name = String(b.company_name || 'ShopSync Technologies').trim().slice(0, 120);

  if (!email || !email.includes('@')) return fail(res, 'Valid email is required.');

  db.run(`UPDATE company_info SET 
    company_name = ?,
    email = ?,
    phone = ?,
    address = ?,
    presence = ?,
    hours = ?,
    tagline = ?,
    facebook_url = ?,
    updated_at = datetime('now')
    WHERE id = 1`,
    [company_name, email, phone, address, presence, hours, tagline, facebook_url]
  );
  const info = db.get('SELECT * FROM company_info WHERE id = 1');
  res.json({ ok: true, info });
});

app.use('/api', (_req, res) => fail(res, 'Not found', 404));

/* ── Static site ────────────────────────────────────────── */
const root = fs.existsSync(path.join(__dirname, '../public_html'))
  ? path.join(__dirname, '../public_html')
  : path.join(__dirname, '..');
const PUBLIC = ['assets', 'css', 'js'];
PUBLIC.forEach((d) => app.use('/' + d, express.static(path.join(root, d), { maxAge: IS_PROD ? '7d' : 0 })));
app.get('/', (_req, res) => res.sendFile(path.join(root, 'index.html')));
app.get(['/pricing', '/pricing.html'], (_req, res) => res.redirect(301, '/contact'));
app.get('/:page', (req, res, next) => {
  const p = req.params.page.replace(/\.html$/, '');
  if (!/^[a-z0-9-]+$/i.test(p)) return next();
  res.sendFile(path.join(root, p + '.html'), (err) => err && next());
});
app.use((_req, res) => res.status(404).send('Not found'));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(err.status || 500).json({ ok: false, error: err.status && err.status < 500 ? 'Bad request' : 'Server error' });
});

app.listen(PORT, () => console.log(`ShopSync running → http://localhost:${PORT}   (admin: /admin)`));
