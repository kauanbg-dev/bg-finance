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
    if (['dica', 'dicas', 'economia', 'economizar', 'poupar', 'guardar', 'orcamento'].includes(name)) return 'tips';
    if (['ajuda', 'help', 'start', 'consultor'].includes(name)) return 'help';
  }

  const q = normalize(raw);
  if (!q) return 'help';
  // dicas / perguntas de economia antes dos atalhos de mês (ex.: "guardar 500 este mês")
  if (/(economiz|poupar|guardar|cofrinho|orcamento|dica|como (eu )?fa[cç]o|reduzir gasto|gast(o|ar) menos|sobrar|investir|consigo |vale (a )?pena|cancelar)/.test(q)) return 'tips';
  if (/(proximo mes|mes que vem|quanto (eu )?pago|quanto (eu )?tenho que pagar|o que (eu )?pago)/.test(q)) return 'next_month';
  if (/(o que vence|vencimento|atrasad|vence (hoje|amanha|essa|esta)|o que (eu )?pago este mes|venc(e|em) (este|esse) mes)/.test(q)) return 'this_month';
  if (/(este mes|esse mes)/.test(q) && /(vence|pagar|conta|divida|fatura)/.test(q)) return 'this_month';
  if (/(fatura|cartao|limite)/.test(q)) return 'invoices';
  if (/(assinatura|netflix|spotify|plano mensal)/.test(q)) return 'subs';
  if (/(saldo|resumo|receita|despesa)/.test(q)) return 'summary';
  if (/(divida|em aberto|falta pagar)/.test(q)) return 'open_debts';
  if (/(ajuda|o que (voce|vc) (faz|sabe)|consultor)/.test(q)) return 'help';
  // pergunta aberta / específica → IA (com fallback de dicas)
  if (q.length >= 4) return 'ai';
  return 'help';
}

function aiConfigured() {
  return Boolean(String(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY || '').trim());
}

function aiConfig() {
  const gateway = String(process.env.AI_GATEWAY_API_KEY || '').trim();
  if (gateway) {
    return {
      url: 'https://ai-gateway.vercel.sh/v1/chat/completions',
      key: gateway,
      model: String(process.env.ADVISOR_AI_MODEL || 'openai/gpt-4o-mini').trim(),
    };
  }
  return {
    url: 'https://api.openai.com/v1/chat/completions',
    key: String(process.env.OPENAI_API_KEY || '').trim(),
    model: String(process.env.ADVISOR_AI_MODEL || 'gpt-4o-mini').trim(),
  };
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
    '• Quero economizar / me dá uma dica',
    '• Consigo guardar 500 reais por mês?',
    '',
    'No Telegram também valem:',
    '/proximo  /vence  /faturas  /saldo  /dividas  /dicas',
  ]);
}

async function buildContext(userId) {
  const now = spParts();
  const today = `${monthKey(now.year, now.month)}-${String(now.day).padStart(2, '0')}`;
  const next = shiftMonth(now.year, now.month, 1);
  const [summary, cats, subs, debts, recent, items] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float8 AS income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float8 AS expense
       FROM transactions
       WHERE user_id = $1
         AND TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') =
             TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')`,
      [userId]
    ),
    db.query(
      `SELECT COALESCE(c.name, 'Outros') AS name, SUM(t.amount)::float8 AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
         AND t.type = 'expense'
         AND TO_CHAR(t.date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') =
             TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')
       GROUP BY COALESCE(c.name, 'Outros')
       ORDER BY total DESC
       LIMIT 6`,
      [userId]
    ),
    db.query(
      `SELECT name, amount::float8 AS amount, cycle, due_date::text AS due_date
       FROM subscriptions
       WHERE user_id = $1 AND active = TRUE
       ORDER BY amount DESC
       LIMIT 12`,
      [userId]
    ),
    db.query(
      `SELECT name, amount::float8 AS amount, due_date::text AS due_date, kind
       FROM debts
       WHERE user_id = $1 AND paid_at IS NULL
       ORDER BY due_date NULLS LAST, amount DESC
       LIMIT 12`,
      [userId]
    ),
    db.query(
      `SELECT description, amount::float8 AS amount, type,
              TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') AS day,
              COALESCE(c.name, 'Outros') AS category
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ORDER BY t.date DESC, t.position DESC, t.id DESC
       LIMIT 12`,
      [userId]
    ),
    loadDueItems(userId),
  ]);

  const income = Number(summary.rows[0].income);
  const expense = Number(summary.rows[0].expense);
  const thisDue = items.filter((item) => inMonth(item, now.year, now.month));
  const nextDue = items.filter((item) => inMonth(item, next.year, next.month));
  const late = items.filter((item) => isLate(item, today));

  return {
    timezone: 'America/Sao_Paulo',
    month: monthLabel(now.year, now.month),
    today,
    month_summary: {
      income,
      expense,
      balance: income - expense,
      savings_rate_pct: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
    },
    top_expense_categories: cats.rows.map((row) => ({ name: row.name, total: Number(row.total) })),
    subscriptions: subs.rows.map((row) => ({
      name: row.name,
      amount: Number(row.amount),
      cycle: row.cycle,
      next_due: String(row.due_date || '').slice(0, 10),
    })),
    open_debts: debts.rows.map((row) => ({
      name: row.name,
      amount: Number(row.amount),
      due: String(row.due_date || '').slice(0, 10),
      kind: row.kind,
    })),
    due_this_month: thisDue.map((item) => ({
      name: item.name,
      amount: item.amount,
      due: item.due,
      label: item.label,
    })),
    due_next_month: nextDue.map((item) => ({
      name: item.name,
      amount: item.amount,
      due: item.due,
      label: item.label,
    })),
    late_items: late.map((item) => ({
      name: item.name,
      amount: item.amount,
      due: item.due,
      label: item.label,
    })),
    recent_transactions: recent.rows.map((row) => ({
      day: row.day,
      description: row.description,
      amount: Number(row.amount),
      type: row.type,
      category: row.category,
    })),
  };
}

