const crypto = require('crypto');
const db = require('./database');

const TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
const APP_URL = (process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const WEBHOOK_SECRET = crypto.createHmac('sha256', process.env.JWT_SECRET || 'bg-finance').update('telegram-webhook').digest('hex');

let botUsername = '';
let ready = false;
const seenUpdates = new Set();
const chatHits = new Map();

function configured() {
  return ready;
}

function username() {
  return botUsername;
}

async function api(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.description || `Telegram ${method}`);
  return data.result;
}

function secretOk(header) {
  const got = Buffer.from(String(header || ''));
  const expect = Buffer.from(WEBHOOK_SECRET);
  return got.length === expect.length && crypto.timingSafeEqual(got, expect);
}

function tooFast(chatId) {
  const now = Date.now();
  const recent = (chatHits.get(chatId) || []).filter((t) => now - t < 60 * 1000);
  recent.push(now);
  chatHits.set(chatId, recent);
  return recent.length > 20;
}

function rememberUpdate(id) {
  if (seenUpdates.has(id)) return false;
  seenUpdates.add(id);
  if (seenUpdates.size > 400) {
    const first = seenUpdates.values().next().value;
    seenUpdates.delete(first);
  }
  return true;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
  return { command: match[1].toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''), rest: (match[2] || '').trim() };
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

async function send(chatId, text) {
  await api('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

async function sendResetLink(chatId, link) {
  if (!TOKEN || !chatId) return false;
  await send(
    chatId,
    [
      '<b>Redefinir senha</b>',
      '',
      'Alguém pediu para trocar a senha da sua conta no BG Finance.',
      '',
      `<a href="${escapeHtml(link)}">Criar nova senha</a>`,
      '',
      'O link vale 30 minutos. Se não foi você, ignore esta mensagem.',
    ].join('\n')
  );
  return true;
}

function helpText() {
  const bot = botUsername ? `@${botUsername}` : 'o bot';
  return [
    '<b>BG Finance</b>',
    '',
    `No app, abra Ajustes e gere um código. Depois mande para ${escapeHtml(bot)}:`,
    '<code>/vincular CODIGO</code>',
    '',
    '<code>/saldo</code> mês atual',
    '<code>/dividas</code> o que falta pagar',
    '<code>/extrato</code> últimos lançamentos',
    '<code>/gasto 49,90 mercado</code>',
    '<code>/receita 1500 salario</code>',
    '<code>/desvincular</code>',
  ].join('\n');
}

function codeHash(code) {
  return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
}

function newCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(6), (byte) => alphabet[byte % alphabet.length]).join('');
}

async function linkedUser(chatId) {
  const result = await db.query(
    'SELECT id, name FROM users WHERE telegram_chat_id = $1',
    [chatId]
  );
  return result.rows[0] || null;
}

async function linkChat(chatId, code) {
  const result = await db.query(
    `UPDATE telegram_links
     SET used_at = NOW()
     WHERE code_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING user_id`,
    [codeHash(code)]
  );
  const userId = result.rows[0]?.user_id;
  if (!userId) return null;
  await db.query('UPDATE users SET telegram_chat_id = NULL WHERE telegram_chat_id = $1 AND id <> $2', [chatId, userId]);
  await db.query('UPDATE users SET telegram_chat_id = $1 WHERE id = $2', [chatId, userId]);
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
    `<b>${escapeHtml(month)}</b>`,
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
    return `• ${escapeHtml(debt.name)} — ${money(debt.amount)} (${due})`;
  });
  const total = result.rows.reduce((sum, debt) => sum + Number(debt.amount), 0);
  return [`<b>Em aberto: ${money(total)}</b>`, ...lines].join('\n');
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
    return `${row.day} ${sign}${money(row.amount)} ${escapeHtml(row.description)}`;
  }).join('\n');
}

