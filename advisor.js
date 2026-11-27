const db = require('./database');

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function plainMoney(value) {
  return money(value);
}

function spParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')) };
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function shiftMonth(year, month, delta) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function monthLabel(year, month) {
  const label = new Date(Date.UTC(year, month - 1, 15)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDay(raw) {
  const day = String(raw || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'sem data';
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s/]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectIntent(text) {
  const raw = String(text || '').trim();
  const cmd = raw.match(/^\/?([A-Za-zÀ-ÿ_]+)(?:@\w+)?(?:\s|$)/);
  if (cmd) {
    const name = normalize(cmd[1]).replace(/_/g, '');
    if (['proximo', 'proximomes', 'pagar'].includes(name)) return 'next_month';
    if (['vence', 'vencimentos', 'mes', 'este'].includes(name)) return 'this_month';
    if (['fatura', 'faturas', 'cartao', 'cartoes'].includes(name)) return 'invoices';
    if (['assinatura', 'assinaturas', 'plano', 'planos'].includes(name)) return 'subs';
    if (['saldo', 'resumo'].includes(name)) return 'summary';
    if (['divida', 'dividas', 'aberto'].includes(name)) return 'open_debts';
    if (['ajuda', 'help', 'start', 'consultor'].includes(name)) return 'help';
  }

  const q = normalize(raw);
  if (!q) return 'help';
  if (/(proximo mes|mes que vem|quanto (eu )?pago|quanto (eu )?tenho que pagar|o que (eu )?pago)/.test(q)) return 'next_month';
  if (/(este mes|esse mes|o que vence|vencimento|atrasad|vence (hoje|amanha|essa|esta))/.test(q)) return 'this_month';
  if (/(fatura|cartao|limite)/.test(q)) return 'invoices';
  if (/(assinatura|netflix|spotify|plano mensal)/.test(q)) return 'subs';
  if (/(saldo|resumo|receita|despesa)/.test(q)) return 'summary';
  if (/(divida|em aberto|falta pagar)/.test(q)) return 'open_debts';
  if (/(ajuda|o que (voce|vc) (faz|sabe)|consultor)/.test(q)) return 'help';
  return 'help';
}

function answer(lines, { html = true } = {}) {
  const textPlain = lines.join('\n');
  if (!html) return { textHtml: textPlain, textPlain };
  const textHtml = lines
    .map((line) => {
      if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
        return `<b>${escapeHtml(line.slice(2, -2))}</b>`;
      }
      return escapeHtml(line);
    })
    .join('\n');
  return { textHtml, textPlain };
}

function helpAnswer() {
  return answer([
    '**Consultor BG Finance**',
    '',
    'Pergunte em português, por exemplo:',
    '• Quanto eu pago no próximo mês?',
    '• O que vence este mês?',
    '• Quando a fatura vence?',
    '• Quais assinaturas tenho?',
    '',
    'No Telegram também valem:',
    '/proximo  /vence  /faturas  /saldo  /dividas',
  ]);
}

async function monthSummary(userId) {
  const result = await db.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float8 AS income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float8 AS expense
     FROM transactions
     WHERE user_id = $1
       AND TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') =
           TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')`,
    [userId]
  );
  const income = Number(result.rows[0].income);
  const expense = Number(result.rows[0].expense);
  const now = spParts();
  return answer([
    `**${monthLabel(now.year, now.month)}**`,
    `Receitas: ${plainMoney(income)}`,
    `Despesas: ${plainMoney(expense)}`,
    `Saldo: ${plainMoney(income - expense)}`,
  ]);
}

async function openDebts(userId) {
  const result = await db.query(
    `SELECT name, amount::float8 AS amount, due_date::text AS due_date, kind
     FROM debts
     WHERE user_id = $1 AND paid_at IS NULL
     ORDER BY due_date NULLS LAST, id
     LIMIT 20`,
    [userId]
  );
  if (!result.rows.length) return answer(['Nenhuma dívida em aberto.']);
  const total = result.rows.reduce((sum, row) => sum + Number(row.amount), 0);
  const lines = [
    `**Em aberto: ${plainMoney(total)}**`,
    ...result.rows.map((row) => `• ${row.name} — ${plainMoney(row.amount)} (${formatDay(row.due_date)})`),
  ];
  return answer(lines);
}

async function loadDueItems(userId) {
  const [debts, subs, loans] = await Promise.all([
    db.query(
      `SELECT name, amount::float8 AS amount, due_date::text AS due_date, kind, 'debt' AS source
       FROM debts
       WHERE user_id = $1 AND paid_at IS NULL AND due_date IS NOT NULL`,
      [userId]
    ),
    db.query(
      `SELECT name, amount::float8 AS amount, due_date::text AS due_date, 'subscription' AS source
       FROM subscriptions
       WHERE user_id = $1 AND active = TRUE AND due_date IS NOT NULL`,
      [userId]
    ),
    db.query(
      `SELECT person AS name, amount::float8 AS amount, due_date::text AS due_date, direction, 'loan' AS source
       FROM person_loans l
       WHERE user_id = $1
         AND due_date IS NOT NULL
         AND COALESCE((SELECT SUM(amount) FROM person_loan_payments p WHERE p.loan_id = l.id), 0) < l.amount`,
      [userId]
    ),
  ]);

  const items = [];
  for (const row of debts.rows) {
    items.push({
      name: row.name,
      amount: Number(row.amount),
      due: String(row.due_date).slice(0, 10),
      kind: row.kind,
      source: 'debt',
      label: row.kind === 'credit_card' || /fatura/i.test(row.name) ? 'Fatura' : 'Dívida',
    });
  }
  for (const row of subs.rows) {
    items.push({
      name: row.name,
      amount: Number(row.amount),
      due: String(row.due_date).slice(0, 10),
      source: 'subscription',
      label: 'Assinatura',
    });
  }
  for (const row of loans.rows) {
    // só o que a pessoa precisa pagar (eu devo); "me devem" não entra no total a pagar
    if (row.direction !== 'owe') continue;
    items.push({
      name: `Empréstimo (${row.name})`,
      amount: Number(row.amount),
      due: String(row.due_date).slice(0, 10),
      source: 'loan',
      label: 'Eu devo',
    });
  }
  return items;
}

function inMonth(item, year, month) {
  return item.due.slice(0, 7) === monthKey(year, month);
}

function isLate(item, today) {
  return item.due < today;
}

function listMonth(items, year, month, { markLate = false, today = '' } = {}) {
  const selected = items
    .filter((item) => inMonth(item, year, month))
    .sort((a, b) => a.due.localeCompare(b.due) || a.name.localeCompare(b.name));
  const total = selected.reduce((sum, item) => sum + item.amount, 0);
  if (!selected.length) {
    return answer([`Nada com vencimento em ${monthLabel(year, month)}.`]);
  }
  const lines = [
    `**${monthLabel(year, month)}: ${plainMoney(total)}**`,
    ...selected.map((item) => {
      const late = markLate && isLate(item, today) ? ' · atrasada' : '';
      return `• ${item.name} — ${plainMoney(item.amount)} (${formatDay(item.due)}${late}) · ${item.label}`;
    }),
  ];
  return answer(lines);
}

async function thisMonth(userId) {
  const now = spParts();
  const today = `${monthKey(now.year, now.month)}-${String(now.day).padStart(2, '0')}`;
  const items = await loadDueItems(userId);
  return listMonth(items, now.year, now.month, { markLate: true, today });
}

async function nextMonth(userId) {
  const now = spParts();
  const next = shiftMonth(now.year, now.month, 1);
  const items = await loadDueItems(userId);
  return listMonth(items, next.year, next.month);
}

async function invoices(userId) {
  const result = await db.query(
    `SELECT name, amount::float8 AS amount, due_date::text AS due_date
     FROM debts
     WHERE user_id = $1
       AND paid_at IS NULL
       AND (kind = 'credit_card' OR LOWER(name) LIKE '%fatura%')
     ORDER BY due_date NULLS LAST, id
     LIMIT 20`,
    [userId]
  );
  if (!result.rows.length) return answer(['Nenhuma fatura de cartão em aberto.']);
  const total = result.rows.reduce((sum, row) => sum + Number(row.amount), 0);
  const now = spParts();
  const today = `${monthKey(now.year, now.month)}-${String(now.day).padStart(2, '0')}`;
  const lines = [
    `**Faturas em aberto: ${plainMoney(total)}**`,
    ...result.rows.map((row) => {
      const due = String(row.due_date || '').slice(0, 10);
      const late = due && due < today ? ' · atrasada' : '';
      return `• ${row.name} — ${plainMoney(row.amount)} (vence ${formatDay(due)}${late})`;
    }),
  ];
  return answer(lines);
}

async function subscriptions(userId) {
  const result = await db.query(
    `SELECT name, amount::float8 AS amount, due_date::text AS due_date, cycle
     FROM subscriptions
     WHERE user_id = $1 AND active = TRUE
     ORDER BY due_date NULLS LAST, id
     LIMIT 20`,
    [userId]
  );
  if (!result.rows.length) return answer(['Nenhuma assinatura ativa.']);
  const monthly = result.rows.reduce((sum, row) => {
    const amount = Number(row.amount);
    return sum + (row.cycle === 'yearly' ? amount / 12 : amount);
  }, 0);
  const lines = [
    `**Assinaturas ativas · ~${plainMoney(monthly)}/mês**`,
    ...result.rows.map((row) => {
      const cycle = row.cycle === 'yearly' ? 'anual' : 'mensal';
      return `• ${row.name} — ${plainMoney(row.amount)} (${cycle}, próxima ${formatDay(row.due_date)})`;
    }),
  ];
  return answer(lines);
}

async function ask(userId, text) {
  const intent = detectIntent(text);
  switch (intent) {
    case 'next_month':
      return nextMonth(userId);
    case 'this_month':
      return thisMonth(userId);
    case 'invoices':
      return invoices(userId);
    case 'subs':
      return subscriptions(userId);
    case 'summary':
      return monthSummary(userId);
    case 'open_debts':
      return openDebts(userId);
    default:
      return helpAnswer();
  }
}

module.exports = {
  ask,
  detectIntent,
  helpAnswer,
  money,
  escapeHtml,
};
