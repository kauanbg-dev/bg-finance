const token = localStorage.getItem("token");
const previewMode = new URLSearchParams(location.search).get("preview") === "1";
if (!token && !previewMode) window.location.href = "login.html";

const CATEGORY_KEY = "bg-finance-categories";
const INCOME_CATS = ["Salário", "Freelance", "Investimentos", "Benefícios", "Reembolso", "Outros"];
const EXPENSE_CATS = [
  "Alimentação",
  "Moradia",
  "Contas",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Assinaturas",
  "Compras",
  "Pets",
  "Cuidados",
  "Impostos",
  "Trabalho",
  "Dinheiro guardado",
  "Outros",
];
const CAT_COLORS = {
  salario: "#34d399",
  freelance: "#2dd4bf",
  investimentos: "#60a5fa",
  beneficios: "#a3e635",
  reembolso: "#22d3ee",
  extra: "#fbbf24",
  alimentacao: "#fb923c",
  moradia: "#818cf8",
  contas: "#facc15",
  transporte: "#38bdf8",
  saude: "#f87171",
  educacao: "#a78bfa",
  lazer: "#e879f9",
  assinaturas: "#c084fc",
  compras: "#fb7185",
  pets: "#f59e0b",
  cuidados: "#f9a8d4",
  impostos: "#78716c",
  trabalho: "#64748b",
  "dinheiro guardado": "#4ade80",
  outros: "#94a3b8",
  "renda fixa": "#3b82f6",
  acoes: "#34d399",
  fundos: "#a78bfa",
  tesouro: "#fbbf24",
  cripto: "#fb923c",
  previdencia: "#818cf8",
  viagem: "#38bdf8",
  casa: "#6366f1",
  carro: "#fb7185",
  estudos: "#c084fc",
  presentes: "#f472b6",
  emergencia: "#f87171",
};
const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_LONG = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const PALETTE = ["#60a5fa", "#a78bfa", "#34d399", "#f87171", "#fbbf24", "#22d3ee", "#fb7185", "#c084fc", "#4ade80", "#94a3b8"];
const ICON = {
  edit: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 0 1 3 3l-9 9a2 2 0 0 1-.85.5l-2.9.85a.5.5 0 0 1-.6-.6l.85-2.9a2 2 0 0 1 .5-.85z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 13l2.5-7h11L20 13v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2"/><path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.2"/><path d="M6.1 6.1C3.6 7.8 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.1-.8"/></svg>',
};
const KEYWORDS = [
  [/sal[aá]rio|pagamento|holerite/i, "Salário", "income"],
  [/freelance|freela|cliente/i, "Freelance", "income"],
  [/dividend|rendimento|juros/i, "Investimentos", "income"],
  [/mercado|ifood|padaria|restaurante|lanche|almo[cç]o|jantar|feira/i, "Alimentação", "expense"],
  [/aluguel|condom[ií]nio|financiamento/i, "Moradia", "expense"],
  [/luz|energia|água|agua|internet|telefone|celular|conta de/i, "Contas", "expense"],
  [/uber|\b99\b|gasolina|combust[ií]vel|passagem|estacionamento|metr[oô]|ônibus|onibus/i, "Transporte", "expense"],
  [/farm[aá]cia|m[eé]dic|plano de sa[uú]de|consulta|academia/i, "Saúde", "expense"],
  [/netflix|spotify|prime|youtube|assinatura|disney|hbo/i, "Assinaturas", "expense"],
  [/cinema|\bbar\b|viagem|show|lazer/i, "Lazer", "expense"],
  [/curso|faculdade|livro|escola/i, "Educação", "expense"],
  [/roupa|shopping|shopee|magazine|compra/i, "Compras", "expense"],
  [/pet|ração|racao|veterin/i, "Pets", "expense"],
  [/salão|salao|barbe|cabelo|estética|estetica/i, "Cuidados", "expense"],
  [/imposto|ipva|iptu|multa|darf/i, "Impostos", "expense"],
  [/cofrinho|poupan[cç]a|dinheiro guardado/i, "Dinheiro guardado", "expense"],
  [/reembolso/i, "Reembolso", "income"],
  [/benef[ií]cio|vale|13º|13o|f[eé]rias|plr/i, "Benefícios", "income"],
];

function money(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shiftMonth(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function monthShort(ym) {
  const [y, m] = ym.split("-");
  return `${MONTHS_PT[Number(m) - 1]}/${y.slice(2)}`;
}

function parseAmount(raw) {
  let s = String(raw || "").replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : NaN;
}

function catKey(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function catColor(name) {
  const known = CAT_COLORS[catKey(name)];
  if (known) return known;
  let h = 0;
  for (const ch of catKey(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function parseToken() {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const payload = parseToken();

const form = document.getElementById("transaction-form");
const tbody = document.getElementById("transaction-list");
const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const totalDisplay = document.getElementById("total");
const savingsDisplay = document.getElementById("savings-rate");
const incomeHint = document.getElementById("income-hint");
const expenseHint = document.getElementById("expense-hint");
const totalHint = document.getElementById("total-hint");
const rateBarFill = document.getElementById("rate-bar-fill");
const logoutBtn = document.getElementById("logout-btn");
const btnIncome = document.getElementById("btn-income");
const btnExpense = document.getElementById("btn-expense");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const submitBtn = document.getElementById("submit-btn");
const newCategoryBtn = document.getElementById("new-category");
const monthFilter = document.getElementById("month-filter");
const monthPrev = document.getElementById("month-prev");
const monthNext = document.getElementById("month-next");
const typeFilter = document.getElementById("type-filter");
const categoryFilter = document.getElementById("category-filter");
const searchFilter = document.getElementById("search-filter");
const clearFilterBtn = document.getElementById("clear-filter");
const exportBtn = document.getElementById("export-csv");
const chartMode = document.getElementById("chart-mode");
const categorySelect = document.getElementById("category");
const dateInput = document.getElementById("tx-date");
const txCount = document.getElementById("tx-count");
const pivotWrap = document.getElementById("pivot-wrap");
const mobileSort = document.getElementById("mobile-sort");
const showMoreBtn = document.getElementById("show-more");
const PAGE_SIZE = 10;
let visibleCount = PAGE_SIZE;

showMoreBtn?.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  renderDashboard();
});
const toastsEl = document.getElementById("toasts");

let allTransactions = [];
let apiCategories = [];
let sortKey = "date";
let sortDir = "desc";
const CHART_OPTIONS = [
  { id: "flow", title: "Fluxo mensal", hint: "Receitas, despesas e saldo acumulado" },
  { id: "category", title: "Por categoria", hint: "Quanto cada grupo pesa no período" },
  { id: "mix", title: "Composição", hint: "Receitas contra despesas, ou fatia por categoria" },
  { id: "daily", title: "Evolução diária", hint: "Entradas, saídas e saldo do dia" },
];
const SETTINGS_KEY = "bg-finance-settings";
const DEBT_KINDS = {
  credit_card: "Cartão",
  loan: "Empréstimo",
  other: "Outro",
};

function readStoredCharts() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return raw.charts && typeof raw.charts === "object" ? raw.charts : {};
  } catch {
    return {};
  }
}

let chartPrefs = readStoredCharts();
let charts = {};
let chartsNeedDraw = true;
let loading = true;
let categoryTouched = false;

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

/* ---------- feedback ---------- */

function toast(message, kind = "success", action) {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  const text = document.createElement("span");
  text.textContent = message;
  el.appendChild(text);
  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  };
  if (action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-action";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      dismiss();
      action.run();
    });
    el.appendChild(btn);
  }
  toastsEl.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  timer = setTimeout(dismiss, action ? 6000 : 3200);
}

const dialog = document.getElementById("dialog");
const dialogTitle = document.getElementById("dialog-title");
const dialogText = document.getElementById("dialog-text");
const dialogForm = document.getElementById("dialog-form");
const dialogField = document.getElementById("dialog-field");
const dialogInput = document.getElementById("dialog-input");
const dialogOk = document.getElementById("dialog-ok");
const dialogCancel = document.getElementById("dialog-cancel");
let closeActiveDialog = null;

function askDialog({ title, text = "", placeholder = "", okLabel = "Confirmar", cancelLabel = "Cancelar", input = false, inputType = "text", danger = false }) {
  return new Promise((resolve) => {
    dialogTitle.textContent = title;
    dialogText.textContent = text;
    dialogField.classList.toggle("hidden", !input);
    dialogInput.type = input ? inputType : "text";
    dialogInput.autocomplete = inputType === "password" ? "current-password" : "off";
    dialogInput.value = "";
    dialogInput.placeholder = placeholder;
    dialogOk.textContent = okLabel;
    dialogCancel.textContent = cancelLabel;
    dialogOk.classList.toggle("danger", danger);
    dialog.classList.add("dialog-arming");
    dialog.classList.remove("hidden");
    let armed = false;
    const arm = () => {
      if (armed || dialog.classList.contains("hidden")) return;
      armed = true;
      dialog.classList.remove("dialog-arming");
      (input ? dialogInput : dialogTitle).focus();
    };
    const armTimer = setTimeout(arm, 380);

    const backdrop = dialog.querySelector(".modal-backdrop");
    const finish = (value) => {
      clearTimeout(armTimer);
      dialog.classList.add("hidden");
      dialog.classList.remove("dialog-arming");
      dialogInput.type = "text";
      dialogOk.classList.remove("danger");
      dialogCancel.textContent = "Cancelar";
      dialogForm.removeEventListener("submit", onSubmit);
      dialogCancel.removeEventListener("click", onCancel);
      backdrop.removeEventListener("click", onDismiss);
      closeActiveDialog = null;
      resolve(value);
    };
    const onSubmit = (e) => {
      e.preventDefault();
      if (!armed) return;
      finish(input ? dialogInput.value.trim() : true);
    };
    const onCancel = () => {
      if (!armed) return;
      finish(false);
    };
    const onDismiss = () => {
      if (!armed) return;
      finish(null);
    };
    dialogForm.addEventListener("submit", onSubmit);
    dialogCancel.addEventListener("click", onCancel);
    backdrop.addEventListener("click", onDismiss);
    closeActiveDialog = onDismiss;
  });
}

/* ---------- api ---------- */

function authHeaders(extra = {}) {
  return { ...extra, Authorization: "Bearer " + token };
}

function handleAuth(response) {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return true;
  }
  return false;
}

let previewSeq = 100;
let previewProfile = {
  id: 1,
  name: "Conta demo",
  email: "demo@bgfinance.app",
  created_at: "2026-01-15T12:00:00.000Z",
  avatar: null,
};

let previewSettings = { charts: { flow: true, category: true, mix: true, daily: true } };
let previewTelegram = { linked: false };
let previewDebts = [];
let previewSubs = [];
let previewSavings = [];

function seedPreviewDebts() {
  if (previewDebts.length) return;
  const soon = shiftDay(today(), 3);
  const late = shiftDay(today(), -4);
  const next = `${shiftMonth(today().slice(0, 7), 1)}-12`;
  previewDebts = [
    { id: ++previewSeq, name: "Cartão de crédito", kind: "credit_card", amount: 842.3, due_date: soon, notes: "Fatura do mês", paid_at: null },
    { id: ++previewSeq, name: "Empréstimo pessoal", kind: "loan", amount: 3200, due_date: late, notes: "Parcela 4 de 12", paid_at: null },
    { id: ++previewSeq, name: "Fatura do cartão", kind: "credit_card", amount: 960, due_date: next, notes: "Fecha no mês que vem", paid_at: null },
    { id: ++previewSeq, name: "IPVA", kind: "other", amount: 480, due_date: `${shiftMonth(today().slice(0, 7), 3)}-15`, notes: "Parcela 1", paid_at: null },
    { id: ++previewSeq, name: "Material da escola", kind: "other", amount: 320, due_date: `${shiftMonth(today().slice(0, 7), 4)}-10`, notes: "", paid_at: null },
    { id: ++previewSeq, name: "Parcela antiga", kind: "loan", amount: 400, due_date: shiftDay(today(), -40), notes: "", paid_at: new Date().toISOString() },
  ];
}

function seedPreviewSubs() {
  if (previewSubs.length) return;
  const next = `${shiftMonth(today().slice(0, 7), 1)}-08`;
  previewSubs = [
    { id: ++previewSeq, name: "Netflix", cycle: "monthly", amount: 55.9, due_date: shiftDay(today(), 2), notes: "Plano padrão", active: true, pay_with: "card", paid_dates: [`${shiftMonth(today().slice(0, 7), -1)}-15`, `${shiftMonth(today().slice(0, 7), -2)}-15`] },
    { id: ++previewSeq, name: "Academia", cycle: "monthly", amount: 129.9, due_date: shiftDay(today(), -6), notes: "", active: true, paid_dates: [`${shiftMonth(today().slice(0, 7), -1)}-05`] },
    { id: ++previewSeq, name: "iCloud", cycle: "yearly", amount: 149.9, due_date: next, notes: "200 GB", active: true },
    { id: ++previewSeq, name: "Seguro do carro", cycle: "yearly", amount: 890, due_date: `${shiftMonth(today().slice(0, 7), 3)}-20`, notes: "", active: true },
    { id: ++previewSeq, name: "Domínio", cycle: "yearly", amount: 60, due_date: `${shiftMonth(today().slice(0, 7), 4)}-05`, notes: "", active: true },
    { id: ++previewSeq, name: "Spotify", cycle: "monthly", amount: 21.9, due_date: shiftDay(today(), -20), notes: "", active: false },
  ];
}

function previewPiggy(name, category, notes, deposits) {
  const entries = deposits.map(([monthsAgo, day, amount]) => ({
    id: ++previewSeq,
    amount,
    deposited_at: `${shiftMonth(today().slice(0, 7), -monthsAgo)}-${pad(day)}`,
  }));
  return {
    id: ++previewSeq,
    name,
    kind: "piggy",
    category,
    notes,
    entries,
    amount: Math.round(entries.reduce((sum, entry) => sum + entry.amount, 0) * 100) / 100,
  };
}

function seedPreviewSavings() {
  if (previewSavings.length) return;
  previewSavings = [
    { id: ++previewSeq, name: "CDB do banco", kind: "investment", category: "Renda fixa", amount: 8000, notes: "Liquidez diária", entries: [] },
    { id: ++previewSeq, name: "Tesouro Selic", kind: "investment", category: "Tesouro", amount: 4500, notes: "", entries: [] },
    { id: ++previewSeq, name: "Ações na corretora", kind: "investment", category: "Ações", amount: 2300, notes: "", entries: [] },
    previewPiggy("Reserva de emergência", "Emergência", "6 meses", [[2, 10, 1000], [1, 3, 2000]]),
    previewPiggy("Viagem de fim de ano", "Viagem", "", [[1, 20, 700], [0, 2, 500]]),
    previewPiggy("Presente", "Presentes", "", [[3, 15, 250]]),
  ];
}