function formatAiAnswer(text) {
  const lines = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\*\*(.*?)\*\*/g, '**$1**').trimEnd())
    .filter((line, index, arr) => line.length > 0 || (index > 0 && arr[index - 1].length > 0));
  const cleaned = [];
  for (const line of lines) {
    if (line === '' && cleaned[cleaned.length - 1] === '') continue;
    cleaned.push(line.replace(/^[-*]\s+/, '• ').replace(/^#{1,3}\s+/, '').trim());
  }
  if (!cleaned.length) return answer(['Não consegui montar a resposta agora.']);
  return answer(cleaned.slice(0, 40));
}

async function askWithAi(userId, text) {
  const cfg = aiConfig();
  if (!cfg.key) throw new Error('IA nao configurada');
  const context = await buildContext(userId);
  const system = [
    'Você é o Consultor do BG Finance, um assistente financeiro pessoal em português do Brasil.',
    'Responda de forma clara, objetiva e útil, no tom de uma conversa de WhatsApp.',
    'Use APENAS os dados do contexto JSON. Não invente saldos, dívidas ou lançamentos.',
    'Se faltar dado, diga o que falta e como a pessoa pode lançar no app.',
    'Pode dar dicas específicas de economia, priorização de dívidas, assinaturas e orçamento.',
    'Não peça senha, código de cartão ou dados sensíveis.',
    'Não fale de outros bancos/apps além do BG Finance, salvo como comparação genérica.',
    'Formato: frases curtas; use tópicos com "• " quando listar; no máximo ~1800 caracteres.',
    'Valores em R$ no padrão brasileiro.',
  ].join(' ');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `Contexto financeiro da conta:\n${JSON.stringify(context)}\n\nPergunta do usuário:\n${String(text || '').trim()}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data?.error?.message || `IA HTTP ${response.status}`;
      throw new Error(msg);
    }
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('IA sem resposta');
    return formatAiAnswer(content);
  } finally {
    clearTimeout(timer);
  }
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

async function tips(userId) {
  const now = spParts();
  const today = `${monthKey(now.year, now.month)}-${String(now.day).padStart(2, '0')}`;
  const [summary, cats, subs, debts, items] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float8 AS income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float8 AS expense
       FROM transactions
       WHERE user_id = $1
         AND TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') =
             TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')`,
      [userId]
    ),
    db.query(
      `SELECT COALESCE(c.name, 'Outros') AS name, SUM(t.amount)::float8 AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
         AND t.type = 'expense'
         AND TO_CHAR(t.date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') =
             TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')
       GROUP BY COALESCE(c.name, 'Outros')
       ORDER BY total DESC
       LIMIT 3`,
      [userId]
    ),
    db.query(
      `SELECT name, amount::float8 AS amount, cycle
       FROM subscriptions
       WHERE user_id = $1 AND active = TRUE
       ORDER BY amount DESC
       LIMIT 8`,
      [userId]
    ),
    db.query(
      `SELECT name, amount::float8 AS amount, due_date::text AS due_date
       FROM debts
       WHERE user_id = $1 AND paid_at IS NULL
       ORDER BY due_date NULLS LAST, amount DESC
       LIMIT 8`,
      [userId]
    ),
    loadDueItems(userId),
  ]);

  const income = Number(summary.rows[0].income);
  const expense = Number(summary.rows[0].expense);
  const balance = income - expense;
  const rate = income > 0 ? Math.round((balance / income) * 100) : null;
  const tipsList = [];

  if (income <= 0 && expense <= 0) {
    tipsList.push('Lance receitas e despesas neste mês para eu montar dicas com os seus números.');
  } else {
    if (rate != null && rate < 10) {
      tipsList.push(`Sua sobra este mês está em ${rate}%. Meta saudável: guardar pelo menos 10–20% da receita.`);
    } else if (rate != null && rate >= 20) {
      tipsList.push(`Boa: cerca de ${rate}% da receita sobrou. Dá para mandar parte disso para um cofrinho ou investimento.`);
    } else if (balance < 0) {
      tipsList.push(`As despesas passaram as receitas em ${plainMoney(Math.abs(balance))}. Priorize cortar o que não é essencial esta semana.`);
    } else if (rate != null) {
      tipsList.push(`Você está com ~${rate}% de sobra. Dá para subir isso revisando as maiores categorias abaixo.`);
    }
  }

  if (cats.rows.length) {
    const top = cats.rows[0];
    tipsList.push(
      `Maior gasto do mês: ${top.name} (${plainMoney(top.total)}). Tente um teto 10–15% menor na próxima quinzena.`
    );
    if (cats.rows[1]) {
      tipsList.push(`Em seguida vem ${cats.rows[1].name} (${plainMoney(cats.rows[1].total)}).`);
    }
  }

  const monthlySubs = subs.rows.reduce((sum, row) => {
    const amount = Number(row.amount);
    return sum + (row.cycle === 'yearly' ? amount / 12 : amount);
  }, 0);
  if (subs.rows.length) {
    const pricey = subs.rows[0];
    tipsList.push(
      `Assinaturas ativas ~${plainMoney(monthlySubs)}/mês. A mais cara é ${pricey.name} (${plainMoney(pricey.amount)}): vale pausar ou trocar de plano?`
    );
  }

  const late = items.filter((item) => isLate(item, today));
  if (late.length) {
    const lateTotal = late.reduce((sum, item) => sum + item.amount, 0);
    tipsList.push(
      `Há ${late.length} item(ns) atrasado(s) (~${plainMoney(lateTotal)}). Quitar isso antes de novos gastos evita juros e estresse.`
    );
  } else if (debts.rows.length) {
    const debtTotal = debts.rows.reduce((sum, row) => sum + Number(row.amount), 0);
    tipsList.push(
      `Dívidas em aberto: ${plainMoney(debtTotal)}. Negocie a de maior juros primeiro e evite rolar fatura.`
    );
  }

  const next = shiftMonth(now.year, now.month, 1);
  const nextItems = items.filter((item) => inMonth(item, next.year, next.month));
  if (nextItems.length) {
    const nextTotal = nextItems.reduce((sum, item) => sum + item.amount, 0);
    tipsList.push(
      `No mês que vem já dá para prever ${plainMoney(nextTotal)} em vencimentos. Separe esse valor agora.`
    );
  }

  if (!tipsList.length) {
    tipsList.push('Ainda tenho pouco histórico. Lance mais movimentos e pergunte de novo.');
  }

  tipsList.push('Regra prática: pague o essencial, corte 1 assinatura ociosa e guarde um valor fixo todo mês — mesmo pequeno.');

  return answer([
    '**Dicas para economizar**',
    `Resumo de ${monthLabel(now.year, now.month)}: receitas ${plainMoney(income)} · despesas ${plainMoney(expense)} · saldo ${plainMoney(balance)}`,
    '',
    ...tipsList.map((tip) => `• ${tip}`),
  ]);
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
    case 'tips':
    case 'ai':
      if (aiConfigured()) {
        try {
          return await askWithAi(userId, text);
        } catch (err) {
          console.error('Consultor IA falhou:', err.message);
          if (intent === 'tips') return tips(userId);
          return answer([
            'Não consegui consultar a IA agora.',
            'Você ainda pode perguntar saldo, próximo mês, faturas, assinaturas ou /dicas.',
          ]);
        }
      }
      if (intent === 'tips') return tips(userId);
      return tips(userId);
    default:
      return helpAnswer();
  }
}

module.exports = {
  ask,
  detectIntent,
  helpAnswer,
  aiConfigured,
  money,
  escapeHtml,
};
