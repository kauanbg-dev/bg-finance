require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = require('./database');
const telegram = require('./telegram');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
const APP_URL = (process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
const corsOrigins = new Set([APP_URL, 'http://localhost:3000', 'http://127.0.0.1:3000']);
app.use(cors({
  origin(origin, cb) {
    if (!origin || corsOrigins.has(String(origin).replace(/\/$/, ''))) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(require('compression')());
app.use(express.json({ limit: '1mb' }));
app.use(guardTraffic);
app.use((req, res, next) => {
  const appPage = req.path === '/' || req.path === '/index.html';
  if (!appPage || (req.method !== 'GET' && req.method !== 'HEAD')) return next();
  const token = cookieValue(req, 'bg_session');
  if (!token) {
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, '/login.html');
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, '/login.html');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'frontend'), {
  etag: true,
  lastModified: true,
  index: false,
  setHeaders(res, filePath) {
    if (/\.(html|js)$/i.test(filePath) || /[\\/]sw\.js$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store');
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  },
}));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET nao definida no .env');
}

const MIN_PASSWORD = 10;
const BCRYPT_ROUNDS = 12;
const SESSION_COOKIE = 'bg_session';
const SESSION_MS = 12 * 60 * 60 * 1000;
const attempts = new Map();

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || 'unknown');
}

function tooMany(res) {
  res.set('Retry-After', '60');
  return res.status(429).json({ error: 'Muitas tentativas. Tente de novo em alguns minutos.' });
}

function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || now - bucket.start >= windowMs) {
    attempts.set(key, { start: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

function guardTraffic(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const ip = clientIp(req);
  const route = req.path;
  const auth = route === '/auth/login' || route === '/login'
    || route === '/auth/register' || route === '/register'
    || route === '/auth/forgot' || route === '/auth/reset';
  if (auth && rateLimited(`auth:${ip}`, 40, 15 * 60 * 1000)) return tooMany(res);
  if (route === '/telegram/webhook' && rateLimited(`tg:${ip}`, 120, 60 * 1000)) return tooMany(res);
  if (!auth && route !== '/telegram/webhook') {
    const hasSession = Boolean(cookieValue(req, SESSION_COOKIE) || /^Bearer\s+\S+/i.test(String(req.headers.authorization || '')));
    if (hasSession && rateLimited(`api:${ip}`, 240, 60 * 1000)) return tooMany(res);
    if (!hasSession && rateLimited(`api-unauth:${ip}`, 60, 60 * 1000)) return tooMany(res);
  }
  next();
}

function cookieValue(req, name) {
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const cut = part.indexOf('=');
    if (cut < 0) continue;
    if (part.slice(0, cut).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(cut + 1).trim());
    } catch {
      return part.slice(cut + 1).trim();
    }
  }
  return '';
}

function sessionCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER_EXTERNAL_URL),
    sameSite: 'strict',
    maxAge: SESSION_MS,
    path: '/',
  };
}

function issueSession(res, token) {
  res.cookie(SESSION_COOKIE, token, sessionCookie());
}

function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookie(), maxAge: 0 });
}

setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [key, bucket] of attempts) {
    if (bucket.start < cutoff) attempts.delete(key);
  }
}, 10 * 60 * 1000).unref();

async function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token = (header && header.split(' ')[1]) || cookieValue(req, SESSION_COOKIE);

  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await db.query('SELECT token_version FROM users WHERE id = $1', [payload.id]);
    if (!result.rows[0] || Number(result.rows[0].token_version) !== Number(payload.ver)) {
      return res.status(403).json({ error: 'Token invalido' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(403).json({ error: 'Token invalido' });
  }
}

function normalizeAuthInput(body) {
  return {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    password: String(body.password || ''),
  };
}

function parseDate(value) {
  if (!value) return null;
  const raw = String(value);
  const isoDay = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00-03:00` : raw;
  const date = new Date(isoDay);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function stampPosition(runner, id) {
  if (!id) return;
  await runner.query('UPDATE transactions SET position = $1 WHERE id = $1 AND position = 0', [id]);
}

async function stampTablePosition(table, id) {
  if (!id || !/^(debts|subscriptions|savings|card_charges)$/.test(table)) return;
  await db.query(`UPDATE ${table} SET position = $1 WHERE id = $1 AND position = 0`, [id]);
}

async function placeOwnedRow({ table, userId, id, beforeId, copyDate, dateCol, extraSql = '', extraParams = [], orderSql }) {
  if (!/^(transactions|debts|subscriptions|savings|card_charges)$/.test(table)) return { placed: false };
  const dateBit = copyDate && dateCol ? `, ${dateCol} AS slot_date` : '';
  const rows = await db.query(
    `SELECT id, COALESCE(NULLIF(position, 0), id) AS rank${dateBit}
     FROM ${table}
     WHERE user_id = $1 ${extraSql}
     ORDER BY ${orderSql}`,
    [userId, ...extraParams]
  );
  const list = rows.rows;
  const from = list.findIndex((row) => Number(row.id) === id);
  if (from < 0) return { placed: false, missing: true };
  const [moved] = list.splice(from, 1);
  let to = beforeId == null ? list.length : list.findIndex((row) => Number(row.id) === beforeId);
  if (to < 0) to = list.length;
  if (to === from) return { placed: false };
  list.splice(to, 0, moved);
  const neighbor = list[to + 1] || list[to - 1] || moved;
  if (copyDate && dateCol) {
    await db.query(
      `UPDATE ${table} SET ${dateCol} = $1 WHERE id = $2 AND user_id = $3`,
      [neighbor.slot_date, id, userId]
    );
  }
  if (list.length) {
    const tuples = list.map((row, index) => `(${Number(row.id)}::int, ${(list.length - index) * 1000}::int)`).join(', ');
    await db.query(
      `UPDATE ${table} AS t
       SET position = v.position
       FROM (VALUES ${tuples}) AS v(id, position)
       WHERE t.id = v.id AND t.user_id = $1`,
      [userId]
    );
  }
  return { placed: true };
}

function validTransaction(description, amount, type) {
  return (
    description.length > 0 &&
    description.length <= 120 &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount < 1e10 &&
    (type === 'income' || type === 'expense')
  );
}

async function resolveCategoryId(userId, type, body) {
  if (body.category_id !== undefined && body.category_id !== null && body.category_id !== '') {
    const id = Number(body.category_id);
    if (!Number.isNaN(id)) return id;
  }

  const name = String(body.category || '').trim();
  if (!name) return null;

  const result = await db.query(
    `SELECT id
     FROM categories
     WHERE type = $1
       AND LOWER(name) = LOWER($2)
       AND (user_id IS NULL OR user_id = $3)
     ORDER BY user_id NULLS FIRST
     LIMIT 1`,
    [type, name, userId]
  );

  return result.rows[0] ? result.rows[0].id : null;
}

async function register(req, res) {
  const { name, email, password } = normalizeAuthInput(req.body);

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha nome, email e senha' });
  }

  if (!email.includes('@') || email.length > 254) {
    return res.status(400).json({ error: 'Digite um e-mail valido' });
  }

  if (rateLimited(`register:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
    return tooMany(res);
  }

  if (password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Senha muito curta (min. ${MIN_PASSWORD} caracteres)` });
  }

  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hash]
    );

    return res.json({ ok: true });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email ja cadastrado' });
    }

    console.error('Erro ao cadastrar usuario:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar usuario' });
  }
}

const RESET_TTL_MINUTES = 30;
const MAIL_READY = Boolean(process.env.BREVO_API_KEY || process.env.RESEND_API_KEY);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseSender(value) {
  const match = String(value || '').match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1] || 'BG Finance', email: match[2] };
  return { name: 'BG Finance', email: String(value || '').trim() };
}

async function deliverEmail({ to, subject, html }) {
  if (process.env.BREVO_API_KEY) {
    const sender = parseSender(process.env.MAIL_FROM);
    if (!sender.email.includes('@')) {
      throw new Error('MAIL_FROM ausente ou invalido. No Brevo, use um remetente verificado.');
    }
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html }),
    });
    if (!response.ok) throw new Error(`Brevo respondeu ${response.status}: ${await response.text()}`);
    return true;
  }

  if (process.env.RESEND_API_KEY) {
    const from = process.env.MAIL_FROM || 'BG Finance <onboarding@resend.dev>';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!response.ok) throw new Error(`Resend respondeu ${response.status}: ${await response.text()}`);
    return true;
  }

  return false;
}

async function sendResetEmail(to, name, link) {
  const firstName = (String(name || '').split(' ')[0] || 'Oi').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#0f172a;padding:32px;color:#e5e7eb">
      <div style="max-width:480px;margin:0 auto;background:#111c31;border-radius:16px;padding:28px;border:1px solid #1f2a44">
        <h2 style="margin:0 0 12px;color:#93c5fd">BG Finance</h2>
        <p>${firstName}, recebemos um pedido para redefinir a senha da sua conta.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#3b82f6;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">Criar nova senha</a>
        </p>
        <p style="color:#9ca3af;font-size:13px">O link vale por ${RESET_TTL_MINUTES} minutos e só pode ser usado uma vez. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>
      </div>
    </div>`;

  const sent = await deliverEmail({ to, subject: 'Redefinir sua senha do BG Finance', html });
  if (!sent) throw new Error('Nenhum provedor de e-mail configurado (BREVO_API_KEY ou RESEND_API_KEY)');
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const generic = { ok: true, message: 'Se esse e-mail estiver cadastrado, enviaremos um link para redefinir a senha.' };

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Digite um e-mail valido' });
  }

  if (rateLimited(`forgot:${clientIp(req)}`, 5, 15 * 60 * 1000) || rateLimited(`forgot:${email}`, 3, 15 * 60 * 1000)) {
    return tooMany(res);
  }

  try {
    const result = await db.query('SELECT id, name, telegram_chat_id FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.json(generic);

    const token = crypto.randomBytes(32).toString('base64url');
    await db.query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [user.id]);
    await db.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
      [user.id, hashToken(token), String(RESET_TTL_MINUTES)]
    );

    const link = `${APP_URL}/reset.html?token=${token}`;
    let delivered = false;
    try {
      await sendResetEmail(email, user.name, link);
      delivered = true;
    } catch (mailErr) {
      console.error('E-mail de redefinicao falhou:', mailErr.message);
    }
    if (user.telegram_chat_id) {
      try {
        await telegram.sendResetLink(user.telegram_chat_id, link);
        delivered = true;
      } catch (tgErr) {
        console.error('Telegram de redefinicao falhou:', tgErr.message);
      }
    }
    if (!delivered) {
      return res.status(500).json({
        error: 'Nao foi possivel enviar o link. No Render, defina BREVO_API_KEY e MAIL_FROM, ou vincule o Telegram em Ajustes.',
      });
    }
    return res.json(generic);
  } catch (err) {
    console.error('Erro ao solicitar redefinicao de senha:', err);
    return res.status(500).json({ error: 'Nao foi possivel enviar o e-mail agora. Tente mais tarde.' });
  }
}