function shiftDay(iso, delta) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function previewApi(method, url, body) {
  if (url === "/telegram") {
    if (method === "DELETE") {
      previewTelegram.linked = false;
      return { linked: false };
    }
    return { configured: true, username: "bgfinance_bot", linked: previewTelegram.linked };
  }
  if (url === "/telegram/link" && method === "POST") {
    return { code: "DEMO42", username: "bgfinance_bot", expires_in: 900 };
  }
  if (url === "/me") {
    if (method === "DELETE") return { deleted: true };
    if (method === "PUT") previewProfile = { ...previewProfile, avatar: body?.avatar || null };
    return { ...previewProfile };
  }
  if (url === "/categories") {
    if (method === "POST") return { id: `custom-${++previewSeq}`, name: body.name, type: body.type, user_id: 1 };
    return [];
  }
  if (url === "/settings") {
    if (method === "PUT" && body?.charts) previewSettings = { charts: { ...previewSettings.charts, ...body.charts } };
    return { charts: { ...previewSettings.charts } };
  }
  if (url === "/imports/statement" && method === "POST") {
    let added = 0;
    let skipped = 0;
    const invoices = new Map();
    for (const row of body?.rows || []) {
      const signed = Number(row.amount);
      const description = String(row.description || "").trim();
      const day = String(row.date || "").slice(0, 10);
      if (!description || !day || !Number.isFinite(signed) || signed === 0) {
        skipped += 1;
        continue;
      }
      const type = body.source === "card" ? (signed < 0 ? "income" : "expense") : signed < 0 ? "expense" : "income";
      const amount = Math.abs(signed);
      const exists = allTransactions.some(
        (t) => t.description === description && Number(t.amount) === amount && t.type === type && String(t.date).slice(0, 10) === day
      );
      if (exists) {
        skipped += 1;
        continue;
      }
      allTransactions.push({
        id: ++previewSeq,
        description,
        amount,
        type,
        category_name: row.category || "Outros",
        date: day,
      });
      added += 1;
      if (body.source === "card" && type === "expense") {
        const month = day.slice(0, 7);
        invoices.set(month, (invoices.get(month) || 0) + amount);
      }
    }
    seedPreviewDebts();
    for (const [month, total] of invoices) {
      const name = `Fatura do cartão ${month.slice(5)}/${month.slice(0, 4)}`;
      const current = previewDebts.find((d) => d.name === name && !d.paid_at);
      if (current) current.amount = Math.round(total * 100) / 100;
      else {
        previewDebts.unshift({
          id: ++previewSeq,
          name,
          kind: "credit_card",
          amount: Math.round(total * 100) / 100,
          due_date: null,
          notes: "Importada da fatura",
          paid_at: null,
        });
      }
    }
    return { added, skipped, debts: invoices.size };
  }
  if (url === "/debts" || url.startsWith("/debts/")) {
    seedPreviewDebts();
    const id = url.split("/")[2];
    if (method === "GET") return previewDebts.map((d) => ({ ...d }));
    if (method === "POST") {
      const created = { ...body, id: ++previewSeq, paid_at: body.paid ? new Date().toISOString() : null };
      previewDebts.unshift(created);
      return { ...created };
    }
    const index = previewDebts.findIndex((d) => String(d.id) === id);
    if (method === "PUT" && index >= 0) {
      previewDebts[index] = {
        ...previewDebts[index],
        ...body,
        paid_at: body.paid ? previewDebts[index].paid_at || new Date().toISOString() : null,
      };
      return { ...previewDebts[index] };
    }
    if (method === "DELETE" && index >= 0) previewDebts.splice(index, 1);
    return {};
  }
  if (url === "/subscriptions" || url.startsWith("/subscriptions/")) {
    seedPreviewSubs();
    const id = url.split("/")[2];
    if (method === "GET") return previewSubs.map((item) => ({ ...item }));
    if (method === "POST") {
      const created = {
        id: ++previewSeq,
        name: body.name,
        cycle: body.cycle || "monthly",
        amount: body.amount,
        due_date: body.due_date || null,
        notes: body.notes || "",
        active: body.active !== false,
        pay_with: body.pay_with === "card" ? "card" : "other",
        billed_due: body.billed_due || null,
      };
      previewSubs.unshift(created);
      return { ...created };
    }
    const index = previewSubs.findIndex((item) => String(item.id) === id);
    if (method === "PUT" && index >= 0) {
      previewSubs[index] = { ...previewSubs[index], ...body, active: body.active !== false };
      return { ...previewSubs[index] };
    }
    if (method === "DELETE" && index >= 0) previewSubs.splice(index, 1);
    return {};
  }
  if (url === "/savings" || url.startsWith("/savings/")) {
    seedPreviewSavings();
    const parts = url.split("/").filter(Boolean);
    const id = parts[1];
    if (parts[2] === "entries") {
      const saving = previewSavings.find((item) => String(item.id) === id && item.kind === "piggy");
      if (!saving) return {};
      saving.entries = Array.isArray(saving.entries) ? saving.entries : [];
      if (method === "POST") {
        saving.entries.unshift({
          id: ++previewSeq,
          amount: Number(body.amount),
          deposited_at: String(body.deposited_at || today()).slice(0, 10),
        });
        saving.amount = Math.round(saving.entries.reduce((sum, entry) => sum + Number(entry.amount), 0) * 100) / 100;
        return { ...saving, entries: saving.entries.map((entry) => ({ ...entry })) };
      }
      if (method === "DELETE") {
        saving.entries = saving.entries.filter((entry) => String(entry.id) !== parts[3]);
        saving.amount = Math.round(saving.entries.reduce((sum, entry) => sum + Number(entry.amount), 0) * 100) / 100;
        return { deleted: 1 };
      }
      return {};
    }
    if (method === "GET") {
      return previewSavings.map((item) => ({
        ...item,
        entries: (item.entries || []).map((entry) => ({ ...entry })),
      }));
    }
    if (method === "POST") {
      const copied = Array.isArray(body.entries)
        ? body.entries.map((entry) => ({
            id: ++previewSeq,
            amount: Number(entry.amount),
            deposited_at: String(entry.deposited_at).slice(0, 10),
          }))
        : [];
      const entries = copied.length
        ? copied
        : body.kind === "piggy" && Number(body.amount) > 0
          ? [{ id: ++previewSeq, amount: Number(body.amount), deposited_at: String(body.deposited_at || today()).slice(0, 10) }]
          : [];
      const created = {
        id: ++previewSeq,
        name: body.name,
        kind: body.kind || "investment",
        category: body.category,
        notes: body.notes || "",
        entries,
        amount: entries.length
          ? Math.round(entries.reduce((sum, entry) => sum + Number(entry.amount), 0) * 100) / 100
          : Number(body.amount) || 0,
      };
      previewSavings.unshift(created);
      return { ...created, entries: entries.map((entry) => ({ ...entry })) };
    }
    const index = previewSavings.findIndex((item) => String(item.id) === id);
    if (method === "PUT" && index >= 0) {
      const previous = previewSavings[index];
      const kind = body.kind || previous.kind;
      previewSavings[index] = {
        ...previous,
        ...body,
        kind,
        entries: kind === "piggy" ? previous.entries || [] : [],
        amount: kind === "piggy" ? previous.amount : body.amount,
      };
      return { ...previewSavings[index], entries: (previewSavings[index].entries || []).map((entry) => ({ ...entry })) };
    }
    if (method === "DELETE" && index >= 0) previewSavings.splice(index, 1);
    return {};
  }
  const id = url.split("/")[2];
  if (method === "GET") return allTransactions.map((t) => ({ ...t }));
  if (method === "POST") {
    allTransactions.push({ ...body, id: ++previewSeq, category_name: body.category });
    return { id: previewSeq };
  }
  const index = allTransactions.findIndex((t) => String(t.id) === id);
  if (method === "PUT" && index >= 0) {
    allTransactions[index] = { ...allTransactions[index], ...body, category_name: body.category };
  }
  if (method === "DELETE" && index >= 0) allTransactions.splice(index, 1);
  return {};
}

async function api(method, url, body) {
  if (previewMode) return previewApi(method, url, body);
  const response = await fetch(url, {
    method,
    headers: authHeaders(body ? { "Content-Type": "application/json" } : {}),
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (handleAuth(response)) throw new Error("Sessão expirada");
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Não foi possível completar a ação");
  return data;
}

/* ---------- conta ---------- */

const accountBtn = document.getElementById("account-btn");
const accountMenu = document.getElementById("account-menu");
const miniEmail = document.querySelector(".mini-email");
const miniLabel = document.querySelector(".mini-label");
const avatarImg = document.getElementById("user-avatar-img");
const avatarLetter = document.getElementById("user-avatar-letter");
const menuPhoto = document.getElementById("account-photo-img");
const menuLetter = document.getElementById("account-letter");
const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");
const accountSince = document.getElementById("account-since");
const photoInput = document.getElementById("account-photo-input");
const photoLabel = document.getElementById("account-photo-label");
const photoRemove = document.getElementById("account-photo-remove");
const userId = payload?.id || (previewMode ? "preview" : "anon");
const avatarKey = `bg-avatar:${userId}`;

function sinceLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const when = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return `Conta desde ${when}`;
}

function paintAvatar(dataUrl) {
  const has = Boolean(dataUrl);
  for (const img of [avatarImg, menuPhoto]) {
    if (!img) continue;
    img.hidden = !has;
    if (has) img.src = dataUrl;
    else img.removeAttribute("src");
  }
  if (avatarLetter) avatarLetter.hidden = has;
  if (menuLetter) menuLetter.hidden = has;
  if (photoLabel) photoLabel.textContent = has ? "Trocar foto" : "Colocar foto";
  if (photoRemove) photoRemove.hidden = !has;
}

function setAccount(info) {
  const email = info.email || "";
  const name = (info.name || "").trim() || email.split("@")[0] || "Conta";
  const letter = name.charAt(0).toUpperCase() || "B";
  if (miniEmail) miniEmail.textContent = email;
  if (miniLabel) miniLabel.textContent = name;
  if (accountName) accountName.textContent = name;
  if (accountEmail) accountEmail.textContent = email;
  if (avatarLetter) avatarLetter.textContent = letter;
  if (menuLetter) menuLetter.textContent = letter;
  if (accountBtn) accountBtn.setAttribute("aria-label", `Abrir dados de ${name}`);
  if (accountSince) {
    const since = info.created_at ? sinceLabel(info.created_at) : "";
    accountSince.textContent = since;
    accountSince.hidden = !since;
  }
  paintAvatar(info.avatar || "");
}

function cachedAvatar() {
  try {
    return localStorage.getItem(avatarKey) || "";
  } catch {
    return "";
  }
}

function rememberAvatar(dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(avatarKey, dataUrl);
    else localStorage.removeItem(avatarKey);
  } catch {
    /* a foto continua na conta mesmo se o navegador recusar o cache */
  }
}

setAccount({
  email: payload?.email || (previewMode ? "demo@bgfinance.app" : ""),
  name: previewMode ? "Conta demo" : "",
  created_at: previewMode ? previewProfile.created_at : "",
  avatar: cachedAvatar(),
});

function openAccount(open) {
  if (!accountMenu || !accountBtn) return;
  accountMenu.hidden = !open;
  accountBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

accountBtn?.addEventListener("click", () => {
  openAccount(accountMenu.hidden);
});

document.addEventListener("click", (event) => {
  if (!accountMenu || accountMenu.hidden) return;
  if (event.target.closest(".account")) return;
  openAccount(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") openAccount(false);
});

document.getElementById("delete-account")?.addEventListener("click", async () => {
  openAccount(false);
  const password = await askDialog({
    title: "Apagar conta",
    text: "Isso apaga a conta, os lançamentos e as dívidas. Não tem como desfazer.",
    placeholder: "Sua senha",
    okLabel: "Apagar conta",
    input: true,
    inputType: "password",
    danger: true,
  });
  if (!password) return;
  try {
    await api("DELETE", "/me", { password });
    localStorage.removeItem("token");
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(CATEGORY_KEY);
    localStorage.removeItem(avatarKey);
    window.location.href = "login.html";
  } catch (err) {
    toast(err.message, "error");
  }
});

function readPhoto(file) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    return Promise.reject(new Error("Escolha uma imagem"));
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 192;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      if (dataUrl.length > 140000) {
        reject(new Error("Essa foto ficou grande demais. Tente outra."));
        return;
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a foto"));
    };
    img.src = url;
  });
}

async function saveAvatar(dataUrl) {
  paintAvatar(dataUrl);
  const saved = await api("PUT", "/me", { avatar: dataUrl || null });
  rememberAvatar(saved?.avatar || "");
  paintAvatar(saved?.avatar || "");
}

photoInput?.addEventListener("change", async () => {
  const file = photoInput.files && photoInput.files[0];
  photoInput.value = "";
  if (!file) return;
  try {
    await saveAvatar(await readPhoto(file));
    toast("Foto atualizada");
  } catch (err) {
    paintAvatar(cachedAvatar());
    toast(err.message || "Não foi possível salvar a foto", "error");
  }
});

photoRemove?.addEventListener("click", async () => {
  try {
    await saveAvatar("");
    toast("Foto removida");
  } catch (err) {
    paintAvatar(cachedAvatar());
    toast(err.message || "Não foi possível remover a foto", "error");
  }
});

if (previewMode && cachedAvatar()) previewProfile.avatar = cachedAvatar();

if (token || previewMode) {
  api("GET", "/me")
    .then((me) => {
      rememberAvatar(me?.avatar || "");
      setAccount(me || {});
    })
    .catch(() => {});
}

/* ---------- categorias ---------- */

function categoriesFor(type) {
  const fromApi = apiCategories.filter((c) => c.type === type);
  const byKey = new Map(fromApi.map((c) => [catKey(c.name), c]));
  const defaults = (type === "income" ? INCOME_CATS : EXPENSE_CATS).filter((name) => name !== "Outros");
  const known = new Set([...defaults, "Outros"].map(catKey));
  const pick = (name) => {
    const found = byKey.get(catKey(name));
    return found ? { ...found, name } : { id: name, name, type };
  };
  const custom = fromApi
    .filter((c) => !known.has(catKey(c.name)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return [...defaults.map(pick), ...custom, pick("Outros")];
}

function fillCategorySelect(select, type, selected) {
  const cats = categoriesFor(type);
  select.innerHTML = cats.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  if (selected == null || selected === "") return;
  const match = cats.find((c) => String(c.id) === String(selected) || c.name === selected);
  if (match) select.value = String(match.id);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function setType(type) {
  typeInput.value = type;
  btnIncome.classList.toggle("active", type === "income");
  btnExpense.classList.toggle("active", type === "expense");
  fillCategorySelect(categorySelect, type, categorySelect.selectedOptions[0]?.text);
}

btnIncome?.addEventListener("click", () => setType("income"));
btnExpense?.addEventListener("click", () => setType("expense"));
categorySelect?.addEventListener("change", (e) => {
  if (e.detail !== "auto") categoryTouched = true;
});

descriptionInput?.addEventListener("input", () => {
  if (categoryTouched) return;
  const text = descriptionInput.value;
  const hit = KEYWORDS.find(([re]) => re.test(text));
  if (!hit) return;
  const [, cat, kind] = hit;
  if (typeInput.value !== kind) setType(kind);
  fillCategorySelect(categorySelect, kind, cat);
  categorySelect.dispatchEvent(new CustomEvent("change", { detail: "auto" }));
});

newCategoryBtn?.addEventListener("click", async () => {
  const type = typeInput.value;
  const name = await askDialog({
    title: "Nova categoria",
    text: `Será criada como categoria de ${type === "income" ? "receita" : "despesa"}.`,
    placeholder: "Ex: Pets, Presentes…",
    okLabel: "Criar",
    input: true,
  });
  if (!name) return;
  if (categoriesFor(type).some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    toast("Essa categoria já existe", "error");
    return;
  }
  try {
    const created = await api("POST", "/categories", { name, type });
    apiCategories.push(created);
    fillCategorySelect(categorySelect, type, created.id);
    categoryTouched = true;
    toast(`Categoria "${name}" criada`);
  } catch (err) {
    toast(err.message, "error");
  }
});

if (dateInput && !dateInput.value) dateInput.value = today();
fillCategorySelect(categorySelect, "income");

function loadCategoryMap() {
  try {
    return JSON.parse(localStorage.getItem(CATEGORY_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCategory(id, category) {
  const map = loadCategoryMap();
  map[id] = category;
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(map));
}

function inferCategory(t) {
  if (t.category_name) return t.category_name;
  const map = loadCategoryMap();
  if (t.category) return t.category;
  if (map[t.id]) return map[t.id];
  const text = String(t.description || "");
  for (const [re, cat, kind] of KEYWORDS) {
    if (re.test(text) && (!kind || kind === t.type)) return cat;
  }
  return "Outros";
}

function txDate(t) {
  const raw = String(t.date || t.createdAt || "").slice(0, 10);
  return raw || today();
}

/* ---------- edição ---------- */

const editModal = document.getElementById("edit-modal");
const closeModalBtn = document.getElementById("close-modal");
const cancelEditBtn = document.getElementById("cancel-edit");
const editForm = document.getElementById("edit-form");
const editDescription = document.getElementById("edit-description");
const editAmount = document.getElementById("edit-amount");
const editCategory = document.getElementById("edit-category");
const editDate = document.getElementById("edit-date");
const editIncomeBtn = document.getElementById("edit-income");
const editExpenseBtn = document.getElementById("edit-expense");

let editingTransaction = null;
let editTypeValue = "income";

function openEditModal(t) {
  editingTransaction = t;
  editDescription.value = t.description;
  editAmount.value = Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  editTypeValue = t.type;
  editDate.value = txDate(t);
  fillCategorySelect(editCategory, t.type, t.category_id || inferCategory(t));
  editIncomeBtn.classList.toggle("active", t.type === "income");
  editExpenseBtn.classList.toggle("active", t.type === "expense");
  editModal.classList.remove("hidden");
  editDescription.focus();
}

function closeEditModal() {
  editModal.classList.add("hidden");
  editingTransaction = null;
}

closeModalBtn?.addEventListener("click", closeEditModal);
cancelEditBtn?.addEventListener("click", closeEditModal);
editModal?.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) closeEditModal();
});
editIncomeBtn?.addEventListener("click", () => {
  editTypeValue = "income";
  editIncomeBtn.classList.add("active");
  editExpenseBtn.classList.remove("active");
  fillCategorySelect(editCategory, "income", editCategory.selectedOptions[0]?.text);
});
editExpenseBtn?.addEventListener("click", () => {
  editTypeValue = "expense";
  editExpenseBtn.classList.add("active");
  editIncomeBtn.classList.remove("active");
  fillCategorySelect(editCategory, "expense", editCategory.selectedOptions[0]?.text);
});

function txBody({ description, amount, type, select, date }) {
  return {
    description,
    amount,
    type,
    category_id: Number(select.value) || null,
    category: select.selectedOptions[0]?.text,
    date,
  };
}

editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!editingTransaction) return;
  const description = editDescription.value.trim();
  const amount = parseAmount(editAmount.value);
  if (!description) return toast("Informe uma descrição", "error");
  if (Number.isNaN(amount)) return toast("Valor inválido. Use por exemplo 49,90", "error");
  const body = txBody({ description, amount, type: editTypeValue, select: editCategory, date: editDate.value });
  const previous = editingTransaction;
  let added = 0;
  if (body.type === "expense" && isSavedMoney(body.category)) {
    const same = previous.type === "expense" && isSavedMoney(inferCategory(previous));
    added = same ? Math.max(0, amount - Number(previous.amount)) : amount;
  }
  let mirror = false;
  if (!linkingSaved && added > 0.009) {
    const choice = await askMirrorSaved(description, Math.round(added * 100) / 100, true);
    if (choice === null) return;
    mirror = choice === true;
  }
  try {
    await api("PUT", `/transactions/${previous.id}`, body);
    saveCategory(previous.id, body.category);
    if (mirror) {
      linkingSaved = true;
      try {
        await putSavedFromExpense(description, Math.round(added * 100) / 100, body.date);
      } finally {
        linkingSaved = false;
      }
    }
    closeEditModal();
    toast("Lançamento atualizado");
    loadTransactions();
  } catch (err) {
    toast(err.message, "error");
  }
});