async function addTransaction(userId, type, rest) {
  const match = rest.match(/^(\S+)\s+(.+)$/);
  if (!match) return 'Use o valor e a descrição. Exemplo: <code>/gasto 49,90 mercado</code>';
  const amount = parseAmount(match[1]);
  const description = match[2].trim().slice(0, 120);
  if (!description || !Number.isFinite(amount) || amount <= 0 || amount >= 1e10) {
    return 'Não entendi o valor. Exemplo: <code>/gasto 49,90 mercado</code>';
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
  return `${label} lançada: ${money(amount)} em ${escapeHtml(description)}.`;
}

async function handleMessage(message) {
  const chat = message.chat;
  if (!chat || chat.type !== 'private') return;
  const text = message.text;
  if (!text) return;
  if (tooFast(chat.id)) {
    await send(chat.id, 'Muitas mensagens seguidas. Espera um instante.');
    return;
  }

  const parsed = parseCommand(text);
  if (!parsed) {
    await send(chat.id, helpText());
    return;
  }

  if (parsed.command === 'start' || parsed.command === 'ajuda' || parsed.command === 'help') {
    await send(chat.id, helpText());
    return;
  }

  if (parsed.command === 'vincular' || parsed.command === 'conectar') {
    const code = parsed.rest.split(/\s+/)[0] || '';
    if (!/^[A-Za-z0-9]{6}$/.test(code)) {
      await send(chat.id, 'O código tem 6 caracteres. Gere outro em Ajustes e mande <code>/vincular CODIGO</code>.');
      return;
    }
    const user = await linkChat(chat.id, code);
    await send(chat.id, user ? `Conta ligada${user.name ? `, ${escapeHtml(user.name)}` : ''}. Manda <code>/saldo</code> para ver o mês.` : 'Código inválido ou vencido. Gere outro em Ajustes.');
    return;
  }

  const user = await linkedUser(chat.id);
  if (!user) {
    await send(chat.id, 'Essa conversa ainda não está ligada a uma conta.\n\nNo app, abra Ajustes, gere um código e mande <code>/vincular CODIGO</code>.');
    return;
  }

  if (parsed.command === 'desvincular' || parsed.command === 'sair') {
    await db.query('UPDATE users SET telegram_chat_id = NULL WHERE id = $1', [user.id]);
    await send(chat.id, 'Conta desvinculada deste chat.');
    return;
  }
  if (parsed.command === 'saldo' || parsed.command === 'resumo') {
    await send(chat.id, await monthSummary(user.id));
    return;
  }
  if (parsed.command === 'dividas' || parsed.command === 'divida') {
    await send(chat.id, await debtList(user.id));
    return;
  }
  if (parsed.command === 'extrato') {
    await send(chat.id, await recentLines(user.id));
    return;
  }
  if (parsed.command === 'gasto' || parsed.command === 'despesa') {
    await send(chat.id, await addTransaction(user.id, 'expense', parsed.rest));
    return;
  }
  if (parsed.command === 'receita' || parsed.command === 'entrada') {
    await send(chat.id, await addTransaction(user.id, 'income', parsed.rest));
    return;
  }

  await send(chat.id, helpText());
}

async function onUpdate(update) {
  if (!update || update.update_id == null || seenUpdates.has(update.update_id)) return;
  rememberUpdate(update.update_id);
  try {
    if (update.message) await handleMessage(update.message);
  } catch (err) {
    seenUpdates.delete(update.update_id);
    throw err;
  }
}

function setup(app, authenticateToken) {
  app.get('/telegram', authenticateToken, (req, res) => {
    db.query('SELECT telegram_chat_id FROM users WHERE id = $1', [req.user.id])
      .then((result) => res.json({
        configured: configured(),
        username: username(),
        linked: Boolean(result.rows[0]?.telegram_chat_id),
      }))
      .catch((err) => {
        console.error('Erro ao ler Telegram:', err);
        res.status(500).json({ error: 'Erro ao ler Telegram' });
      });
  });

  app.post('/telegram/link', authenticateToken, async (req, res) => {
    if (!configured()) return res.status(503).json({ error: 'Bot do Telegram ainda nao configurado' });
    try {
      const recent = await db.query(
        `SELECT COUNT(*)::int AS total
         FROM telegram_links
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [req.user.id]
      );
      if (recent.rows[0].total >= 8) return res.status(429).json({ error: 'Muitos códigos agora. Tenta de novo em uma hora' });

      await db.query(
        'UPDATE telegram_links SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [req.user.id]
      );
      const code = newCode();
      await db.query(
        `INSERT INTO telegram_links (user_id, code_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
        [req.user.id, codeHash(code)]
      );
      return res.json({ code, username: username(), expires_in: 900 });
    } catch (err) {
      console.error('Erro ao gerar codigo do Telegram:', err);
      return res.status(500).json({ error: 'Erro ao gerar codigo' });
    }
  });

  app.delete('/telegram', authenticateToken, async (req, res) => {
    try {
      await db.query('UPDATE users SET telegram_chat_id = NULL WHERE id = $1', [req.user.id]);
      return res.json({ linked: false });
    } catch (err) {
      console.error('Erro ao desvincular Telegram:', err);
      return res.status(500).json({ error: 'Erro ao desvincular' });
    }
  });

  app.post('/telegram/webhook', async (req, res) => {
    if (!TOKEN || !secretOk(req.get('x-telegram-bot-api-secret-token'))) {
      return res.status(404).json({ error: 'Nao encontrado' });
    }
    res.json({ ok: true });
    try {
      await onUpdate(req.body);
    } catch (err) {
      console.error('Erro no webhook do Telegram:', err);
    }
  });
}

async function start() {
  if (!TOKEN) {
    console.log('Telegram desligado (sem TELEGRAM_BOT_TOKEN)');
    return;
  }
  try {
    const me = await api('getMe');
    botUsername = me.username || '';
    ready = true;
    if (APP_URL.startsWith('https://')) {
      await api('setWebhook', {
        url: `${APP_URL}/telegram/webhook`,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ['message'],
      });
      console.log(`Telegram @${botUsername} ouvindo ${APP_URL}/telegram/webhook`);
    } else {
      console.log(`Telegram @${botUsername} sem webhook: APP_URL precisa ser https`);
    }
  } catch (err) {
    ready = false;
    console.error('Telegram nao iniciou:', err.message);
  }
}

module.exports = { setup, start, configured, username, sendResetLink };
