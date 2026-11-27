const crypto = require('crypto');
const db = require('./database');
const advisor = require('./advisor');

const TOKEN = String(process.env.WHATSAPP_TOKEN || '').trim();
const PHONE_NUMBER_ID = String(process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
const APP_SECRET = String(process.env.WHATSAPP_APP_SECRET || '').trim();
const VERIFY_TOKEN = String(
  process.env.WHATSAPP_VERIFY_TOKEN
  || (process.env.JWT_SECRET
    ? crypto.createHmac('sha256', process.env.JWT_SECRET).update('whatsapp-verify').digest('hex').slice(0, 32)
    : '')
).trim();
const DISPLAY_NUMBER = String(process.env.WHATSAPP_DISPLAY_NUMBER || '').replace(/\D/g, '');
const GRAPH = 'https://graph.facebook.com/v21.0';
const APP_URL = (process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');

let ready = false;
const seenMessages = new Set();
const chatHits = new Map();

function configured() {
  return ready;
}

function displayNumber() {
  return DISPLAY_NUMBER;
}

function waMeLink() {
  return DISPLAY_NUMBER ? `https://wa.me/${DISPLAY_NUMBER}` : '';
}

async function api(path, body) {
  const response = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const msg = data.error?.message || `WhatsApp ${response.status}`;
    throw new Error(msg);
  }
  return data;
}

function signatureOk(req) {
  if (!APP_SECRET) return true;
  const header = String(req.get('x-hub-signature-256') || '');
  if (!header.startsWith('sha256=') || !req.rawBody) return false;
  const expect = crypto.createHmac('sha256', APP_SECRET).update(req.rawBody).digest('hex');
  const got = header.slice('sha256='.length);
  try {
    const a = Buffer.from(expect, 'hex');
    const b = Buffer.from(got, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function tooFast(waId) {
  const now = Date.now();
  const recent = (chatHits.get(waId) || []).filter((t) => now - t < 60 * 1000);
  recent.push(now);
  chatHits.set(waId, recent);
  return recent.length > 20;
}

function rememberMessage(id) {
  if (!id || seenMessages.has(id)) return false;
  seenMessages.add(id);
  if (seenMessages.size > 400) {
    const first = seenMessages.values().next().value;
    seenMessages.delete(first);
  }
  return true;
}

function bold(value) {
  return `*${String(value).replace(/\*/g, '')}*`;
}

function money(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function todaySaoPaulo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function parseAmount(raw) {
  let text = String(raw || '').trim().replace(/[R$\s]/g, '');
  if (!text) return NaN;
  if (text.includes(',') && text.includes('.')) text = text.replace(/\./g, '').replace(',', '.');
  else if (text.includes(',')) text = text.replace(',', '.');
  const amount = Number(text);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : NaN;
}

function parseCommand(text) {
  const match = String(text || '').trim().match(/^\/?([A-Za-zÀ-ÿ_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
  if (!match) return null;
  return {
    command: match[1].toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''),
    rest: (match[2] || '').trim(),
  };
}

function categoryName(raw, type) {
  const text = String(raw || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (/mercado|supermerc|aliment|restaurante|ifood|padaria|bar|almoco|jantar/.test(text)) return 'Alimentação';
  if (/transporte|uber|\b99\b|combust|posto/.test(text)) return 'Transporte';
  if (/assinatura|streaming|spotify|netflix/.test(text)) return 'Assinaturas';
  if (/internet|telefone|celular|luz|energia|agua|conta de/.test(text)) return 'Contas';
  if (/moradia|casa|aluguel|condomin/.test(text)) return 'Moradia';
  if (/saude|farmac|drogaria/.test(text)) return 'Saúde';
  if (/pet|racao|veterin/.test(text)) return 'Pets';
  if (/roupa|shopping|compra/.test(text)) return 'Compras';
  if (/imposto|ipva|iptu|multa/.test(text)) return 'Impostos';
  if (/lazer|cinema|entreten/.test(text)) return 'Lazer';
  if (/educa|curso|escola/.test(text)) return 'Educação';
  if (/trabalho/.test(text)) return 'Trabalho';
  if (/cofrinho|poupanca|dinheiro guardado/.test(text)) return 'Dinheiro guardado';
  if (type === 'income' && /salario|holerite/.test(text)) return 'Salário';
  if (type === 'income' && /freelance/.test(text)) return 'Freelance';
  if (type === 'income' && /invest|rendimento|dividendo/.test(text)) return 'Investimentos';
  if (type === 'income' && /reembolso/.test(text)) return 'Reembolso';
  if (type === 'income' && /beneficio|vr\b|vale|ferias|plr/.test(text)) return 'Benefícios';
  return 'Outros';
}

async function categoryId(userId, type, name) {
  const result = await db.query(
    `SELECT id
     FROM categories
     WHERE type = $1
       AND LOWER(name) = LOWER($2)
       AND (user_id IS NULL OR user_id = $3)
     ORDER BY user_id NULLS LAST
     LIMIT 1`,
    [type, name, userId]
  );
  return result.rows[0] ? result.rows[0].id : null;
}

async function send(waId, text) {
  if (!TOKEN || !PHONE_NUMBER_ID || !waId) return false;
  const body = String(text || '').slice(0, 4000);
  await api(`${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to: String(waId).replace(/\D/g, ''),
    type: 'text',
    text: { preview_url: false, body },
  });
  return true;
}

function helpText() {
  return [
    bold('BG Finance'),
    '',
    'No app, abra Ajustes e gere um código. Depois mande:',
    'vincular CODIGO',
    '',
    'saldo — mês atual',
    'dividas — o que falta pagar',
    'proximo — quanto pagar no mês que vem',
    'vence — o que vence este mês',
    'faturas — faturas de cartão em aberto',
    'extrato — últimos lançamentos',
    'gasto 49,90 mercado',
    'receita 1500 salario',
    'desvincular',
    '',
    'Também dá para perguntar em português, tipo:',
    '_quanto eu pago no próximo mês?_',
  ].join('\n');
}

function codeHash(code) {
  return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
}

function newCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(6), (byte) => alphabet[byte % alphabet.length]).join('');
}

async function linkedUser(waId) {
  const result = await db.query(
    'SELECT id, name FROM users WHERE whatsapp_wa_id = $1',
    [String(waId)]
  );
  return result.rows[0] || null;
}

async function linkPhone(waId, code) {
  const result = await db.query(
    `UPDATE whatsapp_links
     SET used_at = NOW()
     WHERE code_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING user_id`,
    [codeHash(code)]
  );
  const userId = result.rows[0]?.user_id;
  if (!userId) return null;
  await db.query(
    'UPDATE users SET whatsapp_wa_id = NULL WHERE whatsapp_wa_id = $1 AND id <> $2',
    [String(waId), userId]
  );
  await db.query('UPDATE users SET whatsapp_wa_id = $1 WHERE id = $2', [String(waId), userId]);
  const user = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
  return user.rows[0] || { name: '' };
}

async function monthSummary(userId) {
  const result = await db.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
     FROM transactions
     WHERE user_id = $1
       AND TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') = TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')`,
    [userId]
  );
  const income = Number(result.rows[0].income);
  const expense = Number(result.rows[0].expense);
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' });
  return [
    bold(month),
    `Receitas: ${money(income)}`,
    `Despesas: ${money(expense)}`,
    `Saldo: ${money(income - expense)}`,
  ].join('\n');
}

async function debtList(userId) {
  const result = await db.query(
    `SELECT name, amount, due_date::text AS due_date
     FROM debts
     WHERE user_id = $1 AND paid_at IS NULL
     ORDER BY due_date NULLS LAST, id
     LIMIT 10`,
    [userId]
  );
  if (!result.rows.length) return 'Nenhuma dívida em aberto.';
  const lines = result.rows.map((debt) => {
    const due = debt.due_date ? debt.due_date.slice(8) + '/' + debt.due_date.slice(5, 7) : 'sem data';
    return `• ${debt.name} — ${money(debt.amount)} (${due})`;
  });
  const total = result.rows.reduce((sum, debt) => sum + Number(debt.amount), 0);
  return [`${bold(`Em aberto: ${money(total)}`)}`, ...lines].join('\n');
}

async function recentLines(userId) {
  const result = await db.query(
    `SELECT description, amount, type, TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') AS day
     FROM transactions
     WHERE user_id = $1
     ORDER BY date DESC, position DESC, id DESC
     LIMIT 5`,
    [userId]
  );
  if (!result.rows.length) return 'Ainda não há lançamentos.';
  return result.rows.map((row) => {
    const sign = row.type === 'income' ? '+' : '−';
    return `${row.day} ${sign}${money(row.amount)} ${row.description}`;
  }).join('\n');
}

async function addTransaction(userId, type, rest) {
  const match = rest.match(/^(\S+)\s+(.+)$/);
  if (!match) return 'Use o valor e a descrição. Exemplo: gasto 49,90 mercado';
  const amount = parseAmount(match[1]);
  const description = match[2].trim().slice(0, 120);
  if (!description || !Number.isFinite(amount) || amount <= 0 || amount >= 1e10) {
    return 'Não entendi o valor. Exemplo: gasto 49,90 mercado';
  }
  const name = categoryName(`${description} ${match[1]}`, type);
  const id = await categoryId(userId, type, name);
  const created = await db.query(
    `INSERT INTO transactions (description, amount, type, user_id, category_id, date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [description, amount, type, userId, id, `${todaySaoPaulo()}T12:00:00-03:00`]
  );
  if (created.rows[0]) {
    await db.query('UPDATE transactions SET position = $1 WHERE id = $1 AND position = 0', [created.rows[0].id]);
  }
  const label = type === 'income' ? 'Receita' : 'Despesa';
  return `${label} lançada: ${money(amount)} em ${description}.`;
}

async function handleInbound({ waId, text, messageId }) {
  if (!waId || !text) return;
  if (messageId && !rememberMessage(messageId)) return;
  if (tooFast(waId)) {
    await send(waId, 'Muitas mensagens seguidas. Espera um instante.');
    return;
  }

  const parsed = parseCommand(text);

  if (parsed?.command === 'start' || parsed?.command === 'ajuda' || parsed?.command === 'help' || parsed?.command === 'oi' || parsed?.command === 'ola') {
    await send(waId, helpText());
    return;
  }

  if (parsed?.command === 'vincular' || parsed?.command === 'conectar') {
    const code = parsed.rest.split(/\s+/)[0] || '';
    if (!/^[A-Za-z0-9]{6}$/.test(code)) {
      await send(waId, 'O código tem 6 caracteres. Gere outro em Ajustes e mande: vincular CODIGO');
      return;
    }
    const user = await linkPhone(waId, code);
    await send(
      waId,
      user
        ? `Conta ligada${user.name ? `, ${user.name}` : ''}. Manda *saldo* para ver o mês.`
        : 'Código inválido ou vencido. Gere outro em Ajustes.'
    );
    return;
  }

  const user = await linkedUser(waId);
  if (!user) {
    await send(
      waId,
      'Essa conversa ainda não está ligada a uma conta.\n\nNo app, abra Ajustes, gere um código e mande: vincular CODIGO'
    );
    return;
  }

  if (parsed?.command === 'desvincular' || parsed?.command === 'sair') {
    await db.query('UPDATE users SET whatsapp_wa_id = NULL WHERE id = $1', [user.id]);
    await send(waId, 'Conta desvinculada deste WhatsApp.');
    return;
  }
  if (parsed?.command === 'saldo' || parsed?.command === 'resumo') {
    await send(waId, await monthSummary(user.id));
    return;
  }
  if (parsed?.command === 'dividas' || parsed?.command === 'divida') {
    await send(waId, await debtList(user.id));
    return;
  }
  if (parsed?.command === 'extrato') {
    await send(waId, await recentLines(user.id));
    return;
  }
  if (parsed?.command === 'gasto' || parsed?.command === 'despesa') {
    await send(waId, await addTransaction(user.id, 'expense', parsed.rest));
    return;
  }
  if (parsed?.command === 'receita' || parsed?.command === 'entrada') {
    await send(waId, await addTransaction(user.id, 'income', parsed.rest));
    return;
  }

  const result = await advisor.ask(user.id, text);
  await send(waId, result.textPlain);
}

async function onWebhook(body) {
  if (!body || body.object !== 'whatsapp_business_account') return;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field && change.field !== 'messages') continue;
      const value = change.value || {};
      for (const message of value.messages || []) {
        if (message.type !== 'text' || !message.text?.body) continue;
        await handleInbound({
          waId: message.from,
          text: message.text.body,
          messageId: message.id,
        });
      }
    }
  }
}

function setup(app, auth) {
  app.get('/whatsapp', auth, (req, res) => {
    db.query('SELECT whatsapp_wa_id FROM users WHERE id = $1', [req.user.id])
      .then((result) => res.json({
        configured: configured(),
        linked: Boolean(result.rows[0]?.whatsapp_wa_id),
        display_number: displayNumber() || null,
        link: waMeLink() || null,
      }))
      .catch((err) => {
        console.error('Erro ao ler WhatsApp:', err);
        res.status(500).json({ error: 'Erro ao ler WhatsApp' });
      });
  });

  app.post('/whatsapp/link', auth, async (req, res) => {
    if (!configured()) return res.status(503).json({ error: 'WhatsApp ainda nao configurado' });
    try {
      const recent = await db.query(
        `SELECT COUNT(*)::int AS total
         FROM whatsapp_links
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [req.user.id]
      );
      if (recent.rows[0].total >= 8) {
        return res.status(429).json({ error: 'Muitos códigos agora. Tenta de novo em uma hora' });
      }

      await db.query(
        'UPDATE whatsapp_links SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [req.user.id]
      );
      const code = newCode();
      await db.query(
        `INSERT INTO whatsapp_links (user_id, code_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
        [req.user.id, codeHash(code)]
      );
      return res.json({
        code,
        display_number: displayNumber() || null,
        link: waMeLink() || null,
        expires_in: 900,
      });
    } catch (err) {
      console.error('Erro ao gerar codigo do WhatsApp:', err);
      return res.status(500).json({ error: 'Erro ao gerar codigo' });
    }
  });

  app.delete('/whatsapp', auth, async (req, res) => {
    try {
      await db.query('UPDATE users SET whatsapp_wa_id = NULL WHERE id = $1', [req.user.id]);
      return res.json({ linked: false });
    } catch (err) {
      console.error('Erro ao desvincular WhatsApp:', err);
      return res.status(500).json({ error: 'Erro ao desvincular' });
    }
  });

  app.get('/whatsapp/webhook', (req, res) => {
    const mode = String(req.query['hub.mode'] || '');
    const token = String(req.query['hub.verify_token'] || '');
    const challenge = String(req.query['hub.challenge'] || '');
    if (mode === 'subscribe' && VERIFY_TOKEN && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  });

  app.post('/whatsapp/webhook', async (req, res) => {
    if (!TOKEN || !PHONE_NUMBER_ID || !signatureOk(req)) {
      return res.status(404).json({ error: 'Nao encontrado' });
    }
    res.json({ ok: true });
    try {
      await onWebhook(req.body);
    } catch (err) {
      console.error('Erro no webhook do WhatsApp:', err);
    }
  });
}

async function start() {
  if (!TOKEN || !PHONE_NUMBER_ID) {
    console.log('WhatsApp desligado (sem WHATSAPP_TOKEN ou WHATSAPP_PHONE_NUMBER_ID)');
    return;
  }
  if (!VERIFY_TOKEN) {
    console.log('WhatsApp desligado (sem WHATSAPP_VERIFY_TOKEN / JWT_SECRET)');
    return;
  }
  ready = true;
  if (!process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log(`WhatsApp verify token (derivado do JWT_SECRET): ${VERIFY_TOKEN}`);
  }
  if (!APP_SECRET) {
    console.log('WhatsApp sem WHATSAPP_APP_SECRET: webhook aceito sem assinatura');
  }
  if (APP_URL.startsWith('https://')) {
    console.log(`WhatsApp ouvindo ${APP_URL}/whatsapp/webhook (cadastre esse URL no Meta)`);
  } else {
    console.log('WhatsApp pronto, mas APP_URL precisa ser https para o webhook da Meta');
  }
}

module.exports = { setup, start, configured, displayNumber, waMeLink, send };