async function resetPassword(req, res) {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (!token || password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Senha muito curta (min. ${MIN_PASSWORD} caracteres)` });
  }

  if (rateLimited(`reset:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
    return tooMany(res);
  }

  try {
    const result = await db.query(
      `UPDATE password_resets
       SET used_at = NOW()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [hashToken(token)]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(400).json({ error: 'Link invalido ou expirado. Peca um novo.' });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db.query(
      'UPDATE users SET password = $1, token_version = token_version + 1 WHERE id = $2',
      [hash, row.user_id]
    );
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [row.user_id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    return res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
}

async function login(req, res) {
  const { email, password } = normalizeAuthInput(req.body);
  const ip = clientIp(req);

  if (
    rateLimited(`login-ip:${ip}`, 20, 15 * 60 * 1000)
    || rateLimited(`login:${ip}:${email}`, 8, 15 * 60 * 1000)
  ) {
    return tooMany(res);
  }

  try {
    const result = await db.query(
      'SELECT id, name, email, password, token_version FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, ver: user.token_version || 1 },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    issueSession(res, token);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}

app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.post('/auth/register', register);
app.post('/register', register);
app.post('/auth/login', login);
app.post('/login', login);
app.post('/auth/forgot', forgotPassword);
app.post('/auth/reset', resetPassword);
app.post('/auth/logout', (req, res) => {
  clearSession(res);
  return res.json({ ok: true });
});

function validAvatar(value) {
  return (
    typeof value === 'string' &&
    value.length > 32 &&
    value.length <= 150000 &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}

app.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, created_at, avatar FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar usuario:', err);
    return res.status(500).json({ error: 'Erro ao buscar usuario' });
  }
});

app.put('/me', authenticateToken, async (req, res) => {
  if (!req.body || !Object.prototype.hasOwnProperty.call(req.body, 'avatar')) {
    return res.status(400).json({ error: 'Nada para atualizar' });
  }

  const avatar = req.body.avatar;
  if (avatar !== null && avatar !== '' && !validAvatar(avatar)) {
    return res.status(400).json({ error: 'Foto invalida. Use uma imagem menor.' });
  }

  try {
    const result = await db.query(
      `UPDATE users
       SET avatar = $1
       WHERE id = $2
       RETURNING id, name, email, created_at, avatar`,
      [avatar || null, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar foto:', err);
    return res.status(500).json({ error: 'Erro ao salvar foto' });
  }
});

app.delete('/me', authenticateToken, async (req, res) => {
  const password = String(req.body?.password || '');
  if (!password) return res.status(400).json({ error: 'Informe a senha' });

  try {
    const result = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Senha incorreta' });

    await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    clearSession(res);
    return res.json({ deleted: true });
  } catch (err) {
    console.error('Erro ao apagar conta:', err);
    return res.status(500).json({ error: 'Erro ao apagar conta' });
  }
});

app.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, type, user_id
       FROM categories
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY type ASC, name ASC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    return res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

app.post('/categories', authenticateToken, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const type = String(req.body.type || '').trim();

  if (!name || name.length > 40 || (type !== 'income' && type !== 'expense')) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const result = await db.query(
      `INSERT INTO categories (name, type, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, type, user_id`,
      [name, type, req.user.id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Categoria ja cadastrada' });
    }

    console.error('Erro ao criar categoria:', err);
    return res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

app.get('/transactions', authenticateToken, async (req, res) => {
  const month = String(req.query.month || '').trim();

  try {
    const params = [req.user.id];
    let monthFilter = '';

    if (month) {
      params.push(month);
      monthFilter = `AND TO_CHAR(t.date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') = $${params.length}`;
    }

    const result = await db.query(
      `SELECT
         t.id,
         t.description,
         t.amount,
         t.type,
         t.user_id,
         t.category_id,
         c.name AS category_name,
         t.date,
         t.position
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ${monthFilter}
       ORDER BY t.date DESC, t.position DESC, t.id DESC`,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar transacoes:', err);
    return res.status(500).json({ error: 'Erro ao listar transacoes' });
  }
});

app.post('/transactions', authenticateToken, async (req, res) => {
  const description = String(req.body.description || '').trim();
  const amount = Number(req.body.amount);
  const type = String(req.body.type || '').trim();
  const date = parseDate(req.body.date);

  if (!validTransaction(description, amount, type)) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const categoryId = await resolveCategoryId(req.user.id, type, req.body);
    const result = date
      ? await db.query(
          `INSERT INTO transactions (description, amount, type, user_id, category_id, date)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [description, amount, type, req.user.id, categoryId, date]
        )
      : await db.query(
          `INSERT INTO transactions (description, amount, type, user_id, category_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [description, amount, type, req.user.id, categoryId]
        );
    const createdId = result.rows[0].id;
    await stampPosition(db, createdId);
    return res.status(201).json({ id: createdId });
  } catch (err) {
    console.error('Erro ao criar transacao:', err);
    return res.status(500).json({ error: 'Erro ao criar transacao' });
  }
});

app.put('/transactions/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const description = String(req.body.description || '').trim();
  const amount = Number(req.body.amount);
  const type = String(req.body.type || '').trim();
  const date = parseDate(req.body.date);

  if (!id || !validTransaction(description, amount, type)) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const categoryId = await resolveCategoryId(req.user.id, type, req.body);
    const result = date
      ? await db.query(
          `UPDATE transactions
           SET description = $1,
               amount = $2,
               type = $3,
               category_id = $4,
               date = $5
           WHERE id = $6 AND user_id = $7`,
          [description, amount, type, categoryId, date, id, req.user.id]
        )
      : await db.query(
          `UPDATE transactions
           SET description = $1,
               amount = $2,
               type = $3,
               category_id = $4
           WHERE id = $5 AND user_id = $6`,
          [description, amount, type, categoryId, id, req.user.id]
        );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transacao nao encontrada' });
    }

    return res.json({ updated: result.rowCount });
  } catch (err) {
    console.error('Erro ao editar transacao:', err);
    return res.status(500).json({ error: 'Erro ao editar transacao' });
  }
});