async function deleteTransaction(t) {
  try {
    await api("DELETE", `/transactions/${t.id}`);
  } catch (err) {
    toast(err.message, "error");
    return;
  }
  await loadTransactions();
  toast(`"${t.description}" excluído`, "info", {
    label: "Desfazer",
    run: async () => {
      try {
        const category = inferCategory(t);
        const created = await api("POST", "/transactions", {
          description: t.description,
          amount: Number(t.amount),
          type: t.type,
          category_id: t.category_id || null,
          category,
          date: txDate(t),
        });
        if (created?.id) saveCategory(created.id, category);
        await loadTransactions();
        toast("Lançamento restaurado");
      } catch (err) {
        toast(err.message, "error");
      }
    },
  });
}

/* ---------- tabela e resumo ---------- */

function matchesFilters(t, { month, type, cat, q }) {
  const date = txDate(t);
  if (month && !date.startsWith(month)) return false;
  if (type && t.type !== type) return false;
  if (cat && inferCategory(t) !== cat) return false;
  if (q && !String(t.description).toLowerCase().includes(q)) return false;
  return true;
}

function currentFilters() {
  return {
    month: monthFilter?.value || "",
    type: typeFilter?.value || "",
    cat: categoryFilter?.value || "",
    q: (searchFilter?.value || "").trim().toLowerCase(),
  };
}

function filteredRows() {
  const filters = currentFilters();
  return allTransactions.filter((t) => matchesFilters(t, filters));
}

