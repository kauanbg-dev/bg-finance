require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = require('./database');

const app = express();
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'frontend')));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET nao definida no .env');
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
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

  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha muito curta (min. 6 caracteres)' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

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

const attempts = new Map();

function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > max;
}

setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [key, list] of attempts) {
    if (!list.some((t) => t > cutoff)) attempts.delete(key);
  }
}, 10 * 60 * 1000).unref();

const RESET_TTL_MINUTES = 30;
const APP_URL = (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

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
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html }),
    });
    if (!response.ok) throw new Error(`Brevo respondeu ${response.status}: ${await response.text()}`);
    return true;
  }

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'BG Finance <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
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
  if (!sent) console.warn(`Nenhum provedor de e-mail configurado. Link de redefinicao para ${to}: ${link}`);
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const generic = { ok: true, message: 'Se esse e-mail estiver cadastrado, enviaremos um link para redefinir a senha.' };

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Digite um e-mail valido' });
  }

  if (rateLimited(`forgot:${req.ip}`, 5, 15 * 60 * 1000) || rateLimited(`forgot:${email}`, 3, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente de novo em alguns minutos.' });
  }

  try {
    const result = await db.query('SELECT id, name FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.json(generic);

    const token = crypto.randomBytes(32).toString('base64url');
    await db.query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [user.id]);
    await db.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
      [user.id, hashToken(token), String(RESET_TTL_MINUTES)]
    );

    await sendResetEmail(email, user.name, `${APP_URL}/reset.html?token=${token}`);
    return res.json(generic);
  } catch (err) {
    console.error('Erro ao solicitar redefinicao de senha:', err);
    return res.status(500).json({ error: 'Nao foi possivel enviar o e-mail agora. Tente mais tarde.' });
  }
}

async function resetPassword(req, res) {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (!token || password.length < 6) {
    return res.status(400).json({ error: 'Senha muito curta (min. 6 caracteres)' });
  }

  if (rateLimited(`reset:${req.ip}`, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente de novo em alguns minutos.' });
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

    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, row.user_id]);
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [row.user_id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    return res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
}

async function login(req, res) {
  const { email, password } = normalizeAuthInput(req.body);

  if (rateLimited(`login:${req.ip}:${email}`, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente de novo em alguns minutos.' });
  }

  try {
    const result = await db.query(
      'SELECT id, name, email, password FROM users WHERE email = $1',
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
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '21d' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.post('/auth/register', register);
app.post('/register', register);
app.post('/auth/login', login);
app.post('/login', login);
app.post('/auth/forgot', forgotPassword);
app.post('/auth/reset', resetPassword);

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
         t.date
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ${monthFilter}
       ORDER BY t.date DESC, t.id DESC`,
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

    return res.status(201).json({ id: result.rows[0].id });
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

function mapBankCategory(raw, type) {
  const text = String(raw || '').toLowerCase();
  if (/mercado|supermerc|aliment|restaurante|ifood|padaria|bar/.test(text)) return 'Alimentacao';
  if (/transporte|uber|combust|posto/.test(text)) return 'Transporte';
  if (/assinatura|streaming|spotify|netflix/.test(text)) return 'Assinaturas';
  if (/moradia|casa|aluguel|condomin/.test(text)) return 'Moradia';
  if (/saude|saúde|farmac|drogaria/.test(text)) return 'Saude';
  if (/lazer|entreten/.test(text)) return 'Lazer';
  if (/educa|curso|escola/.test(text)) return 'Educacao';
  if (/trabalho/.test(text)) return 'Trabalho';
  if (type === 'income' && /salario|salário|holerite/.test(text)) return 'Salario';
  if (type === 'income' && /invest|rendimento|dividendo/.test(text)) return 'Investimentos';
  return 'Outros';
}

app.post('/imports/statement', authenticateToken, async (req, res) => {
  const source = req.body?.source === 'card' ? 'card' : req.body?.source === 'account' ? 'account' : '';
  const rows = Array.isArray(req.body?.rows) ? req.body.rows.slice(0, 800) : [];
  if (!source || !rows.length) return res.status(400).json({ error: 'Arquivo sem lancamentos' });

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
      await client.query(
        `INSERT INTO transactions (description, amount, type, user_id, category_id, date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [description, amount, type, req.user.id, categoryId, date]
      );
      added += 1;
      if (source === 'card' && type === 'expense') {
        const month = day.slice(0, 7);
        invoiceTotals.set(month, (invoiceTotals.get(month) || 0) + amount);
      }
    }

    let debts = 0;
    for (const [month, total] of invoiceTotals) {
      const [year, mon] = month.split('-');
      const name = `Fatura do cartão ${mon}/${year}`;
      const rounded = Math.round(total * 100) / 100;
      const existing = await client.query(
        `SELECT id FROM debts WHERE user_id = $1 AND name = $2 AND paid_at IS NULL LIMIT 1`,
        [req.user.id, name]
      );
      if (existing.rows[0]) {
        await client.query(
          `UPDATE debts SET amount = $1, kind = 'credit_card', notes = $2 WHERE id = $3`,
          [rounded, 'Importada da fatura', existing.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO debts (user_id, name, kind, amount, notes)
           VALUES ($1, $2, 'credit_card', $3, $4)`,
          [req.user.id, name, rounded, 'Importada da fatura']
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

  return {
    name,
    kind,
    amount,
    notes: notes || null,
    dueDate: due,
    paid: body.paid === true,
  };
}

app.get('/debts', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, kind, amount, due_date::text AS due_date, notes, paid_at, created_at
       FROM debts
       WHERE user_id = $1
       ORDER BY (paid_at IS NULL) DESC, due_date NULLS LAST, id DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar dividas:', err);
    return res.status(500).json({ error: 'Erro ao listar dividas' });
  }
});

app.post('/debts', authenticateToken, async (req, res) => {
  const debt = debtPayload(req.body || {});
  if (!debt) return res.status(400).json({ error: 'Dados invalidos' });

  try {
    const result = await db.query(
      `INSERT INTO debts (user_id, name, kind, amount, due_date, notes, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7 THEN NOW() ELSE NULL END)
       RETURNING id, name, kind, amount, due_date::text AS due_date, notes, paid_at, created_at`,
      [req.user.id, debt.name, debt.kind, debt.amount, debt.dueDate, debt.notes, debt.paid]
    );
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
           END
       WHERE id = $7 AND user_id = $8
       RETURNING id, name, kind, amount, due_date::text AS due_date, notes, paid_at, created_at`,
      [debt.name, debt.kind, debt.amount, debt.dueDate, debt.notes, debt.paid, id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Divida nao encontrada' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao editar divida:', err);
    return res.status(500).json({ error: 'Erro ao editar divida' });
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
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao iniciar banco:', err);
    process.exit(1);
  });