app.post('/transactions/:id/move', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const dir = req.body?.dir === 'up' ? 'up' : req.body?.dir === 'down' ? 'down' : '';
  if (!id || !dir) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const current = await db.query(
      `SELECT id, position, TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day
       FROM transactions
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    const row = current.rows[0];
    if (!row) return res.status(404).json({ error: 'Transacao nao encontrada' });

    const siblings = await db.query(
      `SELECT id, date, COALESCE(NULLIF(position, 0), id) AS rank
       FROM transactions
       WHERE user_id = $1
       ORDER BY date DESC, COALESCE(NULLIF(position, 0), id) DESC, id DESC`,
      [req.user.id]
    );
    const list = siblings.rows;
    const index = list.findIndex((item) => Number(item.id) === id);
    const swapWith = dir === 'up' ? list[index - 1] : list[index + 1];
    if (index < 0 || !swapWith) return res.json({ moved: false });

    const me = list[index];
    const a = Number(me.rank);
    const b = Number(swapWith.rank);
    const nextA = b === a ? b + (dir === 'up' ? 1 : -1) : b;
    await db.query(
      `UPDATE transactions AS t
       SET date = v.date, position = v.position
       FROM (VALUES
         ($1::int, $2::timestamptz, $3::int),
         ($4::int, $5::timestamptz, $6::int)
       ) AS v(id, date, position)
       WHERE t.id = v.id AND t.user_id = $7`,
      [me.id, swapWith.date, nextA, swapWith.id, me.date, a, req.user.id]
    );
    return res.json({ moved: true });
  } catch (err) {
    console.error('Erro ao reordenar transacao:', err);
    return res.status(500).json({ error: 'Erro ao reordenar lancamento' });
  }
});

app.post('/transactions/:id/place', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const beforeId = req.body?.before_id == null || req.body?.before_id === '' ? null : Number(req.body.before_id);
  if (!id) return res.status(400).json({ error: 'Dados invalidos' });
  try {
    const result = await placeOwnedRow({
      table: 'transactions',
      userId: req.user.id,
      id,
      beforeId: Number.isFinite(beforeId) ? beforeId : null,
      copyDate: true,
      dateCol: 'date',
      orderSql: 'date DESC, rank DESC, id DESC',
    });
    if (result.missing) return res.status(404).json({ error: 'Transacao nao encontrada' });
    return res.json(result);
  } catch (err) {
    console.error('Erro ao posicionar transacao:', err);
    return res.status(500).json({ error: 'Erro ao reordenar lancamento' });
  }
});

app.post('/debts/:id/place', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const beforeId = req.body?.before_id == null || req.body?.before_id === '' ? null : Number(req.body.before_id);
  if (!id) return res.status(400).json({ error: 'Dados invalidos' });
  try {
    const result = await placeOwnedRow({
      table: 'debts',
      userId: req.user.id,
      id,
      beforeId: Number.isFinite(beforeId) ? beforeId : null,
      orderSql: 'rank DESC, id DESC',
    });
    if (result.missing) return res.status(404).json({ error: 'Divida nao encontrada' });
    return res.json(result);
  } catch (err) {
    console.error('Erro ao posicionar divida:', err);
    return res.status(500).json({ error: 'Erro ao reordenar' });
  }
});

app.post('/subscriptions/:id/place', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const beforeId = req.body?.before_id == null || req.body?.before_id === '' ? null : Number(req.body.before_id);
  if (!id) return res.status(400).json({ error: 'Dados invalidos' });
  try {
    const result = await placeOwnedRow({
      table: 'subscriptions',
      userId: req.user.id,
      id,
      beforeId: Number.isFinite(beforeId) ? beforeId : null,
      orderSql: 'rank DESC, id DESC',
    });
    if (result.missing) return res.status(404).json({ error: 'Assinatura nao encontrada' });
    return res.json(result);
  } catch (err) {
    console.error('Erro ao posicionar assinatura:', err);
    return res.status(500).json({ error: 'Erro ao reordenar' });
  }
});

app.post('/savings/:id/place', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const beforeId = req.body?.before_id == null || req.body?.before_id === '' ? null : Number(req.body.before_id);
  if (!id) return res.status(400).json({ error: 'Dados invalidos' });
  try {
    const result = await placeOwnedRow({
      table: 'savings',
      userId: req.user.id,
      id,
      beforeId: Number.isFinite(beforeId) ? beforeId : null,
      orderSql: 'rank DESC, id DESC',
    });
    if (result.missing) return res.status(404).json({ error: 'Item nao encontrado' });
    return res.json(result);
  } catch (err) {
    console.error('Erro ao posicionar guardado:', err);
    return res.status(500).json({ error: 'Erro ao reordenar' });
  }
});

app.post('/cards/:cardId/charges/:id/place', authenticateToken, async (req, res) => {
  const cardId = Number(req.params.cardId);
  const id = Number(req.params.id);
  const beforeId = req.body?.before_id == null || req.body?.before_id === '' ? null : Number(req.body.before_id);
  if (!cardId || !id) return res.status(400).json({ error: 'Dados invalidos' });
  try {
    const result = await placeOwnedRow({
      table: 'card_charges',
      userId: req.user.id,
      id,
      beforeId: Number.isFinite(beforeId) ? beforeId : null,
      extraSql: 'AND card_id = $2',
      extraParams: [cardId],
      orderSql: 'rank DESC, id DESC',
    });
    if (result.missing) return res.status(404).json({ error: 'Lancamento nao encontrado' });
    return res.json(result);
  } catch (err) {
    console.error('Erro ao posicionar compra:', err);
    return res.status(500).json({ error: 'Erro ao reordenar' });
  }
});

function mapBankCategory(raw, type) {
  const text = String(raw || '').toLowerCase();
  if (/mercado|supermerc|aliment|restaurante|ifood|padaria|bar/.test(text)) return 'Alimentação';
  if (/transporte|uber|combust|posto/.test(text)) return 'Transporte';
  if (/assinatura|streaming|spotify|netflix/.test(text)) return 'Assinaturas';
  if (/internet|telefone|celular|luz|energia|água|agua|conta de/.test(text)) return 'Contas';
  if (/moradia|casa|aluguel|condomin/.test(text)) return 'Moradia';
  if (/saude|saúde|farmac|drogaria/.test(text)) return 'Saúde';
  if (/pet|racao|ração|veterin/.test(text)) return 'Pets';
  if (/roupa|shopping|compra/.test(text)) return 'Compras';
  if (/imposto|ipva|iptu|multa/.test(text)) return 'Impostos';
  if (/lazer|entreten/.test(text)) return 'Lazer';
  if (/educa|curso|escola/.test(text)) return 'Educação';
  if (/trabalho/.test(text)) return 'Trabalho';
  if (/cofrinho|poupanca|poupança|dinheiro guardado/.test(text)) return 'Dinheiro guardado';
  if (type === 'income' && /salario|salário|holerite/.test(text)) return 'Salário';
  if (type === 'income' && /invest|rendimento|dividendo/.test(text)) return 'Investimentos';
  if (type === 'income' && /reembolso/.test(text)) return 'Reembolso';
  return 'Outros';
}

app.post('/imports/statement', authenticateToken, async (req, res) => {
  const source = req.body?.source === 'card' ? 'card' : req.body?.source === 'account' ? 'account' : '';
  const rows = Array.isArray(req.body?.rows) ? req.body.rows.slice(0, 800) : [];
  if (!source || !rows.length) return res.status(400).json({ error: 'Arquivo sem lancamentos' });

  let card = null;
  if (source === 'card') {
    const cardId = Number(req.body?.card_id);
    if (!Number.isInteger(cardId) || cardId <= 0) return res.status(400).json({ error: 'Escolha o cartao da fatura' });
    const owned = await db.query('SELECT id, issuer FROM cards WHERE id = $1 AND user_id = $2', [cardId, req.user.id]);
    card = owned.rows[0];
    if (!card) return res.status(400).json({ error: 'Cartao nao encontrado' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    let added = 0;
    let skipped = 0;
    const invoiceTotals = new Map();

    for (const row of rows) {
      const description = String(row.description || '').trim().slice(0, 120);
      const signed = Number(row.amount);
      const day = String(row.date || '').slice(0, 10);
      const date = parseDate(day);
      if (!description || !date || !Number.isFinite(signed) || signed === 0) {
        skipped += 1;
        continue;
      }

      const type = source === 'card'
        ? (signed < 0 ? 'income' : 'expense')
        : (signed < 0 ? 'expense' : 'income');
      const amount = Math.round(Math.abs(signed) * 100) / 100;
      if (!validTransaction(description, amount, type)) {
        skipped += 1;
        continue;
      }

      if (source === 'card') {
        if (type !== 'expense') {
          skipped += 1;
          continue;
        }
        const duplicate = await client.query(
          `SELECT 1
           FROM card_charges
           WHERE user_id = $1 AND card_id = $2 AND description = $3 AND amount = $4
             AND spent_at = $5::date
           LIMIT 1`,
          [req.user.id, card.id, description, amount, day]
        );
        if (duplicate.rows[0]) {
          skipped += 1;
          continue;
        }
        await client.query(
          `INSERT INTO card_charges (user_id, card_id, description, amount, spent_at, paid_at)
           VALUES ($1, $2, $3, $4, $5, NULL)`,
          [req.user.id, card.id, description, amount, day]
        );
        added += 1;
        const month = day.slice(0, 7);
        invoiceTotals.set(month, (invoiceTotals.get(month) || 0) + amount);
        continue;
      }

      const duplicate = await client.query(
        `SELECT 1
         FROM transactions
         WHERE user_id = $1
           AND description = $2
           AND amount = $3
           AND type = $4
           AND TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') = $5
         LIMIT 1`,
        [req.user.id, description, amount, type, day]
      );
      if (duplicate.rows[0]) {
        skipped += 1;
        continue;
      }

      const category = mapBankCategory(`${row.category || ''} ${description}`, type);
      const categoryId = await resolveCategoryId(req.user.id, type, { category });
      const inserted = await client.query(
        `INSERT INTO transactions (description, amount, type, user_id, category_id, date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [description, amount, type, req.user.id, categoryId, date]
      );
      await stampPosition(client, inserted.rows[0].id);
      added += 1;
    }

    let debts = 0;
    for (const [month, total] of invoiceTotals) {
      const [year, mon] = month.split('-');
      const name = `Fatura ${card.issuer} ${mon}/${year}`;
      const rounded = Math.round(total * 100) / 100;
      const existing = await client.query(
        `SELECT id, amount::float8 AS amount FROM debts
         WHERE user_id = $1 AND kind = 'credit_card' AND card_id = $2 AND paid_at IS NULL
           AND name = $3
         LIMIT 1`,
        [req.user.id, card.id, name]
      );
      if (existing.rows[0]) {
        await client.query(
          `UPDATE debts SET amount = $1, notes = $2 WHERE id = $3`,
          [Math.round((Number(existing.rows[0].amount) + rounded) * 100) / 100, 'Importada da fatura', existing.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO debts (user_id, name, kind, amount, notes, card_id)
           VALUES ($1, $2, 'credit_card', $3, $4, $5)`,
          [req.user.id, name, rounded, 'Importada da fatura', card.id]
        );
      }
      debts += 1;
    }

    await client.query('COMMIT');
    return res.json({ added, skipped, debts });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao importar extrato:', err);
    return res.status(500).json({ error: 'Erro ao importar arquivo' });
  } finally {
    client.release();
  }
});

const CHART_KEYS = ['flow', 'category', 'mix', 'daily'];
const DEBT_KINDS = ['credit_card', 'loan', 'other'];

function chartSettings(raw) {
  const src = raw && typeof raw.charts === 'object' && raw.charts ? raw.charts : {};
  const charts = {};
  for (const key of CHART_KEYS) charts[key] = src[key] !== false;
  return { charts };
}

app.get('/settings', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT settings FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });
    return res.json(chartSettings(result.rows[0].settings));
  } catch (err) {
    console.error('Erro ao buscar ajustes:', err);
    return res.status(500).json({ error: 'Erro ao buscar ajustes' });
  }
});

app.put('/settings', authenticateToken, async (req, res) => {
  const incoming = req.body && req.body.charts;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const current = await db.query('SELECT settings FROM users WHERE id = $1', [req.user.id]);
    if (!current.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const next = chartSettings(current.rows[0].settings).charts;
    for (const key of CHART_KEYS) {
      if (typeof incoming[key] === 'boolean') next[key] = incoming[key];
    }

    const saved = await db.query(
      `UPDATE users SET settings = $1::jsonb WHERE id = $2 RETURNING settings`,
      [JSON.stringify({ charts: next }), req.user.id]
    );
    return res.json(chartSettings(saved.rows[0].settings));
  } catch (err) {
    console.error('Erro ao salvar ajustes:', err);
    return res.status(500).json({ error: 'Erro ao salvar ajustes' });
  }
});

function debtPayload(body) {
  const name = String(body.name || '').trim();
  const kind = String(body.kind || '').trim();
  const amount = Number(body.amount);
  const notes = String(body.notes || '').trim();
  const dueRaw = String(body.due_date || '').trim();
  const due = dueRaw ? parseDate(dueRaw) : null;

  if (
    !name ||
    name.length > 120 ||
    !DEBT_KINDS.includes(kind) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount >= 1e10 ||
    notes.length > 240 ||
    (dueRaw && !due)
  ) {
    return null;
  }

  const cardRaw = body.card_id;
  const cardId = cardRaw === null || cardRaw === undefined || cardRaw === '' ? null : Number(cardRaw);
  if (cardId !== null && (!Number.isInteger(cardId) || cardId <= 0)) return null;

  return {
    name,
    kind,
    amount,
    notes: notes || null,
    dueDate: due,
    paid: body.paid === true,
    cardId: kind === 'credit_card' ? cardId : null,
  };
}

async function ownedCard(userId, cardId) {
  if (!cardId) return true;
  const owned = await db.query('SELECT id FROM cards WHERE id = $1 AND user_id = $2', [cardId, userId]);
  return Boolean(owned.rows[0]);
}

async function debtsForUser(userId) {
  const result = await db.query(
    `SELECT id, name, kind, amount::float8 AS amount, due_date::text AS due_date, notes, paid_at, card_id, created_at, position
     FROM debts
     WHERE user_id = $1
     ORDER BY (paid_at IS NULL) DESC, position DESC, due_date NULLS LAST, id DESC`,
    [userId]
  );
  return result.rows;
}

async function walletSnapshot(userId) {
  const [cards, debts] = await Promise.all([cardsForUser(userId), debtsForUser(userId)]);
  return { cards, debts };
}

app.get('/debts', authenticateToken, async (req, res) => {
  try {
    return res.json(await debtsForUser(req.user.id));
  } catch (err) {
    console.error('Erro ao listar dividas:', err);
    return res.status(500).json({ error: 'Erro ao listar dividas' });
  }
});

app.post('/debts', authenticateToken, async (req, res) => {
  const debt = debtPayload(req.body || {});
  if (!debt) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    if (!(await ownedCard(req.user.id, debt.cardId))) return res.status(400).json({ error: 'Cartao nao encontrado' });
    const result = await db.query(
      `INSERT INTO debts (user_id, name, kind, amount, due_date, notes, paid_at, card_id)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7 THEN NOW() ELSE NULL END, $8)
       RETURNING id, name, kind, amount, due_date::text AS due_date, notes, paid_at, card_id, created_at, position`,
      [req.user.id, debt.name, debt.kind, debt.amount, debt.dueDate, debt.notes, debt.paid, debt.cardId]
    );
    await stampTablePosition('debts', result.rows[0].id);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar divida:', err);
    return res.status(500).json({ error: 'Erro ao criar divida' });
  }
});

app.put('/debts/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const debt = debtPayload(req.body || {});
  if (!id || !debt) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    if (!(await ownedCard(req.user.id, debt.cardId))) return res.status(400).json({ error: 'Cartao nao encontrado' });
    const result = await db.query(
      `UPDATE debts
       SET name = $1,
           kind = $2,
           amount = $3,
           due_date = $4,
           notes = $5,
           paid_at = CASE
             WHEN $6 THEN COALESCE(paid_at, NOW())
             ELSE NULL
           END,
           card_id = $7
       WHERE id = $8 AND user_id = $9
       RETURNING id, name, kind, amount, due_date::text AS due_date, notes, paid_at, card_id, created_at`,
      [debt.name, debt.kind, debt.amount, debt.dueDate, debt.notes, debt.paid, debt.cardId, id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Divida nao encontrada' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao editar divida:', err);
    return res.status(500).json({ error: 'Erro ao editar divida' });
  }
});

const CARD_BRANDS = ['visa', 'mastercard', 'elo', 'amex'];

function cardPayload(body) {
  const issuer = String(body.issuer || '').trim();
  const brand = String(body.brand || '').trim();
  const last4 = String(body.last4 || '').replace(/\D/g, '');
  const creditLimit = Number(body.credit_limit);
  const color = String(body.color || '').trim().toLowerCase();

  if (
    !issuer ||
    issuer.length > 80 ||
    !CARD_BRANDS.includes(brand) ||
    !/^\d{4}$/.test(last4) ||
    !Number.isFinite(creditLimit) ||
    creditLimit <= 0 ||
    creditLimit >= 1e10 ||
    (color && !/^#[0-9a-f]{6}$/.test(color))
  ) {
    return null;
  }

  return { issuer, brand, last4, creditLimit, color: color || null };
}

function chargePayload(body) {
  const description = String(body.description || '').trim();
  const amount = Number(body.amount);
  const spentRaw = String(body.spent_at || '').trim();
  const spent = spentRaw ? parseDate(spentRaw) : null;

  if (
    !description ||
    description.length > 120 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount >= 1e10 ||
    !spent
  ) {
    return null;
  }

  return { description, amount, spentAt: spent, paid: body.paid === true };
}

const CARD_SELECT = `id, issuer, brand, last4, color, credit_limit::float8 AS credit_limit, created_at`;
const CHARGE_SELECT = `id, card_id, description, amount::float8 AS amount, spent_at::text AS spent_at, paid_at, created_at, position`;

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function spMonth() {
  return new Date().toLocaleString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
}

function invoiceIsFutureDue(due, month) {
  const day = String(due || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return day.slice(0, 7) > month;
}

async function adjustCardInvoice(client, userId, card, delta) {
  const value = roundMoney(delta);
  if (!card || !value) return false;
  const month = spMonth();
  const listed = await client.query(
    `SELECT id, name, amount::float8 AS amount, due_date::text AS due_date, notes, paid_at, card_id
     FROM debts
     WHERE user_id = $1 AND kind = 'credit_card' AND (card_id = $2 OR card_id IS NULL)
     ORDER BY (card_id = $2) DESC, (paid_at IS NULL) DESC, due_date NULLS LAST, id DESC`,
    [userId, card.id]
  );
  const linked = listed.rows.filter((row) => Number(row.card_id) === Number(card.id));
  const unlinked = listed.rows.filter((row) => !row.card_id);
  const issuer = String(card.issuer || '').toLowerCase();
  const named = unlinked.filter((row) => issuer && String(row.name || '').toLowerCase().includes(issuer));
  const pool = linked.length ? linked : named.length ? named : unlinked.length === 1 ? unlinked : [];
  const open = pool.filter((row) => !row.paid_at);
  const paid = pool.filter((row) => row.paid_at);

  if (value < 0) {
    let left = -value;
    let changed = false;
    open.sort((a, b) => String(a.due_date || '9999').localeCompare(String(b.due_date || '9999')));
    for (const debt of open) {
      if (left <= 0.009) break;
      const current = roundMoney(debt.amount);
      const take = Math.min(current, left);
      if (take <= 0.009) continue;
      const next = roundMoney(current - take);
      left = roundMoney(left - take);
      if (next <= 0.009) {
        await client.query(
          'UPDATE debts SET paid_at = COALESCE(paid_at, NOW()), card_id = $1 WHERE id = $2 AND user_id = $3',
          [card.id, debt.id, userId]
        );
      } else {
        await client.query(
          'UPDATE debts SET amount = $1, paid_at = NULL, card_id = $2 WHERE id = $3 AND user_id = $4',
          [next, card.id, debt.id, userId]
        );
      }
      changed = true;
    }
    return changed;
  }

  const current = open.find((debt) => !invoiceIsFutureDue(debt.due_date, month)) || open[0];
  if (current) {
    await client.query(
      'UPDATE debts SET amount = $1, paid_at = NULL, card_id = $2 WHERE id = $3 AND user_id = $4',
      [roundMoney(Number(current.amount) + value), card.id, current.id, userId]
    );
    return true;
  }

  const lastPaid = paid
    .filter((debt) => !invoiceIsFutureDue(debt.due_date, month))
    .sort((a, b) => String(b.paid_at || '').localeCompare(String(a.paid_at || '')))[0];
  if (lastPaid) {
    await client.query(
      'UPDATE debts SET amount = $1, paid_at = NULL, card_id = $2 WHERE id = $3 AND user_id = $4',
      [value, card.id, lastPaid.id, userId]
    );
    return true;
  }

  const [year, mon] = month.split('-');
  await client.query(
    `INSERT INTO debts (user_id, name, kind, amount, notes, card_id)
     VALUES ($1, $2, 'credit_card', $3, $4, $5)`,
    [userId, `Fatura ${card.issuer} ${mon}/${year}`, value, 'Fatura do cartão', card.id]
  );
  return true;
}

async function cardsForUser(userId) {
  const cards = await db.query(
    `SELECT ${CARD_SELECT} FROM cards WHERE user_id = $1 ORDER BY id DESC`,
    [userId]
  );
  const charges = await db.query(
    `SELECT ${CHARGE_SELECT} FROM card_charges WHERE user_id = $1 ORDER BY position DESC, spent_at DESC, id DESC`,
    [userId]
  );
  const byId = new Map(cards.rows.map((card) => [card.id, { ...card, charges: [] }]));
  charges.rows.forEach((charge) => {
    const card = byId.get(charge.card_id);
    if (card) card.charges.push(charge);
  });
  return [...byId.values()];
}

app.get('/cards', authenticateToken, async (req, res) => {
  try {
    return res.json(await cardsForUser(req.user.id));
  } catch (err) {
    console.error('Erro ao listar cartoes:', err);
    return res.status(500).json({ error: 'Erro ao listar cartoes' });
  }
});

app.post('/cards', authenticateToken, async (req, res) => {
  const card = cardPayload(req.body || {});
  if (!card) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query(
      `INSERT INTO cards (user_id, issuer, brand, last4, credit_limit, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${CARD_SELECT}`,
      [req.user.id, card.issuer, card.brand, card.last4, card.creditLimit, card.color]
    );
    return res.status(201).json({ ...result.rows[0], charges: [] });
  } catch (err) {
    console.error('Erro ao criar cartao:', err);
    return res.status(500).json({ error: 'Erro ao criar cartao' });
  }
});

app.put('/cards/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const card = cardPayload(req.body || {});
  if (!id || !card) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query(
      `UPDATE cards
       SET issuer = $1, brand = $2, last4 = $3, credit_limit = $4, color = $5
       WHERE id = $6 AND user_id = $7
       RETURNING ${CARD_SELECT}`,
      [card.issuer, card.brand, card.last4, card.creditLimit, card.color, id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Cartao nao encontrado' });
    const full = await cardsForUser(req.user.id);
    return res.json(full.find((item) => item.id === id) || { ...result.rows[0], charges: [] });
  } catch (err) {
    console.error('Erro ao editar cartao:', err);
    return res.status(500).json({ error: 'Erro ao editar cartao' });
  }
});

app.delete('/cards/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query('DELETE FROM cards WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Cartao nao encontrado' });
    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Erro ao excluir cartao:', err);
    return res.status(500).json({ error: 'Erro ao excluir cartao' });
  }
});

app.post('/cards/:id/charges', authenticateToken, async (req, res) => {
  const cardId = Number(req.params.id);
  const charge = chargePayload(req.body || {});
  if (!cardId || !charge) return res.status(400).json({ error: 'Dados invalidos' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const owned = await client.query('SELECT id, issuer FROM cards WHERE id = $1 AND user_id = $2', [cardId, req.user.id]);
    const card = owned.rows[0];
    if (!card) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cartao nao encontrado' });
    }
    const result = await client.query(
      `INSERT INTO card_charges (user_id, card_id, description, amount, spent_at, paid_at)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $6 THEN NOW() ELSE NULL END)
       RETURNING ${CHARGE_SELECT}`,
      [req.user.id, cardId, charge.description, charge.amount, charge.spentAt, charge.paid]
    );
    await client.query('UPDATE card_charges SET position = $1 WHERE id = $1 AND position = 0', [result.rows[0].id]);
    if (!charge.paid) await adjustCardInvoice(client, req.user.id, card, charge.amount);
    await client.query('COMMIT');
    const snap = await walletSnapshot(req.user.id);
    return res.status(201).json({ ...result.rows[0], ...snap });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao lancar no cartao:', err);
    return res.status(500).json({ error: 'Erro ao lancar no cartao' });
  } finally {
    client.release();
  }
});

app.put('/cards/:id/charges/:chargeId', authenticateToken, async (req, res) => {
  const cardId = Number(req.params.id);
  const chargeId = Number(req.params.chargeId);
  const charge = chargePayload(req.body || {});
  if (!cardId || !chargeId || !charge) return res.status(400).json({ error: 'Dados invalidos' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const owned = await client.query('SELECT id, issuer FROM cards WHERE id = $1 AND user_id = $2', [cardId, req.user.id]);
    const card = owned.rows[0];
    if (!card) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cartao nao encontrado' });
    }
    const previous = await client.query(
      `SELECT amount::float8 AS amount, paid_at
       FROM card_charges
       WHERE id = $1 AND card_id = $2 AND user_id = $3`,
      [chargeId, cardId, req.user.id]
    );
    if (!previous.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lancamento nao encontrado' });
    }
    let delta = 0;
    if (!previous.rows[0].paid_at) delta -= Number(previous.rows[0].amount);
    if (!charge.paid) delta += charge.amount;
    const result = await client.query(
      `UPDATE card_charges
       SET description = $1,
           amount = $2,
           spent_at = $3,
           paid_at = CASE WHEN $4 THEN COALESCE(paid_at, NOW()) ELSE NULL END
       WHERE id = $5 AND card_id = $6 AND user_id = $7
       RETURNING ${CHARGE_SELECT}`,
      [charge.description, charge.amount, charge.spentAt, charge.paid, chargeId, cardId, req.user.id]
    );
    if (delta) await adjustCardInvoice(client, req.user.id, card, delta);
    await client.query('COMMIT');
    const snap = await walletSnapshot(req.user.id);
    return res.json({ ...result.rows[0], ...snap });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao editar lancamento do cartao:', err);
    return res.status(500).json({ error: 'Erro ao editar lancamento do cartao' });
  } finally {
    client.release();
  }
});

app.delete('/cards/:id/charges/:chargeId', authenticateToken, async (req, res) => {
  const cardId = Number(req.params.id);
  const chargeId = Number(req.params.chargeId);
  if (!cardId || !chargeId) return res.status(400).json({ error: 'Dados invalidos' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const owned = await client.query('SELECT id, issuer FROM cards WHERE id = $1 AND user_id = $2', [cardId, req.user.id]);
    const card = owned.rows[0];
    const previous = await client.query(
      `SELECT amount::float8 AS amount, paid_at
       FROM card_charges
       WHERE id = $1 AND card_id = $2 AND user_id = $3`,
      [chargeId, cardId, req.user.id]
    );
    if (!card || !previous.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lancamento nao encontrado' });
    }
    const result = await client.query(
      'DELETE FROM card_charges WHERE id = $1 AND card_id = $2 AND user_id = $3',
      [chargeId, cardId, req.user.id]
    );
    if (!previous.rows[0].paid_at) {
      await adjustCardInvoice(client, req.user.id, card, -Number(previous.rows[0].amount));
    }
    await client.query('COMMIT');
    const snap = await walletSnapshot(req.user.id);
    return res.json({ deleted: result.rowCount, ...snap });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao excluir lancamento do cartao:', err);
    return res.status(500).json({ error: 'Erro ao excluir lancamento do cartao' });
  } finally {
    client.release();
  }
});

app.post('/cards/:id/settle', authenticateToken, async (req, res) => {
  const cardId = Number(req.params.id);
  const amount = Number(req.body?.amount);
  const paid = req.body?.paid === true;
  if (!cardId || !Number.isFinite(amount) || amount <= 0 || amount >= 1e10) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const owned = await client.query('SELECT id FROM cards WHERE id = $1 AND user_id = $2', [cardId, req.user.id]);
    if (!owned.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cartao nao encontrado' });
    }
    const rows = await client.query(
      `SELECT id, amount::float8 AS amount
       FROM card_charges
       WHERE card_id = $1 AND user_id = $2 AND paid_at IS ${paid ? 'NULL' : 'NOT NULL'}
       ORDER BY ${paid ? 'spent_at ASC, id ASC' : 'paid_at DESC, id DESC'}`,
      [cardId, req.user.id]
    );
    let left = amount;
    const ids = [];
    for (const row of rows.rows) {
      if (Number(row.amount) - left > 0.009) break;
      ids.push(row.id);
      left -= Number(row.amount);
    }
    if (ids.length) {
      await client.query(
        `UPDATE card_charges
         SET paid_at = ${paid ? 'COALESCE(paid_at, NOW())' : 'NULL'}
         WHERE user_id = $1 AND id = ANY($2::int[])`,
        [req.user.id, ids]
      );
    }
    await client.query('COMMIT');
    return res.json({ settled: ids.length, amount: Math.round((amount - left) * 100) / 100 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao quitar fatura do cartao:', err);
    return res.status(500).json({ error: 'Erro ao quitar fatura do cartao' });
  } finally {
    client.release();
  }
});

app.delete('/debts/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query('DELETE FROM debts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Divida nao encontrada' });
    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Erro ao excluir divida:', err);
    return res.status(500).json({ error: 'Erro ao excluir divida' });
  }
});

const SUB_CYCLES = ['monthly', 'yearly'];

function cleanPaidDates(value) {
  let list = value;
  if (list == null || list === '') return [];
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const item of list.slice(0, 240)) {
    const day = parseDate(String(item || '').slice(0, 10));
    if (!day) return null;
    if (!out.includes(day)) out.push(day);
  }
  return out;
}

function subscriptionPayload(body) {
  const name = String(body.name || '').trim();
  const cycle = String(body.cycle || '').trim();
  const amount = Number(body.amount);
  const notes = String(body.notes || '').trim();
  const dueRaw = String(body.due_date || '').trim();
  const due = dueRaw ? parseDate(dueRaw) : null;
  const billedRaw = String(body.billed_due || '').trim();
  const billed = billedRaw ? parseDate(billedRaw) : null;
  const payWith = body.pay_with === 'card' ? 'card' : 'other';
  const paidDates = cleanPaidDates(body.paid_dates);

  if (
    !name ||
    name.length > 120 ||
    !SUB_CYCLES.includes(cycle) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount >= 1e10 ||
    notes.length > 240 ||
    (dueRaw && !due) ||
    (billedRaw && !billed) ||
    !paidDates
  ) {
    return null;
  }

  return {
    name,
    cycle,
    amount,
    notes: notes || null,
    dueDate: due,
    active: body.active !== false,
    payWith,
    billedDue: billed,
    paidDates: JSON.stringify(paidDates),
  };
}

app.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, cycle, amount, due_date::text AS due_date, notes, active, pay_with, billed_due::text AS billed_due, paid_dates, created_at
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY active DESC, position DESC, due_date NULLS LAST, id DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar assinaturas:', err);
    return res.status(500).json({ error: 'Erro ao listar assinaturas' });
  }
});

app.post('/subscriptions', authenticateToken, async (req, res) => {
  const sub = subscriptionPayload(req.body || {});
  if (!sub) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query(
      `INSERT INTO subscriptions (user_id, name, cycle, amount, due_date, notes, active, pay_with, billed_due, paid_dates)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, cycle, amount, due_date::text AS due_date, notes, active, pay_with, billed_due::text AS billed_due, paid_dates, created_at`,
      [req.user.id, sub.name, sub.cycle, sub.amount, sub.dueDate, sub.notes, sub.active, sub.payWith, sub.billedDue, sub.paidDates]
    );
    await stampTablePosition('subscriptions', result.rows[0].id);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar assinatura:', err);
    return res.status(500).json({ error: 'Erro ao criar assinatura' });
  }
});

app.put('/subscriptions/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const sub = subscriptionPayload(req.body || {});
  if (!id || !sub) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query(
      `UPDATE subscriptions
       SET name = $1, cycle = $2, amount = $3, due_date = $4, notes = $5, active = $6, pay_with = $7, billed_due = $8, paid_dates = $9
       WHERE id = $10 AND user_id = $11
       RETURNING id, name, cycle, amount, due_date::text AS due_date, notes, active, pay_with, billed_due::text AS billed_due, paid_dates, created_at`,
      [sub.name, sub.cycle, sub.amount, sub.dueDate, sub.notes, sub.active, sub.payWith, sub.billedDue, sub.paidDates, id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Assinatura nao encontrada' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao editar assinatura:', err);
    return res.status(500).json({ error: 'Erro ao editar assinatura' });
  }
});

app.delete('/subscriptions/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query('DELETE FROM subscriptions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Assinatura nao encontrada' });
    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Erro ao excluir assinatura:', err);
    return res.status(500).json({ error: 'Erro ao excluir assinatura' });
  }
});

const SAVE_KINDS = {
  investment: ['Renda fixa', 'Ações', 'Fundos', 'Tesouro', 'Cripto', 'Previdência', 'Outros'],
  piggy: ['Viagem', 'Casa', 'Carro', 'Estudos', 'Presentes', 'Emergência', 'Dinheiro guardado', 'Outros'],
};

function saoPauloDay() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function cleanDay(value) {
  const day = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [year, month, date] = day.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, date));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) return null;
  return day;
}

function normalizePiggyEntries(value) {
  if (!Array.isArray(value)) return undefined;
  const list = [];
  for (const raw of value.slice(0, 240)) {
    const amount = Math.round(Number(raw?.amount) * 100) / 100;
    const deposited_at = cleanDay(raw?.deposited_at);
    if (!Number.isFinite(amount) || amount <= 0 || amount >= 1e10 || !deposited_at) return null;
    list.push({ amount, deposited_at });
  }
  return list;
}

function savingPayload(body) {
  const name = String(body.name || '').trim();
  const kind = String(body.kind || '').trim();
  const category = String(body.category || '').trim();
  const amount = Number(body.amount);
  const notes = String(body.notes || '').trim();
  const allowed = SAVE_KINDS[kind];
  const amountOk = Number.isFinite(amount) && amount < 1e10 && (kind === 'piggy' ? amount >= 0 : amount > 0);

  if (!name || name.length > 120 || !allowed || !allowed.includes(category) || !amountOk || notes.length > 240) {
    return null;
  }

  return { name, kind, category, amount: Math.round(amount * 100) / 100, notes: notes || null };
}

async function listSavings(userId) {
  const result = await db.query(
    `SELECT s.id, s.name, s.kind, s.category, s.amount, s.notes, s.created_at, s.position,
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'id', e.id,
                    'amount', e.amount,
                    'deposited_at', to_char(e.deposited_at, 'YYYY-MM-DD')
                  )
                  ORDER BY e.deposited_at DESC, e.id DESC
                )
                FROM piggy_entries e
                WHERE e.saving_id = s.id
              ),
              '[]'::json
            ) AS entries
     FROM savings s
     WHERE s.user_id = $1
     ORDER BY s.position DESC, s.kind, s.category, s.id DESC`,
    [userId]
  );
  return result.rows;
}

async function insertPiggyEntries(userId, savingId, entries) {
  for (const entry of entries) {
    await db.query(
      `INSERT INTO piggy_entries (user_id, saving_id, amount, deposited_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, savingId, entry.amount, entry.deposited_at]
    );
  }
  await db.query(
    `UPDATE savings
     SET amount = COALESCE((SELECT SUM(amount) FROM piggy_entries WHERE saving_id = $1), 0)
     WHERE id = $1 AND user_id = $2`,
    [savingId, userId]
  );
}