function refreshCategoryFilter() {
  const current = categoryFilter.value;
  const cats = [...new Set(allTransactions.map(inferCategory))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  categoryFilter.innerHTML =
    `<option value="">Todas</option>` + cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (cats.includes(current)) categoryFilter.value = current;
}

function emptyRow(message) {
  tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="empty-state">${ICON.inbox}<span>${message}</span></div></td></tr>`;
}

function renderTable(rows) {
  const sorted = [...rows].sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (sortKey === "date") {
      va = txDate(a);
      vb = txDate(b);
    }
    if (sortKey === "category") {
      va = inferCategory(a);
      vb = inferCategory(b);
    }
    if (sortKey === "amount") {
      va = Number(a.amount);
      vb = Number(b.amount);
    }
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  document.querySelectorAll(".sheet thead th[data-sort]").forEach((th) => {
    th.classList.toggle("sorted", th.dataset.sort === sortKey);
    th.classList.toggle("asc", th.dataset.sort === sortKey && sortDir === "asc");
  });
  const sortValue = `${sortKey}:${sortDir}`;
  if (mobileSort && mobileSort.value !== sortValue && [...mobileSort.options].some((o) => o.value === sortValue)) {
    mobileSort.value = sortValue;
    mobileSort.dispatchEvent(new CustomEvent("change", { detail: "sync" }));
  }

  txCount.textContent = `${sorted.length} registro${sorted.length === 1 ? "" : "s"}`;
  const heading = document.getElementById("tx-heading");
  const month = monthFilter?.value || "";
  if (heading) {
    heading.textContent = month
      ? `Lançamentos · ${MONTHS_LONG[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`
      : "Lançamentos";
  }
  if (!sorted.length) showMoreBtn.classList.add("hidden");
  if (loading) return emptyRow("Carregando lançamentos…");
  if (!allTransactions.length) return emptyRow("Nenhum lançamento ainda. Adicione o primeiro acima.");
  if (!sorted.length) {
    if (month) return emptyRow(`Nenhum lançamento em ${MONTHS_FULL[Number(month.slice(5)) - 1]} de ${month.slice(0, 4)}.`);
    return emptyRow("Nada encontrado com esses filtros.");
  }

  tbody.innerHTML = "";
  const remaining = sorted.length - visibleCount;
  showMoreBtn.classList.toggle("hidden", remaining <= 0);
  showMoreBtn.textContent = `Mostrar mais · ${remaining} restante${remaining === 1 ? "" : "s"}`;
  let lastMonth = "";
  sorted.slice(0, visibleCount).forEach((t) => {
    const rowMonth = txDate(t).slice(0, 7);
    if (!month && sortKey === "date" && rowMonth !== lastMonth) {
      lastMonth = rowMonth;
      const head = document.createElement("tr");
      head.className = "month-row";
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.textContent = `${MONTHS_LONG[Number(rowMonth.slice(5)) - 1]} ${rowMonth.slice(0, 4)}`;
      head.appendChild(cell);
      tbody.appendChild(head);
    }
    const tr = document.createElement("tr");
    const category = inferCategory(t);
    const dateTd = document.createElement("td");
    dateTd.className = "date-cell";
    dateTd.textContent = formatDate(txDate(t));
    const descTd = document.createElement("td");
    descTd.className = "desc-cell";
    descTd.textContent = t.description;
    const catTd = document.createElement("td");
    catTd.className = "cat-cell";
    const chip = document.createElement("span");
    chip.className = "cat-chip";
    chip.style.setProperty("--c", catColor(category));
    chip.textContent = category;
    catTd.appendChild(chip);
    tr.append(dateTd, descTd, catTd);
    const typeTd = document.createElement("td");
    typeTd.className = "type-cell";
    const tag = document.createElement("span");
    tag.className = `tag ${t.type === "income" ? "income" : "expense"}`;
    tag.textContent = t.type === "income" ? "Receita" : "Despesa";
    typeTd.appendChild(tag);
    tr.appendChild(typeTd);

    const valTd = document.createElement("td");
    valTd.className = `num amount ${t.type}`;
    valTd.textContent = `${t.type === "expense" ? "− " : "+ "}${money(t.amount)}`;
    tr.appendChild(valTd);

    const actTd = document.createElement("td");
    actTd.className = "act-cell";
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "action-btn edit";
    editBtn.title = "Editar";
    editBtn.setAttribute("aria-label", "Editar");
    editBtn.innerHTML = ICON.edit;
    editBtn.addEventListener("click", () => openEditModal(t));
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "action-btn delete";
    delBtn.title = "Excluir";
    delBtn.setAttribute("aria-label", "Excluir");
    delBtn.innerHTML = ICON.trash;
    delBtn.addEventListener("click", () => deleteTransaction(t));
    actions.append(editBtn, delBtn);
    actTd.appendChild(actions);
    tr.appendChild(actTd);
    tbody.appendChild(tr);
  });
}

document.querySelectorAll(".sheet thead th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
    else {
      sortKey = key;
      sortDir = key === "amount" || key === "date" ? "desc" : "asc";
    }
    renderDashboard();
  });
});

mobileSort?.addEventListener("change", (e) => {
  if (e.detail === "sync") return;
  [sortKey, sortDir] = mobileSort.value.split(":");
  renderDashboard();
});

function totals(rows) {
  let income = 0;
  let expense = 0;
  rows.forEach((t) => {
    if (t.type === "income") income += Number(t.amount);
    else expense += Number(t.amount);
  });
  return { income, expense };
}

function deltaText(now, before) {
  if (!before) return now ? "Sem dados no mês anterior" : "&nbsp;";
  const pct = ((now - before) / before) * 100;
  const arrow = pct >= 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(pct).toFixed(0)}% vs mês anterior`;
}

function renderCards(rows, income, expense) {
  const total = income - expense;
  const rate = income > 0 ? ((income - expense) / income) * 100 : 0;
  incomeDisplay.textContent = money(income);
  expenseDisplay.textContent = money(expense);
  totalDisplay.textContent = money(total);
  totalDisplay.classList.toggle("negative", total < 0);
  savingsDisplay.textContent = `${rate.toFixed(1).replace(".", ",")}%`;
  rateBarFill.style.width = `${Math.max(0, Math.min(100, rate))}%`;

  const filters = currentFilters();
  if (filters.month) {
    const prevRows = allTransactions.filter((t) => matchesFilters(t, { ...filters, month: shiftMonth(filters.month, -1) }));
    const prev = totals(prevRows);
    incomeHint.innerHTML = deltaText(income, prev.income);
    expenseHint.innerHTML = deltaText(expense, prev.expense);
    incomeHint.className = `card-hint ${income >= prev.income ? "good" : "bad"}`;
    expenseHint.className = `card-hint ${expense <= prev.expense ? "good" : "bad"}`;
  } else {
    const n = rows.filter((t) => t.type === "income").length;
    const m = rows.length - n;
    incomeHint.textContent = `${n} entrada${n === 1 ? "" : "s"}`;
    expenseHint.textContent = `${m} saída${m === 1 ? "" : "s"}`;
    incomeHint.className = expenseHint.className = "card-hint";
  }
  totalHint.textContent = total >= 0 ? "Você está no positivo" : "Gastos acima das receitas";
  totalHint.className = `card-hint ${total >= 0 ? "good" : "bad"}`;
}

/* ---------- gráficos ---------- */

const hiddenSeries = {};

function isRadial(chart) {
  return chart.config.type === "doughnut" || chart.config.type === "pie";
}

function setSeriesVisible(chart, item, visible) {
  if (isRadial(chart)) {
    if (chart.getDataVisibility(item.index) !== visible) chart.toggleDataVisibility(item.index);
  } else {
    chart.setDatasetVisibility(item.datasetIndex, visible);
  }
}

const htmlLegendPlugin = {
  id: "htmlLegend",
  beforeUpdate(chart) {
    if (chart.$legendRestored) return;
    chart.$legendRestored = true;
    const hidden = hiddenSeries[chart.canvas.id];
    if (!hidden) return;
    if (isRadial(chart)) {
      chart.data.labels.forEach((text, index) => {
        if (hidden.has(text)) setSeriesVisible(chart, { index }, false);
      });
    } else {
      chart.data.datasets.forEach((ds, datasetIndex) => {
        if (hidden.has(ds.label)) setSeriesVisible(chart, { datasetIndex }, false);
      });
    }
  },
  afterUpdate(chart) {
    const wrapper = chart.canvas.parentNode;
    let box = wrapper.nextElementSibling;
    if (!box || !box.classList.contains("chart-legend")) {
      box = document.createElement("div");
      box.className = "chart-legend";
      wrapper.after(box);
    }
    const radial = isRadial(chart);
    const values = radial ? chart.data.datasets[0].data : [];
    const sum = values.reduce((acc, v) => acc + Number(v || 0), 0);
    box.innerHTML = "";
    chart.options.plugins.legend.labels.generateLabels(chart).forEach((item) => {
      const ds = chart.data.datasets[item.datasetIndex ?? 0];
      const isLine = !radial && (ds.type || chart.config.type) === "line";
      const color = radial
        ? item.fillStyle
        : isLine
          ? ds.borderColor
          : Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "legend-chip" + (item.hidden ? " is-off" : "");
      btn.style.setProperty("--c", color);
      btn.setAttribute("aria-pressed", String(!item.hidden));
      btn.title = item.hidden ? "Mostrar no gráfico" : "Ocultar do gráfico";

      const swatch = document.createElement("span");
      swatch.className = "legend-swatch" + (isLine ? " line" : "") + (ds.borderDash ? " dashed" : "");
      const label = document.createElement("span");
      label.textContent = item.text;
      btn.append(swatch, label);
      if (radial && sum) {
        const value = document.createElement("span");
        value.className = "legend-value";
        value.textContent = `${((Number(values[item.index]) / sum) * 100).toFixed(0)}%`;
        btn.appendChild(value);
      }

      btn.addEventListener("click", () => {
        const id = chart.canvas.id;
        hiddenSeries[id] = hiddenSeries[id] || new Set();
        if (item.hidden) hiddenSeries[id].delete(item.text);
        else hiddenSeries[id].add(item.text);
        setSeriesVisible(chart, item, item.hidden);
        chart.update();
      });
      box.appendChild(btn);
    });
  },
};

function chartDefaults() {
  if (!chartDefaults.done) {
    Chart.register(htmlLegendPlugin);
    chartDefaults.done = true;
  }
  const light = document.documentElement.dataset.theme === "light";
  Chart.defaults.color = light ? "#475569" : "#cbd5e1";
  Chart.defaults.borderColor = light ? "rgba(15,23,42,.08)" : "rgba(255,255,255,.06)";
  Chart.defaults.font.family = '"Segoe UI", system-ui, sans-serif';
  Chart.defaults.animation = false;
  Chart.defaults.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = "#0f172a";
  Chart.defaults.plugins.tooltip.titleColor = "#f8fafc";
  Chart.defaults.plugins.tooltip.bodyColor = "#e5e7eb";
  Chart.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,.12)";
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    charts[id] = null;
  }
}

function tooltipBRL(ctx) {
  const v = ctx.parsed.y ?? ctx.parsed.x ?? ctx.parsed;
  return `${ctx.dataset.label}: ${money(v)}`;
}

function compactMoney(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
}

function markEmpty(canvasId, empty) {
  document.getElementById(canvasId)?.closest(".chart-card")?.classList.toggle("is-empty", empty);
}

function updateCharts(rows, income, expense) {
  if (document.getElementById("view-home")?.hidden) {
    chartsNeedDraw = true;
    return;
  }
  chartsNeedDraw = false;
  if (typeof Chart === "undefined") return;
  chartDefaults();
  const byMonth = new Map();
  const byCat = new Map();
  const byDay = new Map();

  rows.forEach((t) => {
    const date = txDate(t);
    const month = date.slice(0, 7);
    const cat = inferCategory(t);
    const amount = Number(t.amount);
    if (!byMonth.has(month)) byMonth.set(month, { income: 0, expense: 0 });
    if (!byDay.has(date)) byDay.set(date, { income: 0, expense: 0 });
    const m = byMonth.get(month);
    const d = byDay.get(date);
    if (t.type === "income") {
      m.income += amount;
      d.income += amount;
    } else {
      m.expense += amount;
      d.expense += amount;
      byCat.set(cat, (byCat.get(cat) || 0) + amount);
    }
  });

  const months = Array.from(byMonth.keys()).sort();
  let running = 0;
  const saldo = months.map((m) => {
    const item = byMonth.get(m);
    running += item.income - item.expense;
    return running;
  });

  if (chartPrefs.flow === false) destroyChart("flow");
  else {
  markEmpty("chartFlow", !rows.length);
  destroyChart("flow");
  charts.flow = new Chart(document.getElementById("chartFlow"), {
    type: "bar",
    data: {
      labels: months.map(monthShort),
      datasets: [
        {
          type: "bar",
          label: "Receitas",
          data: months.map((m) => byMonth.get(m).income),
          backgroundColor: "rgba(52, 211, 153, .8)",
          borderRadius: 8,
          maxBarThickness: 38,
          yAxisID: "y",
        },
        {
          type: "bar",
          label: "Despesas",
          data: months.map((m) => byMonth.get(m).expense),
          backgroundColor: "rgba(248, 113, 113, .8)",
          borderRadius: 8,
          maxBarThickness: 38,
          yAxisID: "y",
        },
        {
          type: "line",
          label: "Saldo acumulado",
          data: saldo,
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96,165,250,.15)",
          pointBackgroundColor: "#60a5fa",
          pointRadius: 3,
          tension: 0.35,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: { callbacks: { label: tooltipBRL } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: compactMoney } },
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { callback: compactMoney },
        },
      },
    },
  });
  }

  const catEntries = Array.from(byCat.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (chartPrefs.category === false) destroyChart("category");
  else {
  markEmpty("chartCategory", !catEntries.length);
  destroyChart("category");
  charts.category = new Chart(document.getElementById("chartCategory"), {
    type: "bar",
    data: {
      labels: catEntries.map((c) => c[0]),
      datasets: [
        {
          label: "Despesas",
          data: catEntries.map((c) => c[1]),
          backgroundColor: catEntries.map((c) => catColor(c[0])),
          borderRadius: 8,
          maxBarThickness: 26,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        htmlLegend: false,
        tooltip: { callbacks: { label: tooltipBRL } },
      },
      scales: {
        x: { ticks: { callback: compactMoney } },
        y: { grid: { display: false } },
      },
    },
  });
  }

  const mixMode = chartMode?.value || "mix";
  const mixLabels = mixMode === "cats" ? catEntries.map((c) => c[0]) : ["Receitas", "Despesas"];
  const mixData = mixMode === "cats" ? catEntries.map((c) => c[1]) : [income, expense];
  const mixColors = mixMode === "cats" ? catEntries.map((c) => catColor(c[0])) : ["#34d399", "#f87171"];
  if (chartPrefs.mix === false) destroyChart("mix");
  else {
  markEmpty("chartMix", !mixData.some(Boolean));
  destroyChart("mix");
  charts.mix = new Chart(document.getElementById("chartMix"), {
    type: "doughnut",
    data: {
      labels: mixLabels,
      datasets: [{ data: mixData, backgroundColor: mixColors, borderColor: getComputedStyle(document.documentElement).getPropertyValue("--bg1").trim() || "#0f172a", borderWidth: 3, hoverOffset: 6 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${money(ctx.parsed)}`,
          },
        },
      },
    },
  });
  }

  const days = Array.from(byDay.keys()).sort();
  if (chartPrefs.daily === false) destroyChart("daily");
  else {
  markEmpty("chartDaily", !days.length);
  destroyChart("daily");
  charts.daily = new Chart(document.getElementById("chartDaily"), {
    type: "line",
    data: {
      labels: days.map((d) => formatDate(d).slice(0, 5)),
      datasets: [
        {
          label: "Receitas",
          data: days.map((d) => byDay.get(d).income),
          borderColor: "#34d399",
          backgroundColor: "rgba(52,211,153,.12)",
          fill: true,
          pointRadius: 2,
          tension: 0.35,
        },
        {
          label: "Despesas",
          data: days.map((d) => byDay.get(d).expense),
          borderColor: "#f87171",
          backgroundColor: "rgba(248,113,113,.10)",
          fill: true,
          pointRadius: 2,
          tension: 0.35,
        },
        {
          label: "Saldo do dia",
          data: days.map((d) => byDay.get(d).income - byDay.get(d).expense),
          borderColor: "#60a5fa",
          borderDash: [6, 4],
          pointRadius: 0,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: { callbacks: { label: tooltipBRL } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { callback: compactMoney } },
      },
    },
  });
  }
}

function renderPivot(rows) {
  if (!rows.length) {
    pivotWrap.innerHTML = `<div class="empty-state">${ICON.inbox}<span>Sem dados para montar a tabela.</span></div>`;
    return;
  }
  const months = [...new Set(rows.map((t) => txDate(t).slice(0, 7)))].sort();
  const cats = [...new Set(rows.map(inferCategory))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const grid = {};
  cats.forEach((c) => {
    grid[c] = {};
    months.forEach((m) => (grid[c][m] = { income: 0, expense: 0 }));
  });
  rows.forEach((t) => {
    const m = txDate(t).slice(0, 7);
    const c = inferCategory(t);
    if (!grid[c] || grid[c][m] == null) return;
    if (t.type === "income") grid[c][m].income += Number(t.amount);
    else grid[c][m].expense += Number(t.amount);
  });

  const cell = (v, strong) => {
    const cls = v > 0 ? "pos" : v < 0 ? "neg" : "";
    const text = v ? money(v) : "—";
    return `<td class="num ${cls}">${strong ? `<strong>${text}</strong>` : text}</td>`;
  };
  const head = ["Categoria", ...months.map(monthShort), "Total"].map(
    (h, i) => `<th class="${i ? "num" : ""}">${h}</th>`
  );
  const body = cats
    .map((c) => {
      let total = 0;
      const cells = months.map((m) => {
        const net = grid[c][m].income - grid[c][m].expense;
        total += net;
        return cell(net);
      });
      return `<tr><td><span class="cat-chip" style="--c:${catColor(c)}">${escapeHtml(c)}</span></td>${cells.join("")}${cell(total, true)}</tr>`;
    })
    .join("");

  const monthTotals = months.map((m) => cell(cats.reduce((acc, c) => acc + grid[c][m].income - grid[c][m].expense, 0), true));
  const grand = cats.reduce((acc, c) => acc + months.reduce((s, m) => s + grid[c][m].income - grid[c][m].expense, 0), 0);

  pivotWrap.innerHTML = `
    <table class="sheet pivot">
      <thead><tr>${head.join("")}</tr></thead>
      <tbody>${body}
        <tr class="total-row"><td><strong>Total</strong></td>${monthTotals.join("")}${cell(grand, true)}</tr>
      </tbody>
    </table>`;
}

function renderDashboard() {
  const rows = filteredRows();
  const { income, expense } = totals(rows);
  renderCards(rows, income, expense);
  renderTable(rows);
  updateCharts(rows, income, expense);
  renderPivot(rows);
}

/* ---------- carregamento ---------- */

function demoTransactions() {
  const base = today().slice(0, 7);
  const items = [];
  let id = 1;
  const add = (monthsAgo, day, description, amount, type, category) => {
    const ym = shiftMonth(base, -monthsAgo);
    items.push({ id: id++, description, amount, type, category_name: category, date: `${ym}-${pad(day)}` });
  };
  [2, 1, 0].forEach((ago) => {
    add(ago, 5, "Salário", 4800, "income", "Salário");
    add(ago, 8, "Aluguel", 1350, "expense", "Moradia");
    add(ago, 10, "Mercado do mês", 620 + ago * 45, "expense", "Alimentação");
    add(ago, 12, "Spotify + Netflix", 64.8, "expense", "Assinaturas");
    add(ago, 15, "Uber", 92 + ago * 18, "expense", "Transporte");
    add(ago, 18, "Projeto freelance", 900 + ago * 250, "income", "Freelance");
    add(ago, 21, "Curso online", 129.9, "expense", "Educação");
    add(ago, 24, "Cinema e jantar", 180 - ago * 30, "expense", "Lazer");
  });
    add(0, 3, "Farmácia", 74.5, "expense", "Saúde");
  add(0, 4, "Internet", 119.9, "expense", "Contas");
  add(0, 6, "Ração", 89, "expense", "Pets");
  add(0, 9, "Camiseta", 79.9, "expense", "Compras");
  add(1, 27, "Rendimento CDB", 86.4, "income", "Investimentos");
  return items.filter((t) => t.date <= today());
}

async function loadCategories() {
  try {
    apiCategories = await api("GET", "/categories");
  } catch {
    apiCategories = [];
  }
  fillCategorySelect(categorySelect, typeInput.value || "income");
}

async function loadTransactions() {
  try {
    allTransactions = await api("GET", "/transactions");
  } catch (err) {
    allTransactions = [];
    toast(err.message, "error");
  }
  loading = false;
  refreshCategoryFilter();
  renderDashboard();
}

function debounce(fn, ms) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function applyFilters() {
  visibleCount = PAGE_SIZE;
  renderDashboard();
}

monthFilter?.addEventListener("change", applyFilters);
typeFilter?.addEventListener("change", applyFilters);
categoryFilter?.addEventListener("change", applyFilters);
searchFilter?.addEventListener("input", debounce(applyFilters, 200));
chartMode?.addEventListener("change", renderDashboard);

function stepMonth(delta) {
  monthFilter.value = shiftMonth(monthFilter.value || today().slice(0, 7), monthFilter.value ? delta : 0);
  monthFilter.dispatchEvent(new Event("change"));
}
monthPrev?.addEventListener("click", () => stepMonth(-1));
monthNext?.addEventListener("click", () => stepMonth(1));

clearFilterBtn?.addEventListener("click", () => {
  [typeFilter, categoryFilter].forEach((el) => {
    if (!el) return;
    el.value = "";
    el.dispatchEvent(new Event("change"));
  });
  if (searchFilter) searchFilter.value = "";
  if (monthFilter) {
    monthFilter.value = today().slice(0, 7);
    monthFilter.dispatchEvent(new Event("change"));
  }
  renderDashboard();
});

exportBtn?.addEventListener("click", () => {
  const rows = filteredRows();
  if (!rows.length) return toast("Não há lançamentos para exportar", "error");
  const lines = [["Data", "Descrição", "Categoria", "Tipo", "Valor"].join(";")];
  rows.forEach((t) => {
    lines.push(
      [
        formatDate(txDate(t)),
        `"${String(t.description).replace(/"/g, '""')}"`,
        inferCategory(t),
        t.type === "income" ? "Receita" : "Despesa",
        Number(t.amount).toFixed(2).replace(".", ","),
      ].join(";")
    );
  });
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `bg-finance${monthFilter.value ? "-" + monthFilter.value : ""}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`${rows.length} lançamento${rows.length === 1 ? "" : "s"} exportado${rows.length === 1 ? "" : "s"}`);
});

const importHint = document.getElementById("import-hint");
const statementFile = document.getElementById("statement-file");
let importSource = "account";

document.querySelectorAll("#import-source [data-source]").forEach((btn) => {
  btn.addEventListener("click", () => {
    importSource = btn.dataset.source;
    document.querySelectorAll("#import-source [data-source]").forEach((el) => {
      el.classList.toggle("active", el === btn);
    });
    if (importHint) {
      importHint.textContent = importSource === "card"
        ? "Fatura fechada. As compras viram despesas e o total do mês vira uma dívida."
        : "Extrato da conta. Valor positivo vira receita e negativo vira despesa.";
    }
  });
});

function parseCsvLine(line, sep) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === sep && !quoted) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normalizeImportDay(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (/^\d{8}/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return "";
}

function parseImportAmount(value) {
  let s = String(value || "").trim().replace(/[R$\s]/g, "");
  if (!s) return NaN;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function parseStatementCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ";" : ",";
  const header = parseCsvLine(lines[0], sep).map((h) => h.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, ""));
  const find = (...names) => header.findIndex((h) => names.includes(h));
  const dateI = find("date", "data");
  const titleI = find("title", "description", "descricao", "memo", "nome");
  const amountI = find("amount", "valor", "value");
  const catI = find("category", "categoria");
  const start = dateI >= 0 || titleI >= 0 ? 1 : 0;
  return lines.slice(start).map((line) => {
    const cols = parseCsvLine(line, sep);
    return {
      date: normalizeImportDay(dateI >= 0 ? cols[dateI] : cols[0]),
      description: (titleI >= 0 ? cols[titleI] : cols[1] || "").slice(0, 120),
      amount: parseImportAmount(amountI >= 0 ? cols[amountI] : cols[2]),
      category: catI >= 0 ? cols[catI] || "" : "",
    };
  }).filter((row) => row.date && row.description && Number.isFinite(row.amount) && row.amount !== 0);
}

function parseStatementOfx(text) {
  return text.split(/<STMTTRN>/i).slice(1).map((block) => {
    const grab = (tag) => {
      const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
      return match ? match[1].trim() : "";
    };
    return {
      date: normalizeImportDay(grab("DTPOSTED")),
      description: (grab("MEMO") || grab("NAME")).slice(0, 120),
      amount: parseImportAmount(grab("TRNAMT")),
      category: "",
    };
  }).filter((row) => row.date && row.description && Number.isFinite(row.amount) && row.amount !== 0);
}

statementFile?.addEventListener("change", async () => {
  const file = statementFile.files?.[0];
  statementFile.value = "";
  if (!file) return;
  const text = await file.text();
  const ofx = /\.ofx$|\.qfx$/i.test(file.name) || /<OFX>/i.test(text);
  const rows = ofx ? parseStatementOfx(text) : parseStatementCsv(text);
  if (!rows.length) return toast("Não encontrei lançamentos nesse arquivo", "error");
  try {
    const result = await api("POST", "/imports/statement", { source: importSource, rows });
    await Promise.all([loadTransactions(), loadDebts()]);
    const debtNote = result.debts ? ` e ${result.debts} dívida${result.debts === 1 ? "" : "s"}` : "";
    toast(`${result.added} lançamento${result.added === 1 ? "" : "s"} importado${result.added === 1 ? "" : "s"}${debtNote}`);
    if (importSource === "card" && result.debts) showView("debts");
  } catch (err) {
    toast(err.message, "error");
  }
});

const SAVED_MONEY = "Dinheiro guardado";
let linkingSaved = false;

function isSavedMoney(name) {
  return catKey(name) === catKey(SAVED_MONEY);
}

function askMirrorSaved(description, amount, toSaved) {
  return askDialog({
    title: toSaved ? "Colocar em Investimentos?" : "Lançar como despesa?",
    text: toSaved
      ? `Adicionar ${money(amount)} de ${description} na aba Investimentos?`
      : `Lançar ${money(amount)} de ${description} como despesa em Dinheiro guardado?`,
    okLabel: toSaved ? "Sim, guardar" : "Sim, lançar",
    cancelLabel: "Não",
  });
}

function sameMoney(a, b) {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

function panelTwin(description, amount, date) {
  const day = String(date || today()).slice(0, 10);
  return allTransactions.some(
    (item) => catKey(item.description) === catKey(description) && sameMoney(item.amount, amount) && txDate(item) === day
  );
}

function piggyTwin(item, amount, date) {
  const day = String(date || today()).slice(0, 10);
  return (item?.entries || []).some(
    (entry) => sameMoney(entry.amount, amount) && String(entry.deposited_at).slice(0, 10) === day
  );
}

function askSameEntry(description, amount, date, where) {
  const day = formatDate(String(date || today()).slice(0, 10));
  return askDialog({
    title: "Já existe um igual",
    text: `Já tem ${money(amount)} de ${description} em ${day} ${where}. Quer lançar mesmo assim?`,
    okLabel: "Lançar mesmo assim",
    cancelLabel: "Não lançar",
  });
}

async function putSavedFromExpense(description, amount, date) {
  const day = String(date || today()).slice(0, 10);
  const current = savings.find(
    (item) => item.kind === "piggy" && isSavedMoney(item.category) && catKey(item.name) === catKey(description)
  );
  if (current) {
    await api("POST", `/savings/${current.id}/entries`, { amount, deposited_at: day });
  } else {
    await api("POST", "/savings", {
      name: description,
      amount,
      kind: "piggy",
      category: SAVED_MONEY,
      notes: "",
      deposited_at: day,
    });
  }
  await loadSavings();
}

async function putExpenseFromSaved(name, amount, date) {
  const day = String(date || today()).slice(0, 10);
  const created = await api("POST", "/transactions", {
    description: name,
    amount,
    type: "expense",
    category: SAVED_MONEY,
    date: day,
  });
  if (created?.id) saveCategory(created.id, SAVED_MONEY);
  chartsNeedDraw = true;
  if (monthFilter) monthFilter.value = day.slice(0, 7);
  await loadTransactions();
  monthFilter?.dispatchEvent(new Event("change"));
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const description = descriptionInput.value.trim();
  const amount = parseAmount(amountInput.value);
  if (!description) return toast("Informe uma descrição", "error");
  if (Number.isNaN(amount)) {
    amountInput.focus();
    return toast("Valor inválido. Use por exemplo 49,90", "error");
  }
  const body = txBody({ description, amount, type: typeInput.value, select: categorySelect, date: dateInput.value || today() });
  if (panelTwin(description, amount, body.date)) {
    const again = await askSameEntry(description, amount, body.date, "no painel");
    if (again !== true) return;
  }
  let mirror = false;
  if (!linkingSaved && body.type === "expense" && isSavedMoney(body.category) && amount > 0) {
    const choice = await askMirrorSaved(description, amount, true);
    if (choice === null) return;
    mirror = choice === true;
  }
  submitBtn.disabled = true;
  submitBtn.textContent = "Salvando…";
  try {
    const created = await api("POST", "/transactions", body);
    if (created?.id) saveCategory(created.id, body.category);
    if (mirror) {
      linkingSaved = true;
      try {
        await putSavedFromExpense(description, amount, body.date);
      } finally {
        linkingSaved = false;
      }
    }
    resetTransactionForm();
    toast(`${body.type === "income" ? "Receita" : "Despesa"} de ${money(amount)} adicionada`);
    await loadTransactions();
  } catch (err) {
    toast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Adicionar";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const openMenus = document.querySelectorAll(".menu-select.open, .month-picker.open");
  if (openMenus.length) {
    openMenus.forEach((el) => el.classList.remove("open"));
    return;
  }
  if (closeActiveDialog) closeActiveDialog();
  else if (!editModal.classList.contains("hidden")) closeEditModal();
  else closeOpenEntryForm();
});

function openEntryForm(target, focus) {
  if (!target) return;
  target.classList.remove("hidden");
  const launch = document.querySelector(`[data-open-form="${target.id}"]`);
  if (launch) launch.hidden = true;
  const field = focus || target.querySelector("input:not([type='hidden']):not(:disabled)");
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    field?.focus({ preventScroll: true });
  });
}

function closeEntryForm(target) {
  if (!target) return;
  target.classList.add("hidden");
  const launch = document.querySelector(`[data-open-form="${target.id}"]`);
  if (launch) launch.hidden = false;
}

function resetTransactionForm() {
  if (descriptionInput) descriptionInput.value = "";
  if (amountInput) amountInput.value = "";
  categoryTouched = false;
  if (dateInput) dateInput.value = today();
  setType("income");
  closeEntryForm(form);
}

function closeOpenEntryForm() {
  const openForm = document.querySelector(".app-view:not([hidden]) form.entry-form:not(.hidden)");
  if (!openForm) return;
  if (openForm.id === "transaction-form") resetTransactionForm();
  else if (openForm.id === "debt-form") resetDebtForm();
  else if (openForm.id === "sub-form") resetSubForm();
  else if (openForm.id === "save-form") resetSaveForm();
}

function bindEntryForms() {
  document.querySelectorAll("[data-open-form]").forEach((btn) => {
    btn.addEventListener("click", () => openEntryForm(document.getElementById(btn.dataset.openForm)));
  });
  document.getElementById("tx-cancel")?.addEventListener("click", resetTransactionForm);
}

/* ---------- menu, dívidas e ajustes ---------- */

const VIEWS = new Set(["home", "debts", "subs", "savings", "settings"]);
let debts = [];
let editingDebtId = null;

const debtForm = document.getElementById("debt-form");
const debtName = document.getElementById("debt-name");
const debtAmount = document.getElementById("debt-amount");
const debtDue = document.getElementById("debt-due");
const debtKind = document.getElementById("debt-kind");
const debtNotes = document.getElementById("debt-notes");
const debtSubmit = document.getElementById("debt-submit");
const debtCancel = document.getElementById("debt-cancel");

function viewFromHash() {
  const name = location.hash.replace("#", "");
  return VIEWS.has(name) ? name : "home";
}

function showView(name, scroll = true) {
  if (!VIEWS.has(name)) name = "home";
  document.querySelectorAll(".app-view").forEach((el) => {
    el.hidden = el.id !== `view-${name}`;
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    const on = btn.dataset.view === name;
    btn.classList.toggle("is-active", on);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
  const nextHash = name === "home" ? "" : `#${name}`;
  if (location.hash !== nextHash) history.replaceState(null, "", location.pathname + location.search + nextHash);
  if (name === "home" && chartsNeedDraw) renderDashboard();
  else if (name === "home") requestAnimationFrame(() => Object.values(charts).forEach((chart) => chart?.resize()));
  if (name === "settings") loadTelegram();
  if (scroll) window.scrollTo(0, 0);
}

let pinFrame = 0;
let pinShift = "";
function pinTabbar() {
  if (pinFrame) return;
  pinFrame = requestAnimationFrame(() => {
    pinFrame = 0;
    const bar = document.querySelector(".tabbar");
    const vv = window.visualViewport;
    if (!bar || !vv) return;
    const next = `${Math.max(0, Math.round(window.innerHeight - (vv.offsetTop + vv.height)))}px`;
    if (next === pinShift) return;
    pinShift = next;
    bar.style.setProperty("--vv-shift", next);
  });
}

function bindNavigation() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
  window.addEventListener("hashchange", () => showView(viewFromHash(), false));
  pinTabbar();
  window.visualViewport?.addEventListener("resize", pinTabbar, { passive: true });
  window.visualViewport?.addEventListener("scroll", pinTabbar, { passive: true });
  window.addEventListener("resize", pinTabbar, { passive: true });
}

function applyChartPrefs() {
  const anyOn = CHART_OPTIONS.some((opt) => chartPrefs[opt.id] !== false);
  CHART_OPTIONS.forEach((opt) => {
    const card = document.querySelector(`[data-chart="${opt.id}"]`);
    if (card) card.hidden = chartPrefs[opt.id] === false;
  });
  const grid = document.querySelector(".charts-grid");
  const note = document.getElementById("charts-off");
  if (grid) grid.hidden = !anyOn;
  if (note) note.hidden = anyOn;
  if (document.getElementById("view-home")?.hidden) chartsNeedDraw = true;
  document.querySelectorAll("[data-chart-toggle]").forEach((input) => {
    input.checked = chartPrefs[input.dataset.chartToggle] !== false;
  });
}

function buildChartPrefs() {
  const list = document.getElementById("chart-prefs");
  if (!list) return;
  CHART_OPTIONS.forEach((opt) => {
    const row = document.createElement("label");
    row.className = "pref-row";
    const copy = document.createElement("span");
    copy.className = "pref-copy";
    const title = document.createElement("strong");
    title.textContent = opt.title;
    const hint = document.createElement("span");
    hint.textContent = opt.hint;
    copy.append(title, hint);
    const sw = document.createElement("span");
    sw.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = chartPrefs[opt.id] !== false;
    input.dataset.chartToggle = opt.id;
    input.setAttribute("role", "switch");
    input.setAttribute("aria-label", opt.title);
    const knob = document.createElement("i");
    sw.append(input, knob);
    row.append(copy, sw);
    input.addEventListener("change", () => saveChartPref(opt.id, input.checked));
    list.appendChild(row);
  });
}

async function loadSettings() {
  try {
    const data = await api("GET", "/settings");
    if (data?.charts) {
      chartPrefs = data.charts;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ charts: chartPrefs }));
    }
  } catch (err) {
    toast(err.message, "error");
  }
  applyChartPrefs();
}

async function saveChartPref(id, on) {
  const previous = chartPrefs[id];
  chartPrefs = { ...chartPrefs, [id]: on };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ charts: chartPrefs }));
  applyChartPrefs();
  if (!document.getElementById("view-home")?.hidden) renderDashboard();
  try {
    const saved = await api("PUT", "/settings", { charts: { [id]: on } });
    if (saved?.charts) chartPrefs = { ...chartPrefs, ...saved.charts };
  } catch (err) {
    chartPrefs = { ...chartPrefs, [id]: previous };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ charts: chartPrefs }));
    applyChartPrefs();
    if (!document.getElementById("view-home")?.hidden) renderDashboard();
    toast(err.message, "error");
  }
}

function setDebtKind(kind) {
  if (debtKind) debtKind.value = kind;
  document.querySelectorAll("#debt-form [data-kind]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.kind === kind);
  });
}

function setDebtPaidFlag(paid) {
  const input = document.getElementById("debt-paid");
  if (input) input.value = paid ? "1" : "0";
  document.querySelectorAll("#debt-form [data-paid]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.paid === (paid ? "1" : "0"));
  });
}

function resetDebtForm() {
  editingDebtId = null;
  debtForm?.reset();
  setDebtKind("credit_card");
  setDebtPaidFlag(false);
  if (debtSubmit) debtSubmit.textContent = "Adicionar dívida";
  closeEntryForm(debtForm);
}