app.get('/savings', authenticateToken, async (req, res) => {
  try {
    return res.json(await listSavings(req.user.id));
  } catch (err) {
    console.error('Erro ao listar guardado:', err);
    return res.status(500).json({ error: 'Erro ao listar guardado' });
  }
});

app.post('/savings', authenticateToken, async (req, res) => {
  const item = savingPayload(req.body || {});
  if (!item) return res.status(400).json({ error: 'Dados invalidos' });
  const listed = item.kind === 'piggy' ? normalizePiggyEntries(req.body?.entries) : undefined;
  if (listed === null) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query(
      `INSERT INTO savings (user_id, name, kind, category, amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [req.user.id, item.name, item.kind, item.category, item.amount, item.notes]
    );
    const id = result.rows[0].id;
    await stampTablePosition('savings', id);
    if (item.kind === 'piggy') {
      const entries = listed || (item.amount > 0 ? [{ amount: item.amount, deposited_at: cleanDay(req.body?.deposited_at) || saoPauloDay() }] : []);
      if (entries.length) await insertPiggyEntries(req.user.id, id, entries);
    }
    const saved = (await listSavings(req.user.id)).find((row) => row.id === id);
    return res.status(201).json(saved);
  } catch (err) {
    console.error('Erro ao criar guardado:', err);
    return res.status(500).json({ error: 'Erro ao criar guardado' });
  }
});

app.put('/savings/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const item = savingPayload(req.body || {});
  if (!id || !item) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const current = await db.query('SELECT kind, amount FROM savings WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (!current.rows[0]) return res.status(404).json({ error: 'Item nao encontrado' });
    const amount = item.kind === 'piggy' ? current.rows[0].amount : item.amount;
    await db.query(
      `UPDATE savings
       SET name = $1, kind = $2, category = $3, amount = $4, notes = $5
       WHERE id = $6 AND user_id = $7`,
      [item.name, item.kind, item.category, amount, item.notes, id, req.user.id]
    );
    if (item.kind === 'piggy') {
      const count = await db.query('SELECT COUNT(*)::int AS n FROM piggy_entries WHERE saving_id = $1', [id]);
      if (count.rows[0].n === 0 && Number(amount) > 0) {
        await insertPiggyEntries(req.user.id, id, [{ amount: Number(amount), deposited_at: saoPauloDay() }]);
      }
    } else {
      await db.query('DELETE FROM piggy_entries WHERE saving_id = $1 AND user_id = $2', [id, req.user.id]);
    }
    const saved = (await listSavings(req.user.id)).find((row) => row.id === id);
    return res.json(saved);
  } catch (err) {
    console.error('Erro ao editar guardado:', err);
    return res.status(500).json({ error: 'Erro ao editar guardado' });
  }
});

app.delete('/savings/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query('DELETE FROM savings WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Item nao encontrado' });
    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Erro ao excluir guardado:', err);
    return res.status(500).json({ error: 'Erro ao excluir guardado' });
  }
});

app.post('/savings/:id/entries', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const amount = Math.round(Number(req.body?.amount) * 100) / 100;
  const depositedAt = cleanDay(req.body?.deposited_at);
  if (!id || !Number.isFinite(amount) || amount <= 0 || amount >= 1e10 || !depositedAt) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const current = await db.query(
      `SELECT id FROM savings WHERE id = $1 AND user_id = $2 AND kind = 'piggy'`,
      [id, req.user.id]
    );
    if (!current.rows[0]) return res.status(404).json({ error: 'Cofrinho nao encontrado' });
    await insertPiggyEntries(req.user.id, id, [{ amount, deposited_at: depositedAt }]);
    const saved = (await listSavings(req.user.id)).find((row) => row.id === id);
    return res.status(201).json(saved);
  } catch (err) {
    console.error('Erro ao guardar no cofrinho:', err);
    return res.status(500).json({ error: 'Erro ao guardar no cofrinho' });
  }
});

app.delete('/savings/:id/entries/:entryId', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const entryId = Number(req.params.entryId);
  if (!id || !entryId) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query(
      `DELETE FROM piggy_entries e
       USING savings s
       WHERE e.id = $1 AND e.saving_id = $2 AND s.id = e.saving_id AND s.user_id = $3 AND s.kind = 'piggy'`,
      [entryId, id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Deposito nao encontrado' });
    await db.query(
      `UPDATE savings
       SET amount = COALESCE((SELECT SUM(amount) FROM piggy_entries WHERE saving_id = $1), 0)
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Erro ao excluir deposito:', err);
    return res.status(500).json({ error: 'Erro ao excluir deposito' });
  }
});

telegram.setup(app, authenticateToken);

app.delete('/transactions/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transacao nao encontrada' });
    }

    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Erro ao deletar transacao:', err);
    return res.status(500).json({ error: 'Erro ao deletar transacao' });
  }
});

const PORT = process.env.PORT || 3000;

db.initDatabase()
  .then(() => telegram.start())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(MAIL_READY ? 'E-mail de senha: provedor configurado' : 'E-mail de senha: sem BREVO_API_KEY nem RESEND_API_KEY');
      console.log(`APP_URL: ${APP_URL}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao iniciar banco:', err);
    process.exit(1);
  });