function dueMeta(iso) {
  const day = String(iso || "").slice(0, 10);
  if (!day) return null;
  const diff = Math.round((new Date(`${day}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
  if (diff < 0) {
    const n = Math.abs(diff);
    return { text: `Atrasada há ${n} dia${n === 1 ? "" : "s"}`, tone: "bad" };
  }
  if (diff === 0) return { text: "Vence hoje", tone: "warn" };
  if (diff === 1) return { text: "Vence amanhã", tone: "warn" };
  if (diff <= 7) return { text: `Vence em ${diff} dias`, tone: "warn" };
  return null;
}

function debtAction(icon, label, onClick, extra = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `action-btn ${extra}`.trim();
  btn.innerHTML = icon;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", onClick);
  return btn;
}

const MONTHS_FULL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function debtDay(debt) {
  return debt.due_date ? String(debt.due_date).slice(0, 10) : "";
}

function scheduleBucket(day) {
  if (!day) return "later";
  const now = today();
  if (day < now) return "late";
  const diff = Math.round((new Date(`${day}T12:00:00`) - new Date(`${now}T12:00:00`)) / 86400000);
  const thisMonth = now.slice(0, 7);
  if (day.slice(0, 7) === thisMonth || diff <= 7) return "soon";
  if (day.slice(0, 7) === shiftMonth(thisMonth, 1)) return "next";
  return "later";
}

function debtBucket(debt) {
  if (debt.paid_at) return "paid";
  return scheduleBucket(debtDay(debt));
}

function debtStatus(debt, bucket) {
  if (bucket === "paid") return { text: "Paga", tone: "good" };
  const info = dueMeta(debt.due_date);
  if (info) return info;
  if (bucket === "late") return { text: "Atrasada", tone: "bad" };
  return null;
}

function debtCard(debt, bucket) {
  const paid = bucket === "paid";
  const article = document.createElement("article");
  article.className = `debt-item is-${bucket}`;
  const info = debtStatus(debt, bucket);

  const top = document.createElement("div");
  top.className = "debt-top";
  const main = document.createElement("div");
  const title = document.createElement("div");
  title.className = "debt-title";
  title.textContent = debt.name;
  const meta = document.createElement("p");
  meta.className = "debt-meta";
  const parts = [];
  if (paid && debt.paid_at) parts.push(formatDate(paidDay(debt)));
  else if (debt.due_date) parts.push(formatDate(debtDay(debt)));
  if (debt.notes) parts.push(debt.notes);
  meta.textContent = parts.join(" · ") || (paid ? "Quitada" : "Sem vencimento");
  const tags = document.createElement("div");
  tags.className = "debt-tags";
  const kind = document.createElement("span");
  kind.className = "tag";
  kind.textContent = DEBT_KINDS[debt.kind] || "Outro";
  tags.appendChild(kind);
  if (info) {
    const tag = document.createElement("span");
    tag.className = `tag ${info.tone}`.trim();
    tag.textContent = info.text;
    tags.appendChild(tag);
  }
  main.append(title, meta, tags);
  const amount = document.createElement("p");
  amount.className = "debt-amount";
  amount.textContent = money(debt.amount);
  top.append(main, amount);

  const actions = document.createElement("div");
  actions.className = "row-actions";
  if (paid) {
    const reopen = document.createElement("button");
    reopen.type = "button";
    reopen.className = "btn secondary";
    reopen.textContent = "Reabrir";
    reopen.addEventListener("click", () => setDebtPaid(debt, false));
    actions.appendChild(reopen);
  } else {
    const pay = document.createElement("button");
    pay.type = "button";
    pay.className = "pay-btn";
    pay.textContent = "Marcar como paga";
    pay.addEventListener("click", () => setDebtPaid(debt, true));
    actions.append(pay, debtAction(ICON.edit, "Editar", () => startEditDebt(debt)));
  }
  actions.appendChild(debtAction(ICON.trash, "Excluir", () => removeDebt(debt), "delete"));
  article.append(top, actions);
  return article;
}

function sumDebts(items) {
  return items.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
}

function monthLabel(key) {
  if (!key) return "Sem data";
  const [year, month] = key.split("-");
  const name = MONTHS_LONG[Number(month) - 1] || key;
  return `${name} ${year}`;
}

function renderMonthStack(hostId, items, dayOf, cardFor, options = {}) {
  const host = typeof hostId === "string" ? document.getElementById(hostId) : hostId;
  if (!host) return;
  const groups = new Map();
  items.forEach((item) => {
    const key = String(dayOf(item) || "").slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  const now = today().slice(0, 7);
  const keys = [...groups.keys()].sort((a, b) => {
    const left = a || "9999";
    const right = b || "9999";
    return options.history ? right.localeCompare(left) : left.localeCompare(right);
  });
  const scope = options.fold || (typeof hostId === "string" ? hostId : "months");
  host.replaceChildren(...keys.map((key) => {
    const list = groups.get(key).sort((a, b) => String(dayOf(a)).localeCompare(String(dayOf(b))));
    const section = document.createElement("div");
    section.className = "sheet-card debt-group";
    if (!options.history && key && key < now) section.classList.add("is-late-month");
    else if (!options.history && key === now) section.classList.add("is-current-month");
    const header = document.createElement("div");
    header.className = "chart-header";
    const title = document.createElement("div");
    title.className = "month-title";
    const heading = document.createElement("h2");
    heading.textContent = monthLabel(key);
    title.appendChild(heading);
    if (!options.history && key && key < now) {
      const flag = document.createElement("span");
      flag.className = "month-flag";
      flag.textContent = "Atrasado";
      title.appendChild(flag);
    } else if (!options.history && key === now) {
      const flag = document.createElement("span");
      flag.className = "month-flag";
      flag.textContent = "Este mês";
      title.appendChild(flag);
    }
    const sum = document.createElement("span");
    sum.className = "muted";
    sum.textContent = money(sumDebts(list));
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "icon-btn paid-toggle";
    toggle.addEventListener("click", () => {
      const storage = foldStorageKey(scope, key);
      const open = localStorage.getItem(storage) !== "closed";
      localStorage.setItem(storage, open ? "closed" : "open");
      applyMonthFold(section, scope, key);
    });
    const tools = document.createElement("div");
    tools.className = "paid-tools";
    tools.append(sum, toggle);
    header.append(title, tools);
    const body = document.createElement("div");
    body.className = "debt-list";
    body.append(...list.map((item) => cardFor(item)));
    section.append(header, body);
    applyMonthFold(section, scope, key);
    return section;
  }));
}

function foldStorageKey(scope, key) {
  return `bg-finance-fold-${scope}-${key || "none"}`;
}

function applyMonthFold(section, scope, key) {
  const btn = section.querySelector(".paid-toggle");
  const body = section.querySelector(".debt-list");
  if (!btn || !body) return;
  const open = localStorage.getItem(foldStorageKey(scope, key)) !== "closed";
  section.classList.toggle("is-collapsed", !open);
  body.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.setAttribute("aria-label", open ? "Esconder" : "Mostrar");
  btn.innerHTML = open ? ICON.eyeOff : ICON.eye;
}

function paidDay(debt) {
  return debt.paid_at ? String(debt.paid_at).slice(0, 10) : debtDay(debt);
}

function applyPaidFold(card) {
  const btn = card?.querySelector("[data-paid-toggle]");
  const body = card?.querySelector("[data-paid-body]");
  if (!btn || !body) return;
  const open = localStorage.getItem(`bg-finance-fold-${btn.dataset.paidToggle}`) === "open";
  card.classList.toggle("is-collapsed", !open);
  body.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.setAttribute("aria-label", open ? "Esconder pagas" : "Mostrar pagas");
  btn.innerHTML = open ? ICON.eyeOff : ICON.eye;
}

function renderPaidSection(cardId, items, dayOf, cardFor) {
  const card = document.getElementById(cardId);
  const body = card?.querySelector("[data-paid-body]");
  const sum = card?.querySelector("[data-sum]");
  if (!card || !body) return;
  card.hidden = items.length === 0;
  renderMonthStack(body, items, dayOf, cardFor, { history: true, fold: `${cardId}-months` });
  if (sum) sum.textContent = items.length ? money(sumDebts(items)) : "";
  applyPaidFold(card);
}

function bindPaidFolds() {
  document.querySelectorAll("[data-paid-toggle]").forEach((btn) => {
    applyPaidFold(btn.closest(".sheet-card"));
    btn.addEventListener("click", () => {
      const key = `bg-finance-fold-${btn.dataset.paidToggle}`;
      localStorage.setItem(key, localStorage.getItem(key) === "open" ? "closed" : "open");
      applyPaidFold(btn.closest(".sheet-card"));
    });
  });
}

function fillDebtGroup(id, items, bucket) {
  const card = document.getElementById(id);
  const list = card?.querySelector(".debt-list");
  const sum = card?.querySelector("[data-sum]");
  if (!card || !list) return;
  const ordered = [...items].sort((a, b) => debtDay(a).localeCompare(debtDay(b)));
  card.hidden = ordered.length === 0;
  list.replaceChildren(...ordered.map((debt) => debtCard(debt, bucket)));
  if (sum) sum.textContent = ordered.length ? money(sumDebts(ordered)) : "";
}

function renderDebts() {
  const groups = { late: [], soon: [], next: [], later: [], paid: [] };
  debts.forEach((debt) => groups[debtBucket(debt)].push(debt));
  const open = debts.filter((debt) => !debt.paid_at);
  const openEl = document.getElementById("debt-open");
  const hint = document.getElementById("debt-open-hint");
  const lateEl = document.getElementById("debt-late");
  const lateHint = document.getElementById("debt-late-hint");
  const soonEl = document.getElementById("debt-soon");
  const soonHint = document.getElementById("debt-soon-hint");
  const monthEl = document.getElementById("debt-month");
  const monthHint = document.getElementById("debt-month-hint");
  const badge = document.getElementById("debt-badge");
  const empty = document.getElementById("debt-empty");
  const nextName = MONTHS_FULL[Number(shiftMonth(today().slice(0, 7), 1).slice(5)) - 1];
  if (openEl) openEl.textContent = money(sumDebts(open));
  if (hint) hint.textContent = open.length === 1 ? "1 dívida" : open.length ? `${open.length} dívidas` : "Nenhuma dívida";
  if (lateEl) lateEl.textContent = money(sumDebts(groups.late));
  if (lateHint) lateHint.textContent = groups.late.length === 1 ? "1 atrasada" : groups.late.length ? `${groups.late.length} atrasadas` : "Nada atrasado";
  if (soonEl) soonEl.textContent = money(sumDebts(groups.soon));
  if (soonHint) soonHint.textContent = groups.soon.length === 1 ? "1 neste mês" : groups.soon.length ? `${groups.soon.length} neste mês` : "Nada neste mês";
  if (monthEl) monthEl.textContent = money(sumDebts(groups.next));
  if (monthHint) monthHint.textContent = groups.next.length ? nextName : "Nada no mês que vem";
  const urgent = groups.late.length + groups.soon.length;
  if (badge) {
    badge.hidden = urgent === 0;
    badge.textContent = urgent > 9 ? "9+" : String(urgent);
  }
  renderMonthStack("debt-months", open, debtDay, (debt) => debtCard(debt, debtBucket(debt)));
  renderPaidSection("debt-paid-card", groups.paid, paidDay, (debt) => debtCard(debt, "paid"));
  if (empty) empty.hidden = open.length > 0;
}

async function loadDebts() {
  try {
    debts = await api("GET", "/debts");
  } catch (err) {
    debts = [];
    toast(err.message, "error");
  }
  renderDebts();
}

function debtPayloadFrom(debt, paid) {
  return {
    name: debt.name,
    kind: debt.kind,
    amount: Number(debt.amount),
    due_date: debt.due_date ? String(debt.due_date).slice(0, 10) : "",
    notes: debt.notes || "",
    paid,
  };
}

function askPaidOnPanel(debt) {
  return askDialog({
    title: "Adicionar no painel?",
    text: `Lançar ${money(debt.amount)} de ${debt.name} como despesa no painel?`,
    okLabel: "Sim, lançar",
    cancelLabel: "Não",
  });
}

async function addDebtAsExpense(debt) {
  await api("POST", "/transactions", {
    description: debt.name,
    amount: Number(debt.amount),
    type: "expense",
    category: "Outros",
    date: today(),
  });
  chartsNeedDraw = true;
  await loadTransactions();
}

async function setDebtPaid(debt, paid) {
  let onPanel = false;
  if (paid) {
    const choice = await askPaidOnPanel(debt);
    if (choice === null) return;
    onPanel = choice === true;
  }
  try {
    await api("PUT", `/debts/${debt.id}`, debtPayloadFrom(debt, paid));
    if (onPanel) await addDebtAsExpense(debt);
    await loadDebts();
    toast(onPanel ? "Paga e lançada no painel" : paid ? "Dívida marcada como paga" : "Dívida reaberta");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function removeDebt(debt) {
  try {
    await api("DELETE", `/debts/${debt.id}`);
    if (editingDebtId === debt.id) resetDebtForm();
    await loadDebts();
    toast(`"${debt.name}" excluída`, "info", {
      label: "Desfazer",
      run: async () => {
        try {
          await api("POST", "/debts", debtPayloadFrom(debt, Boolean(debt.paid_at)));
          await loadDebts();
        } catch (err) {
          toast(err.message, "error");
        }
      },
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

function startEditDebt(debt) {
  editingDebtId = debt.id;
  debtName.value = debt.name;
  debtAmount.value = Number(debt.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  debtDue.value = debt.due_date ? String(debt.due_date).slice(0, 10) : "";
  debtNotes.value = debt.notes || "";
  setDebtKind(DEBT_KINDS[debt.kind] ? debt.kind : "other");
  setDebtPaidFlag(Boolean(debt.paid_at));
  debtSubmit.textContent = "Salvar";
  openEntryForm(debtForm, debtName);
}

function bindDebts() {
  document.querySelectorAll("#debt-form [data-kind]").forEach((btn) => {
    btn.addEventListener("click", () => setDebtKind(btn.dataset.kind));
  });
  document.querySelectorAll("#debt-form [data-paid]").forEach((btn) => {
    btn.addEventListener("click", () => setDebtPaidFlag(btn.dataset.paid === "1"));
  });
  debtCancel?.addEventListener("click", resetDebtForm);
  debtForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = debtName.value.trim();
    const amount = parseAmount(debtAmount.value);
    if (!name) return toast("Informe o nome da dívida", "error");
    if (Number.isNaN(amount)) {
      debtAmount.focus();
      return toast("Valor inválido. Use por exemplo 49,90", "error");
    }
    const paid = document.getElementById("debt-paid")?.value === "1";
    const wasPaid = Boolean(debts.find((d) => d.id === editingDebtId)?.paid_at);
    let onPanel = false;
    if (paid && !wasPaid) {
      const choice = await askPaidOnPanel({ name, amount });
      if (choice === null) return;
      onPanel = choice === true;
    }
    const body = {
      name,
      amount,
      due_date: debtDue.value,
      kind: debtKind.value || "credit_card",
      notes: debtNotes.value.trim(),
      paid,
    };
    debtSubmit.disabled = true;
    try {
      if (editingDebtId) await api("PUT", `/debts/${editingDebtId}`, body);
      else await api("POST", "/debts", body);
      if (onPanel) await addDebtAsExpense({ name, amount });
      toast(onPanel ? "Paga e lançada no painel" : editingDebtId ? "Dívida atualizada" : "Dívida adicionada");
      resetDebtForm();
      await loadDebts();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      debtSubmit.disabled = false;
    }
  });
}

const SUB_CYCLES = { monthly: "Mensal", yearly: "Anual" };
let subscriptions = [];
let editingSubId = null;

const subForm = document.getElementById("sub-form");
const subName = document.getElementById("sub-name");
const subAmount = document.getElementById("sub-amount");
const subDue = document.getElementById("sub-due");
const subCycle = document.getElementById("sub-cycle");
const subNotes = document.getElementById("sub-notes");
const subSubmit = document.getElementById("sub-submit");
const subCancel = document.getElementById("sub-cancel");

function addCycle(iso, cycle) {
  const base = String(iso || today()).slice(0, 10);
  const [y, m, d] = base.split("-").map(Number);
  const months = cycle === "yearly" ? 12 : 1;
  const target = new Date(y, m - 1 + months, 1, 12);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, last));
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
}

function setSubCycle(cycle) {
  if (subCycle) subCycle.value = cycle;
  document.querySelectorAll("#sub-form [data-cycle]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.cycle === cycle);
  });
}

function setSubPay(pay) {
  const input = document.getElementById("sub-pay");
  const value = pay === "card" ? "card" : "other";
  if (input) input.value = value;
  document.querySelectorAll("#sub-form [data-pay]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.pay === value);
  });
}

function setSubActive(active) {
  const input = document.getElementById("sub-active");
  if (input) input.value = active ? "1" : "0";
  document.querySelectorAll("#sub-form [data-active]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.active === (active ? "1" : "0"));
  });
}

function resetSubForm() {
  editingSubId = null;
  subForm?.reset();
  setSubCycle("monthly");
  setSubActive(true);
  setSubPay("other");
  if (subSubmit) subSubmit.textContent = "Adicionar assinatura";
  closeEntryForm(subForm);
}

function subDay(sub) {
  return sub.due_date ? String(sub.due_date).slice(0, 10) : "";
}

function subBucket(sub) {
  if (sub.active === false) return "off";
  return scheduleBucket(subDay(sub));
}

function monthlyAmount(sub) {
  const amount = Number(sub.amount || 0);
  return sub.cycle === "yearly" ? amount / 12 : amount;
}

function subPayloadFrom(sub, extra = {}) {
  return {
    name: extra.name ?? sub.name,
    cycle: extra.cycle ?? sub.cycle ?? "monthly",
    amount: Number(extra.amount ?? sub.amount),
    due_date: extra.due_date !== undefined ? extra.due_date : subDay(sub),
    notes: extra.notes !== undefined ? extra.notes : (sub.notes || ""),
    active: extra.active !== undefined ? extra.active : sub.active !== false,
    pay_with: extra.pay_with ?? (sub.pay_with === "card" ? "card" : "other"),
    billed_due: extra.billed_due !== undefined ? extra.billed_due : (sub.billed_due ? String(sub.billed_due).slice(0, 10) : ""),
    paid_dates: extra.paid_dates ?? paidDateList(sub),
  };
}

function paidDateList(sub) {
  const raw = sub?.paid_dates;
  const list = Array.isArray(raw) ? raw : typeof raw === "string" && raw ? safePaidDates(raw) : [];
  return list.map((day) => String(day).slice(0, 10)).filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day));
}

function safePaidDates(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function paidSubEntries() {
  const rows = [];
  subscriptions.forEach((sub) => {
    paidDateList(sub).forEach((day) => {
      rows.push({ ...sub, due_date: day, paid_on: day });
    });
  });
  return rows;
}

function subCard(sub, bucket) {
  const off = bucket === "off";
  const paid = bucket === "paid";
  const article = document.createElement("article");
  article.className = `debt-item is-${paid ? "paid" : off ? "off" : bucket}`;
  const info = paid ? { text: "Paga", tone: "good" } : off ? { text: "Cancelada", tone: "" } : debtStatus(sub, bucket);

  const top = document.createElement("div");
  top.className = "debt-top";
  const main = document.createElement("div");
  const title = document.createElement("div");
  title.className = "debt-title";
  title.textContent = sub.name;
  const meta = document.createElement("p");
  meta.className = "debt-meta";
  const parts = [];
  if (sub.due_date) parts.push(formatDate(subDay(sub)));
  if (sub.notes) parts.push(sub.notes);
  meta.textContent = parts.join(" · ") || (paid ? "Paga" : off ? "Cancelada" : "Sem data");
  const tags = document.createElement("div");
  tags.className = "debt-tags";
  const cycle = document.createElement("span");
  cycle.className = "tag";
  cycle.textContent = SUB_CYCLES[sub.cycle] || "Mensal";
  tags.appendChild(cycle);
  const pay = document.createElement("span");
  pay.className = sub.pay_with === "card" ? "tag card" : "tag";
  pay.textContent = sub.pay_with === "card" ? "Cartão" : "Outro";
  tags.appendChild(pay);
  if (info) {
    const tag = document.createElement("span");
    tag.className = `tag ${info.tone}`.trim();
    tag.textContent = info.text;
    tags.appendChild(tag);
  }
  main.append(title, meta, tags);
  const amount = document.createElement("p");
  amount.className = "debt-amount";
  amount.textContent = money(sub.amount);
  top.append(main, amount);

  const actions = document.createElement("div");
  actions.className = "row-actions";
  if (paid) {
    article.append(top);
    return article;
  }
  if (off) {
    const reopen = document.createElement("button");
    reopen.type = "button";
    reopen.className = "btn secondary";
    reopen.textContent = "Reativar";
    reopen.addEventListener("click", () => setSubActiveState(sub, true));
    actions.appendChild(reopen);
  } else {
    const pay = document.createElement("button");
    pay.type = "button";
    pay.className = "pay-btn";
    pay.textContent = "Marcar como paga";
    pay.addEventListener("click", () => registerSubPayment(sub));
    actions.append(pay, debtAction(ICON.edit, "Editar", () => startEditSub(sub)));
  }
  actions.appendChild(debtAction(ICON.trash, "Excluir", () => removeSub(sub), "delete"));
  article.append(top, actions);
  return article;
}

function fillSubGroup(id, items, bucket) {
  const card = document.getElementById(id);
  const list = card?.querySelector(".debt-list");
  const sum = card?.querySelector("[data-sum]");
  if (!card || !list) return;
  const ordered = [...items].sort((a, b) => subDay(a).localeCompare(subDay(b)));
  card.hidden = ordered.length === 0;
  list.replaceChildren(...ordered.map((sub) => subCard(sub, bucket)));
  if (sum) sum.textContent = ordered.length ? money(sumDebts(ordered)) : "";
}

function renderSubscriptions() {
  const groups = { late: [], soon: [], next: [], later: [], off: [] };
  subscriptions.forEach((sub) => groups[subBucket(sub)].push(sub));
  const active = subscriptions.filter((sub) => sub.active !== false);
  const openEl = document.getElementById("sub-open");
  const hint = document.getElementById("sub-open-hint");
  const lateEl = document.getElementById("sub-late");
  const lateHint = document.getElementById("sub-late-hint");
  const soonEl = document.getElementById("sub-soon");
  const soonHint = document.getElementById("sub-soon-hint");
  const monthEl = document.getElementById("sub-month");
  const monthHint = document.getElementById("sub-month-hint");
  const badge = document.getElementById("sub-badge");
  const empty = document.getElementById("sub-empty");
  const nextName = MONTHS_FULL[Number(shiftMonth(today().slice(0, 7), 1).slice(5)) - 1];
  const monthTotal = active.reduce((sum, sub) => sum + monthlyAmount(sub), 0);
  if (openEl) openEl.textContent = money(monthTotal);
  if (hint) hint.textContent = active.length === 1 ? "1 ativa" : active.length ? `${active.length} ativas` : "Nenhuma assinatura";
  if (lateEl) lateEl.textContent = money(sumDebts(groups.late));
  if (lateHint) lateHint.textContent = groups.late.length === 1 ? "1 atrasada" : groups.late.length ? `${groups.late.length} atrasadas` : "Nada atrasado";
  if (soonEl) soonEl.textContent = money(sumDebts(groups.soon));
  if (soonHint) soonHint.textContent = groups.soon.length === 1 ? "1 neste mês" : groups.soon.length ? `${groups.soon.length} neste mês` : "Nada neste mês";
  if (monthEl) monthEl.textContent = money(sumDebts(groups.next));
  if (monthHint) monthHint.textContent = groups.next.length ? nextName : "Nada no mês que vem";
  const urgent = groups.late.length + groups.soon.length;
  if (badge) {
    badge.hidden = urgent === 0;
    badge.textContent = urgent > 9 ? "9+" : String(urgent);
  }
  renderMonthStack("sub-months", active, subDay, (sub) => subCard(sub, subBucket(sub)));
  renderPaidSection("sub-paid-card", paidSubEntries(), subDay, (sub) => subCard(sub, "paid"));
  fillSubGroup("sub-off-card", groups.off, "off");
  if (empty) empty.hidden = active.length > 0;
}

async function loadSubscriptions() {
  try {
    subscriptions = await api("GET", "/subscriptions");
  } catch (err) {
    subscriptions = [];
    toast(err.message, "error");
  }
  renderSubscriptions();
}

async function addSubExpense(sub) {
  await api("POST", "/transactions", {
    description: sub.name,
    amount: Number(sub.amount),
    type: "expense",
    category: "Assinaturas",
    date: today(),
  });
  chartsNeedDraw = true;
  await loadTransactions();
}

function invoiceName(month) {
  return `Fatura do cartão ${month.slice(5)}/${month.slice(0, 4)}`;
}

function chargeMonth(sub) {
  const day = subDay(sub);
  return day ? day.slice(0, 7) : shiftMonth(today().slice(0, 7), 1);
}

function nextInvoiceTarget(sub) {
  const month = chargeMonth(sub);
  const open = debts.filter((debt) => debt.kind === "credit_card" && !debt.paid_at);
  const invoices = open.filter((debt) => /fatura/i.test(debt.name));
  const pool = invoices.length ? invoices : open;
  const named = pool.find((debt) => debt.name === invoiceName(month));
  if (named) return { debt: named, month, fresh: false };
  const upcoming = [...pool].sort((a, b) => (debtDay(a) || "9999").localeCompare(debtDay(b) || "9999"));
  const pick = upcoming.find((debt) => !debtDay(debt) || debtDay(debt) >= today()) || upcoming[0];
  if (pick) return { debt: pick, month: debtDay(pick).slice(0, 7) || month, fresh: false };
  return { debt: null, month, fresh: true };
}

function cycleBilled(sub, due) {
  return Boolean(due) && String(sub?.billed_due || "").slice(0, 10) === due && sub?.pay_with === "card";
}

function invoicePhrase(month) {
  const name = MONTHS_LONG[Number(month.slice(5)) - 1] || month;
  return `${name.toLowerCase()} de ${month.slice(0, 4)}`;
}

function askOnInvoice(sub, target) {
  const phrase = invoicePhrase(target.month);
  const label = target.debt?.name || "próxima fatura";
  const text = target.fresh
    ? `Criar a fatura de ${phrase} com ${money(sub.amount)} de ${sub.name}?`
    : `Adicionar ${money(sub.amount)} de ${sub.name} na ${label} de ${phrase}?`;
  return askDialog({
    title: "Colocar na fatura?",
    text,
    okLabel: "Sim, colocar",
    cancelLabel: "Não",
  });
}

async function addSubToInvoice(sub) {
  if (!debts.length) {
    try {
      debts = await api("GET", "/debts");
    } catch {
      debts = [];
    }
  }
  const target = nextInvoiceTarget(sub);
  const amount = Math.round(Number(sub.amount) * 100) / 100;
  if (target.debt) {
    const nextAmount = Math.round((Number(target.debt.amount) + amount) * 100) / 100;
    await api("PUT", `/debts/${target.debt.id}`, debtPayloadFrom({ ...target.debt, amount: nextAmount }, false));
    return target.debt.name;
  }
  const name = invoiceName(target.month);
  await api("POST", "/debts", {
    name,
    kind: "credit_card",
    amount,
    due_date: subDay(sub) || `${target.month}-10`,
    notes: sub.name,
    paid: false,
  });
  return name;
}

async function registerSubPayment(sub) {
  const card = sub.pay_with === "card";
  const due = subDay(sub);
  let onInvoice = false;
  let onPanel = false;
  if (card) {
    if (!cycleBilled(sub, due)) {
      const choice = await askOnInvoice(sub, nextInvoiceTarget(sub));
      if (choice === null) return;
      onInvoice = choice === true;
    }
  } else {
    const choice = await askPaidOnPanel(sub);
    if (choice === null) return;
    onPanel = choice === true;
  }
  const nextDue = addCycle(sub.due_date, sub.cycle);
  const paidDates = paidDateList(sub);
  const stamp = due || today();
  if (!paidDates.includes(stamp)) paidDates.push(stamp);
  try {
    let invoiceNameUsed = "";
    if (onInvoice) invoiceNameUsed = await addSubToInvoice(sub);
    await api("PUT", `/subscriptions/${sub.id}`, subPayloadFrom(sub, {
      due_date: nextDue,
      active: true,
      billed_due: card ? due : "",
      paid_dates: paidDates,
    }));
    if (onPanel) await addSubExpense(sub);
    await loadSubscriptions();
    if (onInvoice) await loadDebts();
    const when = formatDate(nextDue);
    if (onInvoice) toast(`Paga e somada em ${invoiceNameUsed}. Próxima em ${when}`);
    else if (onPanel) toast(`Paga e lançada no painel. Próxima em ${when}`);
    else toast(`Cobrança marcada como paga. Próxima em ${when}`);
  } catch (err) {
    toast(err.message, "error");
  }
}

async function setSubActiveState(sub, active) {
  try {
    await api("PUT", `/subscriptions/${sub.id}`, subPayloadFrom(sub, { active }));
    await loadSubscriptions();
    toast(active ? "Assinatura reativada" : "Assinatura cancelada");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function removeSub(sub) {
  try {
    await api("DELETE", `/subscriptions/${sub.id}`);
    if (editingSubId === sub.id) resetSubForm();
    await loadSubscriptions();
    toast(`"${sub.name}" excluída`, "info", {
      label: "Desfazer",
      run: async () => {
        try {
          await api("POST", "/subscriptions", subPayloadFrom(sub));
          await loadSubscriptions();
        } catch (err) {
          toast(err.message, "error");
        }
      },
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

function startEditSub(sub) {
  editingSubId = sub.id;
  subName.value = sub.name;
  subAmount.value = Number(sub.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  subDue.value = subDay(sub);
  subNotes.value = sub.notes || "";
  setSubCycle(SUB_CYCLES[sub.cycle] ? sub.cycle : "monthly");
  setSubActive(sub.active !== false);
  setSubPay(sub.pay_with);
  subSubmit.textContent = "Salvar";
  openEntryForm(subForm, subName);
}

function bindSubscriptions() {
  document.querySelectorAll("#sub-form [data-cycle]").forEach((btn) => {
    btn.addEventListener("click", () => setSubCycle(btn.dataset.cycle));
  });
  document.querySelectorAll("#sub-form [data-active]").forEach((btn) => {
    btn.addEventListener("click", () => setSubActive(btn.dataset.active === "1"));
  });
  document.querySelectorAll("#sub-form [data-pay]").forEach((btn) => {
    btn.addEventListener("click", () => setSubPay(btn.dataset.pay));
  });
  subCancel?.addEventListener("click", resetSubForm);
  subForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = subName.value.trim();
    const amount = parseAmount(subAmount.value);
    if (!name) return toast("Informe o nome da assinatura", "error");
    if (Number.isNaN(amount)) {
      subAmount.focus();
      return toast("Valor inválido. Use por exemplo 49,90", "error");
    }
    const previous = subscriptions.find((item) => item.id === editingSubId);
    const payWith = document.getElementById("sub-pay")?.value === "card" ? "card" : "other";
    const active = document.getElementById("sub-active")?.value !== "0";
    let onInvoice = false;
    if (payWith === "card" && active && !cycleBilled({ ...previous, pay_with: "card" }, subDue.value)) {
      const choice = await askOnInvoice({ name, amount, due_date: subDue.value }, nextInvoiceTarget({ due_date: subDue.value, amount, name }));
      if (choice === null) return;
      onInvoice = choice === true;
    }
    const body = {
      name,
      amount,
      due_date: subDue.value,
      cycle: subCycle.value || "monthly",
      notes: subNotes.value.trim(),
      active,
      pay_with: payWith,
      billed_due: onInvoice ? subDue.value : (payWith === "card" ? (previous?.billed_due || "") : ""),
      paid_dates: paidDateList(previous || {}),
    };
    subSubmit.disabled = true;
    try {
      let invoiceNameUsed = "";
      if (onInvoice) invoiceNameUsed = await addSubToInvoice({ name, amount, due_date: subDue.value });
      if (editingSubId) await api("PUT", `/subscriptions/${editingSubId}`, body);
      else await api("POST", "/subscriptions", body);
      if (onInvoice) await loadDebts();
      toast(onInvoice ? `Assinatura salva e somada em ${invoiceNameUsed}` : editingSubId ? "Assinatura atualizada" : "Assinatura adicionada");
      resetSubForm();
      await loadSubscriptions();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      subSubmit.disabled = false;
    }
  });
}

let telegramState = { configured: false, linked: false, username: "" };

function paintTelegram() {
  const status = document.getElementById("telegram-status");
  const link = document.getElementById("telegram-link");
  const unlink = document.getElementById("telegram-unlink");
  if (!status || !link || !unlink) return;
  if (!telegramState.configured) {
    status.textContent = "O bot ainda não está ativo neste servidor.";
    link.hidden = true;
    unlink.hidden = true;
    return;
  }
  const bot = telegramState.username ? `@${telegramState.username}` : "o bot";
  status.textContent = telegramState.linked
    ? `Conta ligada a ${bot}. Dá para lançar gasto e ver o saldo por lá.`
    : `Gere um código e envie para ${bot} com /vincular.`;
  link.hidden = false;
  unlink.hidden = !telegramState.linked;
}

async function loadTelegram() {
  const status = document.getElementById("telegram-status");
  if (!status) return;
  try {
    telegramState = await api("GET", "/telegram");
    paintTelegram();
  } catch (err) {
    status.textContent = err.message;
  }
}

function bindTelegram() {
  document.getElementById("telegram-link")?.addEventListener("click", async () => {
    const button = document.getElementById("telegram-link");
    button.disabled = true;
    try {
      const data = await api("POST", "/telegram/link");
      const box = document.getElementById("telegram-code");
      document.getElementById("telegram-code-value").textContent = data.code;
      const bot = data.username ? `@${data.username}` : "o bot";
      document.getElementById("telegram-code-hint").textContent = `No Telegram, abra ${bot} e envie /vincular ${data.code}. Vale por 15 minutos.`;
      box.hidden = false;
    } catch (err) {
      toast(err.message, "error");
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById("telegram-unlink")?.addEventListener("click", async () => {
    try {
      await api("DELETE", "/telegram");
      telegramState = { ...telegramState, linked: false };
      document.getElementById("telegram-code").hidden = true;
      paintTelegram();
      toast("Telegram desvinculado");
    } catch (err) {
      toast(err.message, "error");
    }
  });
}

const SAVE_CATS = {
  investment: ["Renda fixa", "Ações", "Fundos", "Tesouro", "Cripto", "Previdência", "Outros"],
  piggy: ["Viagem", "Casa", "Carro", "Estudos", "Presentes", "Emergência", "Dinheiro guardado", "Outros"],
};
let savings = [];
let editingSaveId = null;

const saveForm = document.getElementById("save-form");
const saveName = document.getElementById("save-name");
const saveAmount = document.getElementById("save-amount");
const saveKind = document.getElementById("save-kind");
const saveCategorySelect = document.getElementById("save-category");
const saveNotes = document.getElementById("save-notes");
const saveSubmit = document.getElementById("save-submit");
const saveCancel = document.getElementById("save-cancel");

function fillSaveCategory(kind, selected) {
  if (!saveCategorySelect) return;
  const cats = SAVE_CATS[kind] || SAVE_CATS.investment;
  saveCategorySelect.innerHTML = cats.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  if (selected && cats.includes(selected)) saveCategorySelect.value = selected;
}

function setSaveKind(kind) {
  const next = SAVE_CATS[kind] ? kind : "investment";
  if (saveKind) saveKind.value = next;
  document.querySelectorAll("#save-form [data-save-kind]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.saveKind === next);
  });
  const current = saveCategorySelect?.selectedOptions[0]?.textContent;
  fillSaveCategory(next, SAVE_CATS[next].includes(current) ? current : SAVE_CATS[next][0]);
  const piggy = next === "piggy";
  const editingPiggy = piggy && !!editingSaveId;
  if (saveAmount) {
    saveAmount.disabled = editingPiggy;
    saveAmount.required = !piggy;
  }
  const amountLabel = document.querySelector("label[for='save-amount']");
  if (amountLabel) amountLabel.textContent = piggy && !editingSaveId ? "Primeiro valor" : "Valor guardado";
}

function resetSaveForm() {
  editingSaveId = null;
  saveForm?.reset();
  setSaveKind("investment");
  if (saveSubmit) saveSubmit.textContent = "Adicionar";
  closeEntryForm(saveForm);
}

const openPiggies = new Set();

function savePayloadFrom(item) {
  const payload = {
    name: item.name,
    kind: item.kind,
    category: item.category,
    amount: Number(item.amount),
    notes: item.notes || "",
  };
  if (item.kind === "piggy") {
    payload.entries = (item.entries || []).map((entry) => ({
      amount: Number(entry.amount),
      deposited_at: String(entry.deposited_at).slice(0, 10),
    }));
  }
  return payload;
}

function togglePiggy(id) {
  if (openPiggies.has(id)) openPiggies.delete(id);
  else openPiggies.add(id);
  renderSavings();
}

async function removePiggyEntry(item, entry) {
  try {
    await api("DELETE", `/savings/${item.id}/entries/${entry.id}`);
    openPiggies.add(item.id);
    await loadSavings();
    toast("Depósito excluído", "info", {
      label: "Desfazer",
      run: async () => {
        try {
          await api("POST", `/savings/${item.id}/entries`, {
            amount: Number(entry.amount),
            deposited_at: String(entry.deposited_at).slice(0, 10),
          });
          openPiggies.add(item.id);
          await loadSavings();
        } catch (err) {
          toast(err.message, "error");
        }
      },
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

async function addPiggyMoney(item, amountInput, dateInput, button) {
  const amount = parseAmount(amountInput.value);
  const day = dateInput.value || today();
  if (Number.isNaN(amount) || amount <= 0) {
    amountInput.focus();
    return toast("Valor inválido. Use por exemplo 49,90", "error");
  }
  if (piggyTwin(item, amount, day)) {
    const again = await askSameEntry(item.name, amount, day, "neste cofrinho");
    if (again !== true) return;
  }
  const choice = await askMirrorSaved(item.name, amount, false);
  if (choice === null) return;
  if (choice && panelTwin(item.name, amount, day)) {
    const again = await askSameEntry(item.name, amount, day, "no painel");
    if (again !== true) return;
  }
  button.disabled = true;
  try {
    await api("POST", `/savings/${item.id}/entries`, { amount, deposited_at: day });
    if (choice) {
      linkingSaved = true;
      try {
        await putExpenseFromSaved(item.name, amount, day);
      } finally {
        linkingSaved = false;
      }
    }
    openPiggies.add(item.id);
    amountInput.value = "";
    toast(`${money(amount)} colocado em ${item.name}`);
    await loadSavings();
  } catch (err) {
    toast(err.message, "error");
  } finally {
    button.disabled = false;
  }
}

function piggyLog(item) {
  const box = document.createElement("div");
  box.className = "piggy-log";
  const entries = [...(item.entries || [])].sort(
    (a, b) => String(b.deposited_at).localeCompare(String(a.deposited_at)) || Number(b.id) - Number(a.id)
  );
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "muted piggy-empty";
    empty.textContent = "Nenhum depósito ainda.";
    box.appendChild(empty);
  } else {
    entries.forEach((entry) => {
      const line = document.createElement("div");
      line.className = "piggy-entry";
      const when = document.createElement("span");
      when.textContent = formatDate(String(entry.deposited_at).slice(0, 10));
      const value = document.createElement("strong");
      value.textContent = money(entry.amount);
      line.append(when, value, debtAction(ICON.trash, "Excluir depósito", () => removePiggyEntry(item, entry), "delete"));
      box.appendChild(line);
    });
  }

  const form = document.createElement("div");
  form.className = "piggy-add";
  const amountField = document.createElement("div");
  amountField.className = "field";
  const amountLabel = document.createElement("label");
  amountLabel.textContent = "Valor";
  const amountInput = document.createElement("input");
  amountInput.type = "text";
  amountInput.inputMode = "decimal";
  amountInput.placeholder = "0,00";
  amountInput.autocomplete = "off";
  amountField.append(amountLabel, amountInput);

  const dateField = document.createElement("div");
  dateField.className = "field";
  const dateLabel = document.createElement("label");
  dateLabel.textContent = "Data";
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.value = today();
  dateField.append(dateLabel, dateInput);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn primary";
  button.textContent = "Colocar no cofrinho";
  button.addEventListener("click", () => addPiggyMoney(item, amountInput, dateInput, button));
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn secondary";
  cancel.textContent = "Cancelar";
  const actions = document.createElement("div");
  actions.className = "entry-actions";
  actions.append(cancel, button);
  form.append(amountField, dateField, actions);
  form.hidden = true;

  const launch = document.createElement("button");
  launch.type = "button";
  launch.className = "add-launch add-launch-compact";
  launch.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Colocar dinheiro</span>`;
  launch.addEventListener("click", () => {
    launch.hidden = true;
    form.hidden = false;
    amountInput.focus();
  });
  cancel.addEventListener("click", () => {
    amountInput.value = "";
    dateInput.value = today();
    form.hidden = true;
    launch.hidden = false;
  });
  box.append(launch, form);
  return box;
}

function saveRow(item) {
  const row = document.createElement("div");
  row.className = "save-row";
  const open = item.kind === "piggy" && openPiggies.has(item.id);
  if (open) row.classList.add("is-open");
  const main = document.createElement("div");
  const title = document.createElement(item.kind === "piggy" ? "button" : "div");
  title.className = item.kind === "piggy" ? "debt-title piggy-open" : "debt-title";
  title.textContent = item.name;
  if (item.kind === "piggy") {
    title.type = "button";
    title.setAttribute("aria-expanded", open ? "true" : "false");
    title.addEventListener("click", () => togglePiggy(item.id));
  }
  main.appendChild(title);
  if (item.notes) {
    const meta = document.createElement("p");
    meta.className = "debt-meta";
    meta.textContent = item.notes;
    main.appendChild(meta);
  }
  const amount = document.createElement("p");
  amount.className = "debt-amount";
  amount.textContent = money(item.amount);
  const actions = document.createElement("div");
  actions.className = "row-actions";
  if (item.kind === "piggy") {
    const toggle = debtAction(ICON.chevron, open ? "Esconder depósitos" : "Ver depósitos", () => togglePiggy(item.id), "piggy-toggle");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    actions.appendChild(toggle);
  }
  actions.append(
    debtAction(ICON.edit, "Editar", () => startEditSave(item)),
    debtAction(ICON.trash, "Excluir", () => removeSave(item), "delete")
  );
  row.append(main, amount, actions);
  if (open) row.appendChild(piggyLog(item));
  return row;
}

function saveCategoryCard(category, items) {
  const card = document.createElement("article");
  card.className = "save-cat";
  card.style.setProperty("--c", catColor(category));
  const top = document.createElement("div");
  top.className = "save-cat-top";
  const title = document.createElement("h3");
  title.textContent = category;
  const sum = document.createElement("p");
  sum.textContent = money(sumDebts(items));
  top.append(title, sum);
  const list = document.createElement("div");
  list.className = "save-items";
  list.append(...items.map(saveRow));
  card.append(top, list);
  return card;
}

function renderSaveKind(kind, title) {
  const items = savings.filter((item) => item.kind === kind);
  if (!items.length) return null;
  const section = document.createElement("div");
  section.className = "sheet-card debt-group";
  const header = document.createElement("div");
  header.className = "chart-header";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const sum = document.createElement("span");
  sum.className = "muted";
  sum.textContent = money(sumDebts(items));
  header.append(heading, sum);
  const grid = document.createElement("div");
  grid.className = "save-items";
  const order = SAVE_CATS[kind];
  const names = [...new Set(items.map((item) => item.category))];
  names.sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  names.forEach((category) => {
    grid.appendChild(saveCategoryCard(category, items.filter((item) => item.category === category)));
  });
  section.append(header, grid);
  return section;
}

function renderSavings() {
  const invest = savings.filter((item) => item.kind === "investment");
  const piggy = savings.filter((item) => item.kind === "piggy");
  const totalEl = document.getElementById("save-total");
  const totalHint = document.getElementById("save-total-hint");
  const investEl = document.getElementById("save-invest");
  const investHint = document.getElementById("save-invest-hint");
  const piggyEl = document.getElementById("save-piggy");
  const piggyHint = document.getElementById("save-piggy-hint");
  const empty = document.getElementById("save-empty");
  const host = document.getElementById("save-groups");
  if (totalEl) totalEl.textContent = money(sumDebts(savings));
  if (totalHint) totalHint.textContent = savings.length === 1 ? "1 item" : savings.length ? `${savings.length} itens` : "Nada guardado";
  if (investEl) investEl.textContent = money(sumDebts(invest));
  if (investHint) {
    const cats = new Set(invest.map((item) => item.category)).size;
    investHint.textContent = invest.length ? `${cats} categoria${cats === 1 ? "" : "s"}` : "Nenhum investimento";
  }
  if (piggyEl) piggyEl.textContent = money(sumDebts(piggy));
  if (piggyHint) {
    const cats = new Set(piggy.map((item) => item.category)).size;
    piggyHint.textContent = piggy.length ? `${cats} categoria${cats === 1 ? "" : "s"}` : "Nenhum cofrinho";
  }
  if (empty) empty.hidden = savings.length > 0;
  if (host) {
    host.replaceChildren(...[renderSaveKind("investment", "Investimentos"), renderSaveKind("piggy", "Cofrinhos")].filter(Boolean));
  }
}

async function loadSavings() {
  try {
    savings = await api("GET", "/savings");
  } catch (err) {
    savings = [];
    toast(err.message, "error");
  }
  renderSavings();
}

async function removeSave(item) {
  try {
    await api("DELETE", `/savings/${item.id}`);
    if (editingSaveId === item.id) resetSaveForm();
    await loadSavings();
    toast(`"${item.name}" excluído`, "info", {
      label: "Desfazer",
      run: async () => {
        try {
          await api("POST", "/savings", savePayloadFrom(item));
          await loadSavings();
        } catch (err) {
          toast(err.message, "error");
        }
      },
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

function startEditSave(item) {
  editingSaveId = item.id;
  saveName.value = item.name;
  saveAmount.value = Number(item.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  saveNotes.value = item.notes || "";
  setSaveKind(item.kind);
  fillSaveCategory(item.kind, item.category);
  saveSubmit.textContent = "Salvar";
  openEntryForm(saveForm, saveName);
}

function bindSavings() {
  document.querySelectorAll("#save-form [data-save-kind]").forEach((btn) => {
    btn.addEventListener("click", () => setSaveKind(btn.dataset.saveKind));
  });
  saveCancel?.addEventListener("click", resetSaveForm);
  setSaveKind("investment");
  saveForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = saveName.value.trim();
    const kind = saveKind.value || "investment";
    const creatingPiggy = kind === "piggy" && !editingSaveId;
    let amount = parseAmount(saveAmount.value);
    if (creatingPiggy && !String(saveAmount.value || "").trim()) amount = 0;
    if (!name) return toast("Informe o nome", "error");
    if (Number.isNaN(amount) || amount < 0 || (kind !== "piggy" && amount <= 0)) {
      saveAmount.focus();
      return toast("Valor inválido. Use por exemplo 49,90", "error");
    }
    const body = {
      name,
      amount,
      kind,
      category: saveCategorySelect.value,
      notes: saveNotes.value.trim(),
    };
    const previous = editingSaveId ? savings.find((item) => item.id === editingSaveId) : null;
    const editingPiggy = previous?.kind === "piggy" && kind === "piggy";
    const added = editingPiggy ? 0 : previous ? Math.max(0, amount - Number(previous.amount)) : amount;
    if (!editingSaveId && kind === "piggy" && amount > 0) body.deposited_at = today();
    let mirror = false;
    const addedAmount = Math.round(added * 100) / 100;
    const addedDay = body.deposited_at || today();
    if (!linkingSaved && added > 0.009) {
      const choice = await askMirrorSaved(name, addedAmount, false);
      if (choice === null) return;
      mirror = choice === true;
      if (mirror && panelTwin(name, addedAmount, addedDay)) {
        const again = await askSameEntry(name, addedAmount, addedDay, "no painel");
        if (again !== true) return;
      }
    }
    saveSubmit.disabled = true;
    try {
      const saved = editingSaveId
        ? await api("PUT", `/savings/${editingSaveId}`, body)
        : await api("POST", "/savings", body);
      if (saved?.kind === "piggy") openPiggies.add(saved.id);
      if (mirror) {
        linkingSaved = true;
        try {
          await putExpenseFromSaved(name, addedAmount, addedDay);
        } finally {
          linkingSaved = false;
        }
      }
      toast(editingSaveId ? "Atualizado" : "Adicionado");
      resetSaveForm();
      await loadSavings();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      saveSubmit.disabled = false;
    }
  });
}

(async function init() {
  if (monthFilter && !monthFilter.value) monthFilter.value = today().slice(0, 7);
  enhanceControls();
  buildChartPrefs();
  applyChartPrefs();
  bindEntryForms();
  bindNavigation();
  bindDebts();
  bindSubscriptions();
  bindPaidFolds();
  bindSavings();
  bindTelegram();
  const start = viewFromHash();
  if (start !== "home") showView(start, false);
  if (previewMode) allTransactions = demoTransactions();
  if (!document.getElementById("view-home")?.hidden) renderDashboard();
  await loadCategories();
  await loadSettings();
  await Promise.all([loadTransactions(), loadDebts(), loadSubscriptions(), loadSavings()]);
})();

/* ---------- controles customizados ---------- */

function enhanceSelect(select, { colorize = false } = {}) {
  if (!select || select.dataset.enhanced) return;
  select.dataset.enhanced = "1";
  select.classList.add("native-field");
  const wrap = document.createElement("div");
  wrap.className = "menu-select";
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "menu-select-btn";
  const menu = document.createElement("div");
  menu.className = "menu-select-list";
  wrap.append(btn, menu);

  const dotColor = (opt) => {
    if (!colorize || !opt.value) return "";
    return catColor(opt.textContent);
  };

  function paint() {
    const current = select.selectedOptions[0];
    const color = current ? dotColor(current) : "";
    btn.innerHTML = `<span class="menu-select-value">${color ? `<span class="menu-dot" style="--c:${color}"></span>` : ""}<span></span></span>${ICON.chevron}`;
    btn.querySelector(".menu-select-value > span:last-child").textContent = current ? current.textContent : "Selecionar";
    menu.innerHTML = "";
    [...select.options].forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "menu-select-item" + (opt.selected ? " is-active" : "");
      const dot = document.createElement("span");
      dot.className = "menu-dot";
      const c = dotColor(opt);
      if (c) dot.style.setProperty("--c", c);
      const label = document.createElement("span");
      label.textContent = opt.textContent;
      item.append(dot, label);
      item.addEventListener("click", () => {
        select.value = opt.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        wrap.classList.remove("open");
        paint();
      });
      menu.appendChild(item);
    });
  }

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    document.querySelectorAll(".menu-select.open, .month-picker.open").forEach((el) => {
      if (el !== wrap) el.classList.remove("open");
    });
    wrap.classList.toggle("open");
  });

  new MutationObserver(paint).observe(select, { childList: true });
  select.addEventListener("change", paint);
  paint();
}

function enhanceMonth(input) {
  if (!input || input.dataset.enhanced) return;
  input.dataset.enhanced = "1";
  input.classList.add("native-field");
  const wrap = document.createElement("div");
  wrap.className = "month-picker";
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "menu-select-btn";
  const panel = document.createElement("div");
  panel.className = "month-panel";
  wrap.append(btn, panel);

  let viewYear = Number((input.value || today().slice(0, 7)).slice(0, 4));

  function buttonLabel() {
    if (!input.value) return "Todos os meses";
    const [year, month] = input.value.split("-");
    return `${MONTHS_LONG[Number(month) - 1]} ${year}`;
  }

  function paint() {
    if (input.value) viewYear = Number(input.value.slice(0, 4));
    btn.innerHTML = `<span class="month-label">${ICON.calendar}<span>${buttonLabel()}</span></span>${ICON.chevron}`;
    renderPanel();
  }

  function renderPanel() {
    panel.innerHTML = "";
    const head = document.createElement("div");
    head.className = "month-head";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "icon-btn";
    prev.textContent = "‹";
    prev.addEventListener("click", (event) => {
      event.stopPropagation();
      viewYear -= 1;
      renderPanel();
    });
    const year = document.createElement("strong");
    year.textContent = String(viewYear);
    const next = document.createElement("button");
    next.type = "button";
    next.className = "icon-btn";
    next.textContent = "›";
    next.addEventListener("click", (event) => {
      event.stopPropagation();
      viewYear += 1;
      renderPanel();
    });
    head.append(prev, year, next);

    const nowMonth = today().slice(0, 7);
    const withData = new Set(allTransactions.map((t) => txDate(t).slice(0, 7)));
    const grid = document.createElement("div");
    grid.className = "month-grid";
    MONTHS_PT.forEach((name, index) => {
      const value = `${viewYear}-${pad(index + 1)}`;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className =
        "month-cell" +
        (input.value === value ? " is-active" : "") +
        (value === nowMonth ? " is-current" : "") +
        (withData.has(value) ? " has-data" : "");
      cell.textContent = name;
      cell.addEventListener("click", () => {
        input.value = value;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        wrap.classList.remove("open");
      });
      grid.appendChild(cell);
    });

    const all = document.createElement("button");
    all.type = "button";
    all.className = "month-all";
    all.textContent = "Todos os meses";
    all.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("change", { bubbles: true }));
      wrap.classList.remove("open");
    });
    panel.append(head, grid, all);
  }

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    document.querySelectorAll(".menu-select.open, .month-picker.open").forEach((el) => {
      if (el !== wrap) el.classList.remove("open");
    });
    if (!wrap.classList.contains("open")) renderPanel();
    wrap.classList.toggle("open");
  });
  input.addEventListener("change", paint);
  paint();
}

function enhanceControls() {
  enhanceSelect(categorySelect, { colorize: true });
  enhanceSelect(categoryFilter, { colorize: true });
  enhanceSelect(typeFilter);
  enhanceSelect(editCategory, { colorize: true });
  enhanceSelect(chartMode);
  enhanceSelect(saveCategorySelect, { colorize: true });
  enhanceSelect(mobileSort);
  enhanceMonth(monthFilter);
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".month-panel")) return;
  document.querySelectorAll(".menu-select.open, .month-picker.open").forEach((el) => el.classList.remove("open"));
});

document.addEventListener("bg-theme", () => {
  if (document.getElementById("chartFlow")) renderDashboard();
});
