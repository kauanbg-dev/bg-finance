const PREVIEW_FLAG = "bg-preview";
const previewRequested = new URLSearchParams(location.search).get("preview") === "1" || location.hash === "#preview";
if (previewRequested) {
  try {
    sessionStorage.setItem(PREVIEW_FLAG, "1");
  } catch {
    /* mock local nao depende desse storage */
  }
}
let previewMode = previewRequested;
try {
  previewMode = previewMode || sessionStorage.getItem(PREVIEW_FLAG) === "1";
} catch {
  /* segue com o query string */
}

function fitWatch() {
  const width = Math.min(window.innerWidth, window.visualViewport?.width || window.innerWidth);
  const height = Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight);
  const watch = width <= 430 && height <= 520;
  document.documentElement.classList.toggle("watch", watch);
  document.documentElement.classList.toggle(
    "watch-round",
    watch && (Math.abs(width - height) < 48 || window.matchMedia("(shape: round)").matches)
  );
}
fitWatch();
window.addEventListener("resize", fitWatch);
window.visualViewport?.addEventListener("resize", fitWatch);

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
  up: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  grip: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="9" cy="7" r="1.6"/><circle cx="15" cy="7" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="17" r="1.6"/><circle cx="15" cy="17" r="1.6"/></svg>',
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

function wipeLocalAccount() {
  localStorage.removeItem("token");
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("bg-avatar:")) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* login nao depende desse cache */
  }
}

async function leaveSession() {
  try {
    await fetch("/auth/logout", { method: "POST", credentials: "include", cache: "no-store" });
  } catch {
    /* segue para o login mesmo se o servidor nao responder */
  }
  wipeLocalAccount();
  window.location.replace("login.html");
}

logoutBtn?.addEventListener("click", () => {
  leaveSession();
});

/* ---------- feedback ---------- */

function friendlyError(err, fallback = "Não foi possível completar a ação. Tente de novo.") {
  const raw = String(err?.message ?? err ?? "").trim();
  if (!raw) return fallback;
  if (
    /cannot read propert/i.test(raw)
    || /is not a function/i.test(raw)
    || /unexpected token/i.test(raw)
    || /undefined is not/i.test(raw)
    || /failed to fetch|networkerror|load failed/i.test(raw)
    || /^(typeerror|referenceerror|syntaxerror|error):/i.test(raw)
  ) {
    return fallback;
  }
  return raw;
}

function toast(message, kind = "success", action) {
  if (!message || message.silent || message === "Sessão expirada") return;
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  const text = document.createElement("span");
  text.textContent = kind === "error" ? friendlyError(message?.message ?? message) : message;
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

function handleAuth(response) {
  if (response.status === 401 || response.status === 403) {
    wipeLocalAccount();
    window.location.replace("login.html");
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
  seedPreviewCards();
  const soon = shiftDay(today(), 3);
  const late = shiftDay(today(), -4);
  const next = `${shiftMonth(today().slice(0, 7), 1)}-12`;
  const nubank = previewCards.find((card) => card.last4 === "4532");
  const itau = previewCards.find((card) => card.last4 === "8811");
  const openOf = (card) => Math.round(card.charges.filter((charge) => !charge.paid_at).reduce((sum, charge) => sum + Number(charge.amount), 0) * 100) / 100;
  previewDebts = [
    { id: ++previewSeq, name: "Fatura Nubank", kind: "credit_card", card_id: nubank.id, amount: openOf(nubank), due_date: soon, notes: "Fatura do mês", paid_at: null },
    { id: ++previewSeq, name: "Empréstimo pessoal", kind: "loan", amount: 3200, due_date: late, notes: "Parcela 4 de 12", paid_at: null },
    { id: ++previewSeq, name: "Fatura Itaú", kind: "credit_card", card_id: itau.id, amount: openOf(itau), due_date: next, notes: "Fecha no mês que vem", paid_at: null },
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

let previewCards = [];

function seedPreviewCards() {
  if (previewCards.length) return;
  const paid = new Date().toISOString();
  const nubank = ++previewSeq;
  const itau = ++previewSeq;
  previewCards = [
    {
      id: nubank,
      issuer: "Nubank",
      brand: "mastercard",
      last4: "4532",
      color: "#820ad1",
      credit_limit: 8000,
      charges: [
        { id: ++previewSeq, card_id: nubank, description: "Mercado", amount: 186.4, spent_at: shiftDay(today(), -2), paid_at: null },
        { id: ++previewSeq, card_id: nubank, description: "Posto", amount: 220, spent_at: shiftDay(today(), -6), paid_at: null },
        { id: ++previewSeq, card_id: nubank, description: "Farmácia", amount: 64.9, spent_at: shiftDay(today(), -12), paid_at: paid },
      ],
    },
    {
      id: itau,
      issuer: "Itaú",
      brand: "visa",
      last4: "8811",
      color: "#ec7000",
      credit_limit: 5000,
      charges: [
        { id: ++previewSeq, card_id: itau, description: "Restaurante", amount: 92, spent_at: shiftDay(today(), -1), paid_at: null },
        { id: ++previewSeq, card_id: itau, description: "Uber", amount: 34.5, spent_at: shiftDay(today(), -9), paid_at: paid },
      ],
    },
  ];
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
    if (method === "PUT") {
      const nextEmail = body?.email != null ? String(body.email).trim().toLowerCase() : previewProfile.email;
      if (body?.newPassword || nextEmail !== previewProfile.email) {
        if (!body?.currentPassword) throw new Error("Informe a senha atual");
      }
      previewProfile = {
        ...previewProfile,
        ...(body?.name != null ? { name: String(body.name).trim() } : {}),
        ...(body?.email != null ? { email: nextEmail } : {}),
        ...(Object.prototype.hasOwnProperty.call(body || {}, "avatar") ? { avatar: body.avatar || null } : {}),
      };
    }
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
    seedPreviewCards();
    seedPreviewDebts();
    const card = body.source === "card"
      ? previewCards.find((item) => String(item.id) === String(body.card_id))
      : null;
    if (body.source === "card" && !card) throw new Error("Escolha o cartao da fatura");
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
      if (body.source === "card") {
        if (type !== "expense") {
          skipped += 1;
          continue;
        }
        const exists = (card.charges || []).some(
          (c) => c.description === description && Number(c.amount) === amount && String(c.spent_at).slice(0, 10) === day
        );
        if (exists) {
          skipped += 1;
          continue;
        }
        card.charges = card.charges || [];
        card.charges.push({
          id: ++previewSeq,
          card_id: card.id,
          description,
          amount,
          spent_at: day,
          paid_at: null,
        });
        added += 1;
        const month = day.slice(0, 7);
        invoices.set(month, (invoices.get(month) || 0) + amount);
        continue;
      }
      const exists = allTransactions.some(
        (t) => t.description === description && Number(t.amount) === amount && t.type === type && String(t.date).slice(0, 10) === day
      );
      if (exists) {
        skipped += 1;
        continue;
      }
      const createdId = ++previewSeq;
      allTransactions.push({
        id: createdId,
        position: createdId,
        description,
        amount,
        type,
        category_name: row.category || "Outros",
        date: day,
      });
      added += 1;
    }
    for (const [month, total] of invoices) {
      const name = `Fatura ${card.issuer} ${month.slice(5)}/${month.slice(0, 4)}`;
      const current = previewDebts.find((d) => d.name === name && String(d.card_id) === String(card.id) && !d.paid_at);
      const extra = Math.round(total * 100) / 100;
      if (current) current.amount = Math.round((Number(current.amount) + extra) * 100) / 100;
      else {
        previewDebts.unshift({
          id: ++previewSeq,
          name,
          kind: "credit_card",
          card_id: card.id,
          amount: extra,
          due_date: null,
          notes: "Importada da fatura",
          paid_at: null,
        });
      }
    }
    return { added, skipped, debts: invoices.size };
  }
  if (url === "/cards" || url.startsWith("/cards/")) {
    seedPreviewCards();
    const parts = url.split("/").filter(Boolean);
    const card = previewCards.find((item) => String(item.id) === String(parts[1]));
    if (method === "GET" && parts.length === 1) {
      return previewCards.map((item) => ({ ...item, charges: item.charges.map((charge) => ({ ...charge })) }));
    }
    if (method === "POST" && parts.length === 1) {
      const created = {
        id: ++previewSeq,
        issuer: body.issuer,
        brand: body.brand,
        last4: String(body.last4 || "").replace(/\D/g, "").slice(0, 4),
        color: body.color || null,
        credit_limit: Number(body.credit_limit),
        charges: [],
      };
      previewCards.unshift(created);
      return { ...created, charges: [] };
    }
    if (!card) return {};
    if (method === "POST" && parts[2] === "settle") {
      const amount = Number(body.amount);
      const paying = body.paid === true;
      let left = amount;
      const list = (paying
        ? card.charges.filter((charge) => !charge.paid_at)
        : card.charges.filter((charge) => charge.paid_at)
      ).sort((a, b) => {
        if (paying) return String(a.spent_at).localeCompare(String(b.spent_at)) || a.id - b.id;
        return String(b.paid_at).localeCompare(String(a.paid_at)) || b.id - a.id;
      });
      let settled = 0;
      for (const charge of list) {
        const value = Number(charge.amount);
        if (value - left > 0.009) break;
        charge.paid_at = paying ? new Date().toISOString() : null;
        left -= value;
        settled += 1;
      }
      return { settled, amount: Math.round((amount - left) * 100) / 100 };
    }
    if (method === "PUT" && parts.length === 2) {
      Object.assign(card, {
        issuer: body.issuer,
        brand: body.brand,
        last4: String(body.last4 || "").replace(/\D/g, "").slice(0, 4),
        color: body.color || null,
        credit_limit: Number(body.credit_limit),
      });
      return { ...card, charges: card.charges.map((charge) => ({ ...charge })) };
    }
    if (method === "DELETE" && parts.length === 2) {
      previewCards = previewCards.filter((item) => item !== card);
      return { deleted: 1 };
    }
    if (method === "POST" && parts[2] === "settle") {
      const amount = Number(body.amount);
      const paying = body.paid === true;
      let left = amount;
      const list = (paying
        ? card.charges.filter((charge) => !charge.paid_at)
        : card.charges.filter((charge) => charge.paid_at)
      ).sort((a, b) => {
        if (paying) return String(a.spent_at).localeCompare(String(b.spent_at)) || a.id - b.id;
        return String(b.paid_at).localeCompare(String(a.paid_at)) || b.id - a.id;
      });
      let settled = 0;
      for (const charge of list) {
        const value = Number(charge.amount);
        if (value - left > 0.009) break;
        charge.paid_at = paying ? new Date().toISOString() : null;
        left -= value;
        settled += 1;
      }
      return { settled, amount: Math.round((amount - left) * 100) / 100 };
    }
    if (method === "POST" && parts[4] === "place") return { placed: true };
    if (method === "POST" && parts[2] === "charges" && parts.length < 5) {
      const created = {
        id: ++previewSeq,
        card_id: card.id,
        description: body.description,
        amount: Number(body.amount),
        spent_at: body.spent_at,
        paid_at: body.paid ? new Date().toISOString() : null,
      };
      card.charges.unshift(created);
      return { ...created };
    }
    const charge = card.charges.find((item) => String(item.id) === String(parts[3]));
    if (method === "PUT" && charge) {
      Object.assign(charge, {
        description: body.description,
        amount: Number(body.amount),
        spent_at: body.spent_at,
        paid_at: body.paid ? charge.paid_at || new Date().toISOString() : null,
      });
      return { ...charge };
    }
    if (method === "POST" && parts[4] === "place") return { placed: true };
    if (method === "DELETE" && charge) {
      card.charges = card.charges.filter((item) => item !== charge);
      return { deleted: 1 };
    }
    return {};
  }
  if (url === "/debts" || url.startsWith("/debts/")) {
    seedPreviewDebts();
    const id = url.split("/")[2];
    if (method === "GET") return previewDebts.map((d) => ({ ...d }));
    if (method === "POST" && url.split("/")[3] === "place") return { placed: true };
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
    if (method === "POST" && url.split("/")[3] === "place") return { placed: true };
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
    if (method === "POST" && parts[2] === "place") return { placed: true };
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
  if (method === "POST" && (url.split("/")[3] === "move" || url.split("/")[3] === "place")) {
    return { moved: true, placed: true };
  }
  if (method === "GET") return allTransactions.map((t) => ({ ...t }));
  if (method === "POST") {
    const createdId = ++previewSeq;
    allTransactions.push({ ...body, id: createdId, position: createdId, category_name: body.category });
    return { id: createdId };
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
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    cache: "no-store",
  });
  if (handleAuth(response)) {
    const err = new Error("Sessão expirada");
    err.silent = true;
    throw err;
  }
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
let userId = previewMode ? "preview" : "anon";
let avatarKey = `bg-avatar:${userId}`;
let currentUser = previewMode ? { ...previewProfile } : {};

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
  currentUser = { ...currentUser, ...(info || {}) };
  const email = currentUser.email || "";
  const name = (currentUser.name || "").trim() || email.split("@")[0] || "Conta";
  const letter = name.charAt(0).toUpperCase() || "B";
  if (miniEmail) miniEmail.textContent = email;
  if (miniLabel) miniLabel.textContent = name;
  if (accountName) accountName.textContent = name;
  if (accountEmail) accountEmail.textContent = email;
  if (avatarLetter) avatarLetter.textContent = letter;
  if (menuLetter) menuLetter.textContent = letter;
  if (accountBtn) accountBtn.setAttribute("aria-label", `Abrir dados de ${name}`);
  if (accountSince) {
    const since = currentUser.created_at ? sinceLabel(currentUser.created_at) : "";
    accountSince.textContent = since;
    accountSince.hidden = !since;
  }
  paintAvatar(currentUser.avatar || "");
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

if (previewMode) {
  setAccount({
    email: "demo@bgfinance.app",
    name: "Conta demo",
    created_at: previewProfile.created_at,
    avatar: cachedAvatar(),
  });
}

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
  if (event.key !== "Escape") return;
  const profileModal = document.getElementById("profile-modal");
  if (profileModal && !profileModal.classList.contains("hidden")) {
    closeProfileModal();
    return;
  }
  openAccount(false);
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
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(CATEGORY_KEY);
    await leaveSession();
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
  setAccount(saved || { avatar: dataUrl || null });
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

const profileModal = document.getElementById("profile-modal");
const profileForm = document.getElementById("profile-form");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileCurrent = document.getElementById("profile-current");
const profilePassword = document.getElementById("profile-password");
const profilePassword2 = document.getElementById("profile-password2");

function closeProfileModal() {
  profileModal?.classList.add("hidden");
  profileForm?.reset();
}

function openProfileModal() {
  openAccount(false);
  if (profileName) profileName.value = (currentUser.name || "").trim();
  if (profileEmail) profileEmail.value = currentUser.email || "";
  if (profileCurrent) profileCurrent.value = "";
  if (profilePassword) profilePassword.value = "";
  if (profilePassword2) profilePassword2.value = "";
  profileModal?.classList.remove("hidden");
  profileName?.focus();
}

document.getElementById("edit-profile")?.addEventListener("click", openProfileModal);
document.getElementById("edit-profile-settings")?.addEventListener("click", openProfileModal);
document.getElementById("profile-modal-close")?.addEventListener("click", closeProfileModal);
document.getElementById("profile-cancel")?.addEventListener("click", closeProfileModal);
profileModal?.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) closeProfileModal();
});

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = (profileName?.value || "").trim();
  const email = (profileEmail?.value || "").trim().toLowerCase();
  const currentPassword = profileCurrent?.value || "";
  const newPassword = profilePassword?.value || "";
  const confirm = profilePassword2?.value || "";
  if (name.length < 2) {
    toast("Nome precisa ter pelo menos 2 caracteres", "error");
    return;
  }
  if (!email.includes("@")) {
    toast("Digite um e-mail válido", "error");
    return;
  }
  const passwordIssue = newPassword ? passwordProblem(newPassword, { name, email }) : "";
  if (passwordIssue) {
    toast(passwordIssue, "error");
    return;
  }
  if (newPassword && newPassword !== confirm) {
    toast("A confirmação da senha não bate", "error");
    return;
  }
  const emailChanged = email !== String(currentUser.email || "").toLowerCase();
  if ((emailChanged || newPassword) && !currentPassword) {
    toast("Informe a senha atual para trocar e-mail ou senha", "error");
    return;
  }
  try {
    const saved = await api("PUT", "/me", {
      name,
      email,
      ...(emailChanged || newPassword ? { currentPassword } : {}),
      ...(newPassword ? { newPassword } : {}),
    });
    setAccount(saved || { name, email });
    closeProfileModal();
    toast(saved?.pending_email
      ? `Enviamos um link para ${saved.pending_email}. O e-mail só muda depois que você confirmar.`
      : "Cadastro atualizado");
  } catch (err) {
    toast(err.message || "Não foi possível salvar o cadastro", "error");
  }
});

if (previewMode && cachedAvatar()) previewProfile.avatar = cachedAvatar();

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
  if (!select) return;
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
document.getElementById("delete-edit")?.addEventListener("click", () => {
  const current = editingTransaction;
  if (!current) return;
  closeEditModal();
  deleteTransaction(current);
});
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

function txRank(t) {
  const pos = Number(t.position);
  return Number.isFinite(pos) && pos !== 0 ? pos : Number(t.id) || 0;
}

function placeLocal(list, id, beforeId, copyDate, dateKey = "date", dateValue = null) {
  const from = list.findIndex((item) => String(item.id) === String(id));
  if (from < 0) return false;
  const moved = list[from];
  const prevDate = dateKey ? String(moved[dateKey] || "").slice(0, 10) : "";
  let to = beforeId == null || beforeId === "" ? list.length : list.findIndex((item) => String(item.id) === String(beforeId));
  if (to < 0) to = list.length;
  const sameSlot = to === from || to === from + 1;
  if (!sameSlot) {
    list.splice(from, 1);
    if (from < to) to -= 1;
    list.splice(to, 0, moved);
  }
  const idx = list.indexOf(moved);
  const neighbor = list[idx + 1] || list[idx - 1];
  const nextDate = dateValue || (copyDate && neighbor ? neighbor[dateKey] : null);
  if (nextDate) moved[dateKey] = nextDate;
  if (sameSlot && String(moved[dateKey] || "").slice(0, 10) === prevDate) return false;
  list.forEach((item, index) => {
    item.position = (list.length - index) * 1000;
  });
  return true;
}

function dragHandle(label) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "drag-handle";
  btn.title = "Arraste para outro dia";
  btn.setAttribute("aria-label", label || "Arrastar");
  btn.innerHTML = ICON.grip;
  return btn;
}

let dropLineEl = null;

function visibleDragNodes(kind, skip) {
  return [...document.querySelectorAll(`[data-drag="${kind}"]`)]
    .filter((node) => node !== skip && node.getClientRects().length > 0)
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
}

function dropLine() {
  if (!dropLineEl) {
    dropLineEl = document.createElement("div");
    dropLineEl.className = "drop-line";
    dropLineEl.innerHTML = '<span class="drop-line-mark"></span><span class="drop-line-label"></span>';
    document.body.appendChild(dropLineEl);
  }
  return dropLineEl;
}

function hideDropLine() {
  dropLineEl?.classList.remove("is-on");
  document.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
}

function dropDayLabel(iso) {
  if (!iso) return "Soltar aqui";
  const parts = dayParts(iso);
  if (parts.label === "Hoje") return "Mover para hoje";
  if (parts.label === "Ontem") return "Mover para ontem";
  return `Mover para ${parts.label.toLowerCase()} ${parts.num}`;
}

function hitDayCard(y) {
  const cards = [...document.querySelectorAll(".day-card")].filter((card) => card.getClientRects().length);
  for (const card of cards) {
    const box = card.getBoundingClientRect();
    if (y >= box.top - 12 && y <= box.bottom + 12) return card;
  }
  let best = null;
  let bestDist = 72;
  for (const card of cards) {
    const box = card.getBoundingClientRect();
    const dist = y < box.top ? box.top - y : y > box.bottom ? y - box.bottom : 0;
    if (dist < bestDist) {
      bestDist = dist;
      best = card;
    }
  }
  return best;
}

function paintDropLine(anchor, atTop, labelText) {
  const line = dropLine();
  if (!anchor) {
    hideDropLine();
    return;
  }
  const box = anchor.getBoundingClientRect();
  const inset = Math.min(16, Math.max(8, box.width * 0.04));
  line.style.top = `${(atTop ? box.top : box.bottom) - 1}px`;
  line.style.left = `${box.left + inset}px`;
  line.style.width = `${Math.max(box.width - inset * 2, 48)}px`;
  const label = line.querySelector(".drop-line-label");
  if (label) label.textContent = labelText || "Soltar aqui";
  line.classList.toggle("has-label", Boolean(labelText));
  line.classList.add("is-on");
}

function planDrop(kind, skip, y) {
  hideDropLine();
  if (kind === "tx-card" || kind === "tx-row") {
    const card = hitDayCard(y);
    if (card) {
      card.classList.add("is-drop-target");
      const day = card.dataset.day || "";
      const items = [...card.querySelectorAll(`[data-drag="${kind}"]`)].filter((node) => node !== skip && node.getClientRects().length);
      let beforeEl = null;
      for (const node of items) {
        const box = node.getBoundingClientRect();
        if (y < box.top + box.height / 2) {
          beforeEl = node;
          break;
        }
      }
      let beforeId = beforeEl ? beforeEl.dataset.id : null;
      if (!beforeId) {
        const cards = [...document.querySelectorAll(".day-card")];
        const next = cards[cards.indexOf(card) + 1];
        const first = [...(next?.querySelectorAll(`[data-drag="${kind}"]`) || [])].find((node) => node !== skip);
        beforeId = first ? first.dataset.id : null;
      }
      paintDropLine(beforeEl || items[items.length - 1] || card, Boolean(beforeEl || !items.length), dropDayLabel(day));
      return { beforeId, date: day };
    }
  }
  const nodes = visibleDragNodes(kind, skip);
  if (!nodes.length) return { beforeId: null, date: "" };
  let beforeEl = null;
  for (const node of nodes) {
    const box = node.getBoundingClientRect();
    if (y < box.top + box.height / 2) {
      beforeEl = node;
      break;
    }
  }
  const anchor = beforeEl || nodes[nodes.length - 1];
  const day = (beforeEl || anchor).dataset.day || "";
  ((beforeEl || anchor).closest?.(".day-card") || beforeEl || anchor).classList.add("is-drop-target");
  paintDropLine(anchor, Boolean(beforeEl), dropDayLabel(day));
  return { beforeId: beforeEl ? beforeEl.dataset.id : null, date: day };
}

function beforeIdAt(kind, skip, y) {
  const plan = planDrop(kind, skip, y);
  blockDrag.plan = plan;
  return plan?.beforeId ?? null;
}

const blockDrag = {
  press: 0,
  pointerId: null,
  startX: 0,
  startY: 0,
  lastY: 0,
  dragging: false,
  didMove: false,
  ghost: null,
  el: null,
  kind: "",
  onDrop: null,
  plan: null,
};

function stopBlockDrag() {
  clearTimeout(blockDrag.press);
  blockDrag.press = 0;
  blockDrag.pointerId = null;
  blockDrag.dragging = false;
  blockDrag.el?.classList.remove("is-dragging");
  document.body.classList.remove("is-block-dragging");
  blockDrag.ghost?.remove();
  blockDrag.ghost = null;
  blockDrag.el = null;
  blockDrag.onDrop = null;
  blockDrag.plan = null;
  hideDropLine();
}

function liftBlockDrag(event) {
  const el = blockDrag.el;
  if (!el) return;
  blockDrag.dragging = true;
  blockDrag.didMove = false;
  blockDrag.lastY = event.clientY;
  el.classList.add("is-dragging");
  document.body.classList.add("is-block-dragging");
  try {
    el.setPointerCapture(event.pointerId);
  } catch (_) {
    /* ignore */
  }
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  const desc = (el.querySelector(".day-item-desc, .desc-cell")?.textContent || "").trim();
  const amt = (el.querySelector(".day-item-amt, td.amount")?.textContent || "").trim();
  const title = document.createElement("span");
  title.className = "drag-ghost-desc";
  title.textContent = desc || "Lançamento";
  ghost.appendChild(title);
  if (amt) {
    const value = document.createElement("span");
    value.className = "drag-ghost-amt";
    value.textContent = amt;
    ghost.appendChild(value);
  }
  ghost.style.width = `${Math.min(el.getBoundingClientRect().width, 340)}px`;
  document.body.appendChild(ghost);
  ghost.style.left = `${event.clientX - 40}px`;
  ghost.style.top = `${event.clientY - 22}px`;
  blockDrag.ghost = ghost;
  beforeIdAt(blockDrag.kind, el, event.clientY);
}

document.addEventListener("pointermove", (event) => {
  if (event.pointerId !== blockDrag.pointerId) return;
  blockDrag.lastY = event.clientY;
  if (!blockDrag.dragging) {
    if (Math.abs(event.clientX - blockDrag.startX) > 8 || Math.abs(event.clientY - blockDrag.startY) > 8) {
      clearTimeout(blockDrag.press);
      blockDrag.press = 0;
    }
    return;
  }
  event.preventDefault();
  if (Math.abs(event.clientX - blockDrag.startX) > 6 || Math.abs(event.clientY - blockDrag.startY) > 6) blockDrag.didMove = true;
  if (blockDrag.ghost) {
    blockDrag.ghost.style.left = `${event.clientX - 40}px`;
    blockDrag.ghost.style.top = `${event.clientY - 22}px`;
  }
  if (event.clientY < 72) window.scrollBy(0, -18);
  else if (event.clientY > window.innerHeight - 88) window.scrollBy(0, 18);
  beforeIdAt(blockDrag.kind, blockDrag.el, event.clientY);
}, { passive: false });

document.addEventListener("pointerup", (event) => {
  if (blockDrag.pointerId == null || event.pointerId !== blockDrag.pointerId) return;
  const el = blockDrag.el;
  const onDrop = blockDrag.onDrop;
  const kind = blockDrag.kind;
  const y = event.clientY || blockDrag.lastY;
  const plan = blockDrag.dragging ? planDrop(kind, el, y) : null;
  const changedDay = Boolean(plan?.date && el?.dataset.day && plan.date !== el.dataset.day);
  const dropped = blockDrag.dragging && (blockDrag.didMove || changedDay);
  stopBlockDrag();
  if (!dropped || !onDrop) return;
  if (el) el.dataset.dragged = "1";
  onDrop(plan);
});
document.addEventListener("pointercancel", (event) => {
  if (event.pointerId === blockDrag.pointerId) stopBlockDrag();
});

function bindBlockDrag(el, kind, onDrop) {
  el.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("a, input, select, textarea, summary, .pay-btn, .action-btn, .btn, .charge-more, .piggy-open")) return;
    blockDrag.el = el;
    blockDrag.kind = kind;
    blockDrag.onDrop = onDrop;
    blockDrag.startX = event.clientX;
    blockDrag.startY = event.clientY;
    blockDrag.lastY = event.clientY;
    blockDrag.pointerId = event.pointerId;
    blockDrag.didMove = false;
    if (event.target.closest(".drag-handle")) liftBlockDrag(event);
    else blockDrag.press = window.setTimeout(() => liftBlockDrag(event), 320);
  });
  el.addEventListener("click", (event) => {
    if (el.dataset.dragged === "1") {
      event.preventDefault();
      event.stopPropagation();
      delete el.dataset.dragged;
    }
  }, true);
}

function sortTxList(rows) {
  return [...rows].sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (sortKey === "date") {
      va = txDate(a);
      vb = txDate(b);
      if (va === vb) {
        const ra = txRank(a);
        const rb = txRank(b);
        if (ra !== rb) return sortDir === "asc" ? ra - rb : rb - ra;
        return Number(b.id) - Number(a.id);
      }
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
}

function renderTable(rows) {
  const sorted = sortTxList(rows);

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
  const shown = sortKey === "date" ? renderDays(sorted, month) : renderFlat(sorted);
  const remaining = sorted.length - shown;
  showMoreBtn.classList.toggle("hidden", remaining <= 0);
  showMoreBtn.textContent = `Mostrar mais · ${remaining} restante${remaining === 1 ? "" : "s"}`;
}

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function dayParts(iso) {
  const [, monthNum, dayNum] = iso.split("-").map(Number);
  const when = new Date(Number(iso.slice(0, 4)), monthNum - 1, dayNum);
  const label = iso === today() ? "Hoje" : iso === shiftDay(today(), -1) ? "Ontem" : WEEKDAYS[when.getDay()];
  return { num: pad(dayNum), label };
}

function appendSpanRow(className, fill) {
  const head = document.createElement("tr");
  head.className = className;
  const cell = document.createElement("td");
  cell.colSpan = 6;
  fill(cell);
  head.appendChild(cell);
  tbody.appendChild(head);
}

function appendDayCard(iso, ordered, sortedList) {
  const parts = dayParts(iso);
  appendSpanRow("day-card-row", (cell) => {
    const card = document.createElement("div");
    card.className = `day-card${ordered.length > 1 ? " multi" : ""}`;
    card.dataset.day = iso;
    const rail = document.createElement("div");
    rail.className = "day-rail";
    const num = document.createElement("span");
    num.className = "day-num";
    num.textContent = parts.num;
    const label = document.createElement("span");
    label.className = "day-label";
    label.textContent = parts.label;
    rail.append(num, label);
    const list = document.createElement("div");
    list.className = "day-items";
    ordered.forEach((t, index) => {
      const line = document.createElement("div");
      line.className = "day-line";
      if (index > 0) line.classList.add("has-edge");
      line.dataset.drag = "tx-card";
      line.dataset.id = String(t.id);
      line.dataset.day = iso;
      line.appendChild(dragHandle(`Arrastar ${t.description}`));
      bindBlockDrag(line, "tx-card", (beforeId) => placeTransaction(t, beforeId));
      const row = document.createElement("button");
      row.type = "button";
      row.className = "day-item";
      const meta = document.createElement("span");
      meta.className = "day-item-meta";
      const desc = document.createElement("span");
      desc.className = "day-item-desc";
      desc.textContent = t.description;
      const chip = document.createElement("span");
      chip.className = "cat-chip day-item-cat";
      const category = inferCategory(t);
      chip.style.setProperty("--c", catColor(category));
      chip.textContent = category;
      meta.append(desc, chip);
      const amt = document.createElement("span");
      amt.className = `day-item-amt ${t.type === "income" ? "income" : "expense"}`;
      amt.textContent = `${t.type === "expense" ? "− " : "+ "}${money(t.amount)}`;
      row.append(meta, amt);
      row.addEventListener("click", () => openEditModal(t));
      const actions = document.createElement("div");
      actions.className = "day-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "action-btn edit";
      editBtn.title = "Editar";
      editBtn.setAttribute("aria-label", `Editar ${t.description}`);
      editBtn.innerHTML = ICON.edit;
      editBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openEditModal(t);
      });
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "action-btn delete";
      delBtn.title = "Excluir";
      delBtn.setAttribute("aria-label", `Excluir ${t.description}`);
      delBtn.innerHTML = ICON.trash;
      delBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteTransaction(t);
      });
      actions.append(editBtn, delBtn);
      line.append(row, actions);
      list.appendChild(line);
    });
    card.append(rail, list);
    cell.appendChild(card);
  });
}

function renderDays(sorted, month) {
  const byDay = new Map();
  sorted.forEach((t) => {
    const day = txDate(t);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(t);
  });
  let shown = 0;
  let lastMonth = "";
  for (const [day, items] of byDay) {
    if (shown >= visibleCount) break;
    const rowMonth = day.slice(0, 7);
    if (!month && rowMonth !== lastMonth) {
      lastMonth = rowMonth;
      appendSpanRow("month-row", (cell) => {
        cell.textContent = `${MONTHS_LONG[Number(rowMonth.slice(5)) - 1]} ${rowMonth.slice(0, 4)}`;
      });
    }
    const ordered = items;
    appendDayCard(day, ordered, sorted);
    ordered.forEach((t, index) => {
      const classes = [];
      if (index === 0) classes.push("day-start");
      if (index === ordered.length - 1) classes.push("day-end");
      appendTxRow(t, true, classes, index === 0 ? ordered.length : -1, sorted);
    });
    appendSpanRow("day-gap-row", (cell) => {
      cell.setAttribute("aria-hidden", "true");
    });
    shown += items.length;
  }
  return shown;
}

function renderFlat(sorted) {
  sorted.slice(0, visibleCount).forEach((t) => appendTxRow(t, false, [], 0, sorted));
  return Math.min(sorted.length, visibleCount);
}

async function confirmDayMove(t, toDay) {
  const fromDay = txDate(t);
  if (!toDay || toDay === fromDay) return true;
  const dest = dropDayLabel(toDay).replace(/^Mover para /, "");
  const ok = await askDialog({
    title: "Mudar o dia?",
    text: `Deseja mover “${t.description}” para ${dest}?`,
    okLabel: "Sim, mudar",
    cancelLabel: "Não",
  });
  return ok === true;
}

async function placeTransaction(t, plan) {
  const beforeId = plan && typeof plan === "object" ? plan.beforeId : plan;
  const date = plan && typeof plan === "object" ? plan.date : null;
  const fromDay = txDate(t);
  if (!(await confirmDayMove(t, date))) return;
  if (!placeLocal(sortTxList(allTransactions), t.id, beforeId, true, "date", date || null)) return;
  const toDay = txDate(t);
  renderDashboard();
  if (fromDay !== toDay) toast(dropDayLabel(toDay).replace(/^Mover/, "Movido"));
  try {
    await api("POST", `/transactions/${t.id}/place`, { before_id: beforeId ?? null, date: toDay });
  } catch (err) {
    toast(err.message, "error");
    await loadTransactions();
  }
}

async function moveTransaction(t, dir) {
  const group = sortTxList(filteredRows());
  const index = group.findIndex((item) => String(item.id) === String(t.id));
  const other = dir === "up" ? group[index - 1] : group[index + 1];
  if (index < 0 || !other) return;
  if (!(await confirmDayMove(t, txDate(other)))) return;
  const a = txRank(t);
  const b = txRank(other);
  const dateA = t.date;
  t.date = other.date;
  other.date = dateA;
  t.position = b === a ? b + (dir === "up" ? 1 : -1) : b;
  other.position = a;
  renderDashboard();
  try {
    await api("POST", `/transactions/${t.id}/move`, { dir });
  } catch (err) {
    toast(err.message, "error");
    await loadTransactions();
  }
}

function appendTxRow(t, inDay, classes = [], dateSpan = 0, dayGroup = []) {
    const tr = document.createElement("tr");
    if (inDay) tr.classList.add("in-day");
    classes.forEach((name) => tr.classList.add(name));
    const category = inferCategory(t);
    const dateTd = document.createElement("td");
    dateTd.className = "date-cell";
    const [year, monthNum, dayNum] = txDate(t).split("-");
    const dateShort = document.createElement("span");
    dateShort.className = "date-short";
    const dateFull = document.createElement("span");
    dateFull.className = "date-full";
    dateFull.textContent = `${dayNum}/${monthNum}/${year}`;
    if (inDay) {
      const parts = dayParts(txDate(t));
      dateShort.textContent = parts.num;
      const weekday = document.createElement("span");
      weekday.className = "date-wd";
      weekday.textContent = parts.label;
      dateTd.append(dateShort, weekday);
      if (dateSpan > 1) dateTd.rowSpan = dateSpan;
    } else {
      dateShort.textContent = `${dayNum}/${monthNum}`;
      dateTd.append(dateShort, dateFull);
    }
    if (dateSpan !== -1) tr.appendChild(dateTd);
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
    tr.append(descTd, catTd);
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
    actions.append(dragHandle(`Arrastar ${t.description}`), editBtn, delBtn);
    actTd.appendChild(actions);
    tr.appendChild(actTd);
    tr.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (!window.matchMedia("(max-width: 719px)").matches) return;
      openEditModal(t);
    });
    tr.dataset.drag = "tx-row";
    tr.dataset.id = String(t.id);
    tr.dataset.day = txDate(t);
    bindBlockDrag(tr, "tx-row", (beforeId) => placeTransaction(t, beforeId));
    tbody.appendChild(tr);
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

let chartLib = null;
function loadChartLib() {
  if (typeof Chart !== "undefined") return Promise.resolve();
  if (chartLib) return chartLib;
  chartLib = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "chart.umd.min.js";
    script.onload = resolve;
    script.onerror = () => {
      chartLib = null;
      reject(new Error("Não foi possível carregar os gráficos"));
    };
    document.head.appendChild(script);
  });
  return chartLib;
}

function updateCharts(rows, income, expense) {
  if (document.getElementById("view-home")?.hidden) {
    chartsNeedDraw = true;
    return;
  }
  chartsNeedDraw = false;
  if (typeof Chart === "undefined") {
    loadChartLib()
      .then(() => {
        if (!chartsFoldOpen()) return;
        const next = filteredRows();
        const sum = totals(next);
        updateCharts(next, sum.income, sum.expense);
      })
      .catch(() => {});
    return;
  }
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

function chartsFoldOpen() {
  return localStorage.getItem("bg-finance-fold-charts") === "open";
}

function applyChartsFold() {
  const card = document.getElementById("charts-fold");
  const btn = document.getElementById("charts-toggle");
  const body = document.getElementById("charts-body");
  if (!btn || !body) return;
  const open = chartsFoldOpen();
  card?.classList.toggle("is-collapsed", !open);
  body.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.setAttribute("aria-label", open ? "Esconder gráficos" : "Mostrar gráficos");
  btn.innerHTML = `${open ? ICON.eyeOff : ICON.eye}<span>${open ? "Esconder" : "Mostrar"}</span>`;
}

function renderDashboard() {
  const rows = filteredRows();
  const { income, expense } = totals(rows);
  renderCards(rows, income, expense);
  renderTable(rows);
  if (chartsFoldOpen()) updateCharts(rows, income, expense);
  renderPivot(rows);
}

/* ---------- carregamento ---------- */

function demoTransactions() {
  const base = today().slice(0, 7);
  const items = [];
  let id = 1;
  const add = (monthsAgo, day, description, amount, type, category) => {
    const ym = shiftMonth(base, -monthsAgo);
    const n = id++;
    items.push({ id: n, position: n, description, amount, type, category_name: category, date: `${ym}-${pad(day)}` });
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
    add(0, 5, "Café", 18.5, "expense", "Alimentação");
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
  } catch {
    allTransactions = [];
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

const filterToggle = document.getElementById("filter-toggle");
const filterExtra = document.getElementById("filter-extra");
const filterActions = document.getElementById("filter-actions");

function paintFilterToggle() {
  if (!filterToggle) return;
  const count = (typeFilter?.value ? 1 : 0) + (categoryFilter?.value ? 1 : 0);
  filterToggle.textContent = count ? `Filtros · ${count}` : "Filtros";
  filterToggle.classList.toggle("is-on", count > 0);
}

function setFilterPanel(open) {
  if (filterExtra) filterExtra.hidden = !open;
  if (filterActions) filterActions.hidden = !open;
  filterToggle?.setAttribute("aria-expanded", open ? "true" : "false");
}

function onTypeFilter() {
  paintFilterToggle();
  applyFilters();
}

filterToggle?.addEventListener("click", () => setFilterPanel(Boolean(filterExtra?.hidden)));
monthFilter?.addEventListener("change", applyFilters);
typeFilter?.addEventListener("change", onTypeFilter);
categoryFilter?.addEventListener("change", onTypeFilter);
searchFilter?.addEventListener("input", debounce(applyFilters, 200));
paintFilterToggle();
applyChartsFold();
document.getElementById("charts-toggle")?.addEventListener("click", () => {
  const open = chartsFoldOpen();
  localStorage.setItem("bg-finance-fold-charts", open ? "closed" : "open");
  applyChartsFold();
  if (!open) renderDashboard();
});
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

function exportCsv() {
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
}

exportBtn?.addEventListener("click", exportCsv);
document.getElementById("export-csv-settings")?.addEventListener("click", exportCsv);

const importHint = document.getElementById("import-hint");
const statementFile = document.getElementById("statement-file");
let importSource = "account";

function paintImportSource() {
  const field = document.getElementById("import-card-field");
  if (field) field.hidden = importSource !== "card";
  if (importHint) {
    importHint.textContent = importSource === "card"
      ? "Compras entram no extrato do cartão escolhido e somam na fatura do mês."
      : "Extrato da conta. Valor positivo vira receita e negativo vira despesa.";
  }
}

document.querySelectorAll("#import-source [data-source]").forEach((btn) => {
  btn.addEventListener("click", () => {
    importSource = btn.dataset.source;
    document.querySelectorAll("#import-source [data-source]").forEach((el) => {
      el.classList.toggle("active", el === btn);
    });
    paintImportSource();
  });
});
paintImportSource();

function fillImportCards() {
  const select = document.getElementById("import-card");
  if (!select) return;
  const current = select.value;
  select.replaceChildren();
  if (!wallet.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Cadastre um cartão primeiro";
    select.append(opt);
    return;
  }
  wallet.forEach((card) => {
    const opt = document.createElement("option");
    opt.value = String(card.id);
    opt.textContent = `${card.issuer} •••• ${card.last4}`;
    select.append(opt);
  });
  if (wallet.some((card) => String(card.id) === current)) select.value = current;
  else if (selectedCardId) select.value = String(selectedCardId);
}

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
    const payload = { source: importSource, rows };
    if (importSource === "card") {
      const cardId = Number(document.getElementById("import-card")?.value);
      if (!Number.isInteger(cardId) || cardId <= 0) return toast("Escolha o cartão da fatura", "error");
      payload.card_id = cardId;
      selectedCardId = cardId;
    }
    const result = await api("POST", "/imports/statement", payload);
    await Promise.all([loadTransactions(), loadDebts(), loadCards()]);
    const debtNote = result.debts ? ` e ${result.debts} fatura${result.debts === 1 ? "" : "s"}` : "";
    toast(`${result.added} lançamento${result.added === 1 ? "" : "s"} importado${result.added === 1 ? "" : "s"}${debtNote}`);
    if (importSource === "card") showView("debts");
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

const txModal = document.getElementById("tx-modal");
const sheetBody = document.getElementById("sheet-body");
const sheetTitle = document.getElementById("tx-modal-title");

function sheetTitleFor(form) {
  const id = form?.id;
  if (id === "transaction-form") return "Novo lançamento";
  if (id === "debt-form") return editingDebtId ? "Editar dívida" : "Nova dívida";
  if (id === "card-form") return editingCardId ? "Editar cartão" : "Novo cartão";
  if (id === "charge-form") return editingCharge ? "Editar extrato" : "Lançar no extrato";
  if (id === "sub-form") return editingSubId ? "Editar assinatura" : "Nova assinatura";
  if (id === "save-form") return editingSaveId ? "Editar" : "Adicionar";
  return "Adicionar";
}

function parkForm(form) {
  if (!form) return;
  form.classList.add("hidden");
  if (form.id === "transaction-form") return;
  const home = document.querySelector(`[data-form-home="${form.id}"]`);
  if (home) home.after(form);
}

function openTxModal(focus) {
  openEntryForm(form, focus);
}

function closeTxModal() {
  closeEntryForm(form);
}

function openEntryForm(target, focus) {
  if (!target || !txModal) return;
  if (target.id === "transaction-form" && dateInput && !dateInput.value) dateInput.value = today();
  sheetBody?.querySelectorAll("form.entry-form").forEach((el) => {
    if (el !== target) parkForm(el);
  });
  if (target.parentElement !== sheetBody) sheetBody?.appendChild(target);
  target.classList.remove("hidden");
  if (sheetTitle) sheetTitle.textContent = sheetTitleFor(target);
  txModal.classList.remove("hidden");
  document.body.classList.add("modal-lock");
  const field = focus || target.querySelector("input:not([type='hidden']):not(:disabled)");
  requestAnimationFrame(() => field?.focus({ preventScroll: true }));
}

function closeEntryForm(target) {
  parkForm(target);
  const stillOpen = sheetBody?.querySelector("form.entry-form:not(.hidden)");
  if (stillOpen) return;
  txModal?.classList.add("hidden");
  if (editModal?.classList.contains("hidden") && dialog?.classList.contains("hidden")) {
    document.body.classList.remove("modal-lock");
  }
}

function resetTransactionForm() {
  if (descriptionInput) descriptionInput.value = "";
  if (amountInput) amountInput.value = "";
  categoryTouched = false;
  if (dateInput) dateInput.value = today();
  setType("income");
  closeTxModal();
}

function dismissSheet() {
  const openForm = sheetBody?.querySelector("form.entry-form:not(.hidden)");
  if (!openForm) {
    closeEntryForm(form);
    return;
  }
  if (openForm.id === "transaction-form") resetTransactionForm();
  else if (openForm.id === "debt-form") resetDebtForm();
  else if (openForm.id === "sub-form") resetSubForm();
  else if (openForm.id === "save-form") resetSaveForm();
  else if (openForm.id === "card-form") resetCardForm();
  else if (openForm.id === "charge-form") resetChargeForm();
  else closeEntryForm(openForm);
}

function closeOpenEntryForm() {
  if (txModal && !txModal.classList.contains("hidden")) dismissSheet();
}

function bindEntryForms() {
  document.querySelectorAll("[data-open-form]").forEach((btn) => {
    btn.addEventListener("click", () => openEntryForm(document.getElementById(btn.dataset.openForm)));
  });
  document.getElementById("tx-cancel")?.addEventListener("click", resetTransactionForm);
  document.getElementById("tx-modal-close")?.addEventListener("click", dismissSheet);
  txModal?.querySelector(".modal-backdrop")?.addEventListener("click", dismissSheet);
}

/* ---------- menu, dívidas e ajustes ---------- */

const VIEWS = new Set(["home", "debts", "subs", "savings", "settings", "cards"]);
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
  document.querySelectorAll(".nav-btn[data-view]").forEach((btn) => {
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
  document.querySelectorAll(".nav-btn[data-view]").forEach((btn) => {
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
  const note = document.getElementById("charts-off");
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
  } catch {
    /* usa os ajustes que ja estavam no aparelho */
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
    const payload = {};
    CHART_OPTIONS.forEach((opt) => {
      payload[opt.id] = chartPrefs[opt.id] !== false;
    });
    const saved = await api("PUT", "/settings", { charts: payload });
    if (saved?.charts) {
      CHART_OPTIONS.forEach((opt) => {
        if (typeof saved.charts[opt.id] === "boolean") chartPrefs[opt.id] = saved.charts[opt.id];
      });
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ charts: chartPrefs }));
      applyChartPrefs();
    }
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
  syncDebtCardField();
}

function syncDebtCardField() {
  const field = document.getElementById("debt-card-field");
  const select = document.getElementById("debt-card");
  const isCard = debtKind?.value === "credit_card";
  if (field) field.hidden = !isCard;
  if (!select || !isCard) return;
  const current = select.value;
  select.replaceChildren();
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = wallet.length ? "Escolher cartão" : "Nenhum cartão cadastrado";
  select.appendChild(blank);
  wallet.forEach((card) => {
    const option = document.createElement("option");
    option.value = String(card.id);
    option.textContent = `${card.issuer} •••• ${card.last4}`;
    select.appendChild(option);
  });
  if (wallet.some((card) => String(card.id) === current)) select.value = current;
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
  const linked = wallet.find((card) => String(card.id) === String(debt.card_id || ""));
  if (linked) {
    const cardTag = document.createElement("span");
    cardTag.className = "tag";
    cardTag.textContent = `${linked.issuer} •••• ${linked.last4}`;
    tags.appendChild(cardTag);
  }
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
    const list = groups.get(key).sort((a, b) => (txRank(b) - txRank(a)) || String(dayOf(a)).localeCompare(String(dayOf(b))));
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

let dueStripItem = null;

function dueWhen(day) {
  return dueMeta(day) || { text: formatDate(day), tone: "" };
}

function nextDueItem() {
  const items = [];
  debts.forEach((debt) => {
    if (debt.paid_at) return;
    const day = debtDay(debt);
    if (!day) return;
    items.push({ kind: "debt", day, name: debt.name, amount: debt.amount, ref: debt, label: "Dívida" });
  });
  subscriptions.forEach((sub) => {
    if (sub.active === false) return;
    const day = subDay(sub);
    if (!day) return;
    items.push({ kind: "sub", day, name: sub.name, amount: sub.amount, ref: sub, label: "Assinatura" });
  });
  items.sort((a, b) => a.day.localeCompare(b.day) || a.name.localeCompare(b.name, "pt-BR"));
  return items[0] || null;
}

function renderDueStrip() {
  const strip = document.getElementById("due-strip");
  if (!strip) return;
  const item = nextDueItem();
  dueStripItem = item;
  if (!item) {
    strip.hidden = true;
    return;
  }
  const when = dueWhen(item.day);
  strip.hidden = false;
  strip.classList.toggle("is-bad", when.tone === "bad");
  strip.classList.toggle("is-warn", when.tone === "warn");
  const whenEl = document.getElementById("due-strip-when");
  const nameEl = document.getElementById("due-strip-name");
  const amountEl = document.getElementById("due-strip-amount");
  if (whenEl) whenEl.textContent = when.text;
  if (nameEl) nameEl.textContent = item.name;
  if (amountEl) amountEl.textContent = money(item.amount);
  const open = document.getElementById("due-strip-open");
  if (open) open.setAttribute("aria-label", `Abrir ${item.label.toLowerCase()} ${item.name}`);
}

document.getElementById("due-strip-open")?.addEventListener("click", () => {
  if (!dueStripItem) return;
  showView(dueStripItem.kind === "debt" ? "debts" : "subs");
});

document.getElementById("due-strip-pay")?.addEventListener("click", async () => {
  const item = dueStripItem;
  if (!item) return;
  if (item.kind === "debt") await setDebtPaid(item.ref, true);
  else await registerSubPayment(item.ref);
});

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
  renderDueStrip();
  renderCardsView();
}

async function loadDebts() {
  try {
    debts = await api("GET", "/debts");
  } catch {
    debts = [];
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
    card_id: debt.kind === "credit_card" ? debt.card_id || null : null,
  };
}

function linkedCardId(debt) {
  if (!debt || debt.kind !== "credit_card") return null;
  const id = Number(debt.card_id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function settleCardInvoice(cardId, amount, paid) {
  if (!cardId) return 0;
  const result = await api("POST", `/cards/${cardId}/settle`, { amount: Number(amount), paid });
  await loadCards();
  return Number(result?.settled || 0);
}

function paidDebtToast(paid, onPanel, settled) {
  if (!paid) return settled ? "Dívida reaberta e limite do cartão de volta" : "Dívida reaberta";
  if (onPanel && settled) return "Fatura paga, lançada no painel e limite liberado";
  if (settled) return "Fatura paga e limite liberado";
  if (onPanel) return "Paga e lançada no painel";
  return "Dívida marcada como paga";
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
    const settled = await settleCardInvoice(linkedCardId(debt), debt.amount, paid);
    if (onPanel) await addDebtAsExpense(debt);
    await loadDebts();
    toast(paidDebtToast(paid, onPanel, settled));
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
  const cardSelect = document.getElementById("debt-card");
  if (cardSelect) cardSelect.value = debt.card_id ? String(debt.card_id) : "";
  cardSelect?.dispatchEvent(new Event("change"));
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
  document.getElementById("debt-card")?.addEventListener("change", () => {
    const card = wallet.find((item) => String(item.id) === document.getElementById("debt-card")?.value);
    if (!card) return;
    const open = card.charges.filter((charge) => !charge.paid_at).reduce((sum, charge) => sum + Number(charge.amount), 0);
    if (!debtAmount.value.trim() && open > 0) {
      debtAmount.value = open.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (!debtName.value.trim()) debtName.value = `Fatura ${card.issuer}`;
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
    const kind = debtKind.value || "credit_card";
    const cardId = kind === "credit_card" ? Number(document.getElementById("debt-card")?.value) || null : null;
    if (kind === "credit_card" && wallet.length && !cardId) return toast("Escolha o cartão dessa fatura", "error");
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
      kind,
      notes: debtNotes.value.trim(),
      paid,
      card_id: cardId,
    };
    debtSubmit.disabled = true;
    try {
      if (editingDebtId) await api("PUT", `/debts/${editingDebtId}`, body);
      else await api("POST", "/debts", body);
      const settled = paid !== wasPaid ? await settleCardInvoice(cardId, amount, paid) : 0;
      if (onPanel) await addDebtAsExpense({ name, amount });
      if (paid !== wasPaid) toast(paidDebtToast(paid, onPanel, settled));
      else toast(editingDebtId ? "Dívida atualizada" : "Dívida adicionada");
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
  const ordered = [...items].sort((a, b) => txRank(b) - txRank(a) || subDay(a).localeCompare(subDay(b)));
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
  renderDueStrip();
}

async function loadSubscriptions() {
  try {
    subscriptions = await api("GET", "/subscriptions");
  } catch {
    subscriptions = [];
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
  if (!telegramState || !telegramState.configured) {
    status.textContent = "O bot ainda não está ativo neste servidor.";
    link.hidden = true;
    unlink.hidden = true;
    const openBot = document.getElementById("telegram-open");
    if (openBot) openBot.hidden = true;
    return;
  }
  const bot = telegramState.username ? `@${telegramState.username}` : "o bot";
  status.textContent = telegramState.linked
    ? `Conta ligada a ${bot}. Dá para lançar gasto e ver o saldo por lá.`
    : `Gere um código e envie para ${bot} com /vincular.`;
  link.hidden = false;
  unlink.hidden = !telegramState.linked;
  const open = document.getElementById("telegram-open");
  if (open) {
    if (telegramState.username) {
      open.href = `https://t.me/${telegramState.username}`;
      open.hidden = false;
    } else {
      open.hidden = true;
    }
  }
}

async function loadTelegram() {
  const status = document.getElementById("telegram-status");
  if (!status) return;
  try {
    const data = await api("GET", "/telegram");
    telegramState = {
      configured: Boolean(data?.configured),
      linked: Boolean(data?.linked),
      username: data?.username || "",
    };
    paintTelegram();
  } catch (err) {
    status.textContent = friendlyError(err, "Não foi possível carregar o Telegram agora. Tente de novo em instantes.");
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
  list.append(...[...items].sort((a, b) => txRank(b) - txRank(a) || String(a.name).localeCompare(String(b.name))).map(saveRow));
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
  } catch {
    savings = [];
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

const CARD_BRANDS = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "Amex",
};

let wallet = [];
let selectedCardId = null;
let editingCardId = null;
let editingCharge = null;

const CARD_COLOR_FALLBACK = { visa: "#1a1f71", mastercard: "#1a1a1a", elo: "#141414", amex: "#016fd0" };

function cardTone(card) {
  return /^#[0-9a-fA-F]{6}$/.test(card?.color || "") ? card.color : CARD_COLOR_FALLBACK[card?.brand] || "#1a1f71";
}

function shadeHex(hex, mix) {
  const num = parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.round(((num >> shift) & 255) * mix);
  const part = (value) => value.toString(16).padStart(2, "0");
  return `#${part(channel(16))}${part(channel(8))}${part(channel(0))}`;
}

function setCardBrand(brand) {
  const input = document.getElementById("card-brand");
  if (input) input.value = brand;
  document.querySelectorAll("#card-form [data-brand]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.brand === brand);
  });
}

function setCardColor(color) {
  const input = document.getElementById("card-color");
  const next = /^#[0-9a-fA-F]{6}$/.test(color || "") ? color : "#820ad1";
  if (input) input.value = next;
  document.querySelectorAll("#card-form [data-color]").forEach((btn) => {
    const on = btn.dataset.color.toLowerCase() === next.toLowerCase();
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function setChargePaidFlag(paid) {
  const input = document.getElementById("charge-paid-flag");
  if (input) input.value = paid ? "1" : "0";
  document.querySelectorAll("#charge-form [data-charge-paid]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.chargePaid === (paid ? "1" : "0"));
  });
}

function resetCardForm() {
  editingCardId = null;
  document.getElementById("card-form")?.reset();
  setCardBrand("visa");
  setCardColor("#820ad1");
  const submit = document.getElementById("card-submit");
  if (submit) submit.textContent = "Salvar cartão";
  closeEntryForm(document.getElementById("card-form"));
}

function startEditCard(card) {
  editingCardId = card.id;
  const issuer = document.getElementById("card-issuer");
  const last4 = document.getElementById("card-last4");
  const limit = document.getElementById("card-limit");
  if (issuer) issuer.value = card.issuer;
  if (last4) last4.value = card.last4;
  if (limit) limit.value = Number(card.credit_limit).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  setCardBrand(card.brand);
  setCardColor(cardTone(card));
  const submit = document.getElementById("card-submit");
  if (submit) submit.textContent = "Salvar alterações";
  const form = document.getElementById("card-form");
  openEntryForm(form, issuer);
}

function resetChargeForm() {
  editingCharge = null;
  document.getElementById("charge-form")?.reset();
  setChargePaidFlag(false);
  const date = document.getElementById("charge-date");
  if (date) date.value = today();
  const submit = document.getElementById("charge-submit");
  if (submit) submit.textContent = "Adicionar";
  closeEntryForm(document.getElementById("charge-form"));
}

function startEditCharge(card, charge) {
  editingCharge = { cardId: card.id, ...charge };
  selectedCardId = card.id;
  const description = document.getElementById("charge-description");
  const amount = document.getElementById("charge-amount");
  const date = document.getElementById("charge-date");
  if (description) description.value = charge.description;
  if (amount) amount.value = Number(charge.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (date) date.value = String(charge.spent_at).slice(0, 10);
  setChargePaidFlag(Boolean(charge.paid_at));
  const submit = document.getElementById("charge-submit");
  if (submit) submit.textContent = "Salvar alterações";
  openEntryForm(document.getElementById("charge-form"), description);
}

function selectedCard() {
  return wallet.find((card) => String(card.id) === String(selectedCardId)) || wallet[0] || null;
}

function paintWalletButton() {
  const button = document.getElementById("open-cards");
  const hint = document.getElementById("wallet-open-hint");
  const brand = document.getElementById("wallet-open-brand");
  const digits = document.getElementById("wallet-open-digits");
  if (!button) return;
  button.classList.remove("has-card", "brand-visa", "brand-mastercard", "brand-elo", "brand-amex");
  const card = wallet[0];
  if (!card) {
    if (hint) hint.textContent = "Limite, fatura e extrato";
    if (brand) brand.textContent = "";
    if (digits) digits.textContent = "";
    return;
  }
  button.classList.add("has-card", `brand-${card.brand}`);
  if (hint) hint.textContent = wallet.length > 1 ? `${card.issuer} · e mais ${wallet.length - 1}` : card.issuer;
  if (brand) brand.textContent = CARD_BRANDS[card.brand] || "";
  if (digits) digits.textContent = `•••• ${card.last4}`;
}

function chargeSum(charges, paid) {
  return charges.filter((charge) => Boolean(charge.paid_at) === paid).reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
}

function cardInvoices(card) {
  return debts.filter((debt) => debt.kind === "credit_card" && String(debt.card_id || "") === String(card.id) && !debt.paid_at);
}

function cardDebtList(card) {
  const linked = debts.filter((debt) => debt.kind === "credit_card" && String(debt.card_id || "") === String(card.id));
  if (linked.length) return linked;
  const issuer = String(card.issuer || "").toLowerCase();
  const unlinked = debts.filter((debt) => debt.kind === "credit_card" && !debt.card_id);
  const named = unlinked.filter((debt) => issuer && String(debt.name || "").toLowerCase().includes(issuer));
  if (named.length) return named;
  return unlinked.length === 1 ? unlinked : [];
}

function invoiceIsFuture(debt) {
  const due = String(debt.due_date || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return false;
  return due.slice(0, 7) > today().slice(0, 7);
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function applyWalletSnapshot(payload) {
  if (!payload || !Array.isArray(payload.cards) || !Array.isArray(payload.debts)) return false;
  wallet = payload.cards;
  debts = payload.debts;
  if (!wallet.some((card) => String(card.id) === String(selectedCardId))) selectedCardId = wallet[0]?.id ?? null;
  fillImportCards();
  syncDebtCardField();
  renderDebts();
  return true;
}

async function reloadWallet() {
  try {
    const [cards, nextDebts] = await Promise.all([api("GET", "/cards"), api("GET", "/debts")]);
    applyWalletSnapshot({ cards, debts: nextDebts });
  } catch (err) {
    toast(err.message, "error");
  }
}

function bumpInvoiceLocal(card, delta) {
  const value = roundMoney(delta);
  if (!card || !value) return;
  const open = cardDebtList(card)
    .filter((debt) => !debt.paid_at)
    .sort((a, b) => String(a.due_date || "9999").localeCompare(String(b.due_date || "9999")));
  if (value < 0) {
    let left = -value;
    for (const debt of open) {
      if (left <= 0.009) break;
      const current = roundMoney(debt.amount);
      const take = Math.min(current, left);
      const next = roundMoney(current - take);
      left = roundMoney(left - take);
      if (next <= 0.009) debt.paid_at = debt.paid_at || new Date().toISOString();
      else debt.amount = next;
    }
    return;
  }
  const statement = open.find((debt) => !invoiceIsFuture(debt)) || open[0];
  if (statement) {
    statement.amount = roundMoney(Number(statement.amount) + value);
    statement.paid_at = null;
    if (!statement.card_id) statement.card_id = card.id;
  }
}

async function syncWallet(result) {
  if (applyWalletSnapshot(result)) return;
  if (!previewMode) await reloadWallet();
}

async function saveInvoice(debt, amount, paid) {
  await api("PUT", `/debts/${debt.id}`, debtPayloadFrom({ ...debt, amount }, paid));
}

async function applyChargeToInvoices(card, amount, paying) {
  const value = roundMoney(amount);
  if (!card || !(value > 0)) return false;
  const open = cardDebtList(card)
    .filter((debt) => !debt.paid_at)
    .sort((a, b) => String(a.due_date || "9999").localeCompare(String(b.due_date || "9999")));
  if (paying) {
    let left = value;
    let changed = false;
    for (const debt of open) {
      if (left <= 0.009) break;
      const current = roundMoney(debt.amount);
      const take = Math.min(current, left);
      if (take <= 0.009) continue;
      const next = roundMoney(current - take);
      left = roundMoney(left - take);
      if (next <= 0.009) await saveInvoice(debt, current, true);
      else await saveInvoice(debt, next, false);
      debt.amount = next <= 0.009 ? current : next;
      debt.paid_at = next <= 0.009 ? debt.paid_at || new Date().toISOString() : null;
      changed = true;
    }
    return changed;
  }
  const statement = open.find((debt) => !invoiceIsFuture(debt));
  if (statement) {
    const next = roundMoney(Number(statement.amount) + value);
    await saveInvoice(statement, next, false);
    statement.amount = next;
    return true;
  }
  const paid = cardDebtList(card)
    .filter((debt) => debt.paid_at && !invoiceIsFuture(debt))
    .sort((a, b) => String(b.paid_at).localeCompare(String(a.paid_at)));
  if (paid[0]) {
    await saveInvoice(paid[0], value, false);
    paid[0].amount = value;
    paid[0].paid_at = null;
    return true;
  }
  if (open[0]) {
    const next = roundMoney(Number(open[0].amount) + value);
    await saveInvoice(open[0], next, false);
    open[0].amount = next;
    return true;
  }
  const month = today().slice(0, 7);
  const created = await api("POST", "/debts", {
    name: `Fatura ${card.issuer} ${month.slice(5)}/${month.slice(0, 4)}`,
    kind: "credit_card",
    amount: value,
    due_date: "",
    notes: "Fatura do cartão",
    paid: false,
    card_id: card.id,
  });
  debts.unshift(created);
  return true;
}

function cardLimitUse(card) {
  const openCharges = chargeSum(card.charges || [], false);
  const invoices = cardInvoices(card)
    .slice()
    .sort((a, b) => String(a.due_date || "").localeCompare(String(b.due_date || "")));
  let covered = openCharges;
  let extra = 0;
  invoices.forEach((debt) => {
    const amount = Number(debt.amount) || 0;
    const taken = Math.min(covered, amount);
    covered -= taken;
    extra += amount - taken;
  });
  return {
    used: Math.round((openCharges + extra) * 100) / 100,
    invoices,
    uncovered: Math.round(Math.max(0, covered) * 100) / 100,
  };
}

function invoiceRow(debt) {
  const row = document.createElement("article");
  row.className = "charge-row invoice-row";
  const name = document.createElement("div");
  name.className = "charge-name";
  name.textContent = debt.name;
  const meta = document.createElement("div");
  meta.className = "charge-meta";
  const when = debt.due_date ? formatDate(String(debt.due_date).slice(0, 10)) : "Sem vencimento";
  const bucket = debtBucket(debt);
  const where = bucket === "next" ? "Mês que vem" : bucket === "late" ? "Atrasada" : bucket === "soon" ? "Este mês" : "";
  meta.textContent = [when, where, debt.notes].filter(Boolean).join(" · ");
  const amount = document.createElement("div");
  amount.className = "charge-amount";
  amount.textContent = money(debt.amount);
  const actions = document.createElement("div");
  actions.className = "charge-actions";
  const pay = document.createElement("button");
  pay.type = "button";
  pay.className = "pay-btn";
  pay.textContent = "Paguei";
  pay.addEventListener("click", () => setDebtPaid(debt, true));
  actions.append(pay);
  row.append(name, amount, meta, actions);
  return row;
}

function chargeRow(card, charge) {
  const row = document.createElement("article");
  row.className = "charge-row";
  const name = document.createElement("div");
  name.className = "charge-name";
  name.textContent = charge.description;
  const meta = document.createElement("div");
  meta.className = "charge-meta";
  meta.textContent = formatDate(String(charge.spent_at).slice(0, 10));
  const amount = document.createElement("div");
  amount.className = "charge-amount";
  amount.textContent = money(charge.amount);
  const actions = document.createElement("div");
  actions.className = "charge-actions";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = charge.paid_at ? "btn secondary" : "pay-btn";
  toggle.textContent = charge.paid_at ? "Reabrir" : "Paguei";
  toggle.addEventListener("click", () => setChargePaid(card, charge, !charge.paid_at));
  const more = document.createElement("details");
  more.className = "charge-more";
  const summary = document.createElement("summary");
  summary.textContent = "Mais";
  summary.setAttribute("aria-label", "Mais ações");
  const menu = document.createElement("div");
  menu.className = "charge-more-menu";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.textContent = "Editar";
  edit.addEventListener("click", () => {
    more.removeAttribute("open");
    startEditCharge(card, charge);
  });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Excluir";
  remove.addEventListener("click", () => {
    more.removeAttribute("open");
    removeCharge(card, charge);
  });
  menu.append(edit, remove);
  more.append(summary, menu);
  actions.append(toggle, more);
  row.append(name, amount, meta, actions);
  return row;
}

function renderCardsView() {
  paintWalletButton();
  const card = selectedCard();
  selectedCardId = card?.id ?? null;
  const empty = document.getElementById("card-empty");
  const panel = document.getElementById("card-panel");
  const host = document.getElementById("plastic-host");
  const switcher = document.getElementById("card-switch");
  if (empty) empty.hidden = wallet.length > 0;
  if (panel) panel.hidden = !card;
  if (!host || !switcher) return;
  switcher.hidden = wallet.length < 2;
  switcher.replaceChildren(...wallet.map((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = item.id === card?.id ? "is-on" : "";
    btn.textContent = `${item.issuer} •••• ${item.last4}`;
    btn.addEventListener("click", () => {
      selectedCardId = item.id;
      resetChargeForm();
      renderCardsView();
    });
    return btn;
  }));
  host.replaceChildren();
  const edit = document.getElementById("card-edit");
  if (edit) edit.hidden = !card;
  if (!card) return;
  const plastic = document.createElement("article");
  plastic.className = `plastic brand-${card.brand}`;
  const tone = cardTone(card);
  plastic.style.background = `linear-gradient(145deg, ${tone}, ${shadeHex(tone, 0.45)})`;
  const top = document.createElement("div");
  top.className = "plastic-top";
  const issuer = document.createElement("span");
  issuer.className = "plastic-issuer";
  issuer.textContent = card.issuer;
  const brand = document.createElement("span");
  brand.className = "plastic-brand";
  brand.textContent = CARD_BRANDS[card.brand] || card.brand;
  top.append(issuer, brand);
  const chip = document.createElement("span");
  chip.className = "plastic-chip";
  chip.setAttribute("aria-hidden", "true");
  const digits = document.createElement("p");
  digits.className = "plastic-digits";
  digits.textContent = `•••• ${card.last4}`;
  const foot = document.createElement("div");
  foot.className = "plastic-foot";
  const footBrand = document.createElement("span");
  footBrand.textContent = "Crédito";
  const footLimit = document.createElement("span");
  footLimit.textContent = money(card.credit_limit);
  foot.append(footBrand, footLimit);
  plastic.append(top, chip, digits, foot);
  host.appendChild(plastic);

  const charges = card.charges || [];
  const open = charges.filter((item) => !item.paid_at);
  const paid = charges.filter((item) => item.paid_at);
  const usage = cardLimitUse(card);
  const openSum = usage.used;
  const limit = Number(card.credit_limit) || 0;
  const free = Math.max(0, limit - openSum);
  const usedPct = limit ? Math.min(100, (openSum / limit) * 100) : 0;
  const limitCard = document.querySelector(".limit-card");
  if (limitCard) limitCard.classList.toggle("is-over", openSum > limit);
  const fill = document.getElementById("limit-fill");
  if (fill) fill.style.width = `${usedPct}%`;
  const total = document.getElementById("limit-total");
  if (total) total.textContent = money(limit);
  const used = document.getElementById("limit-used");
  if (used) used.textContent = `Fatura ${money(openSum)}`;
  const freeEl = document.getElementById("limit-free");
  if (freeEl) freeEl.textContent = openSum > limit ? "Acima do limite" : `Livre ${money(free)}`;
  const invoiceRows = usage.invoices.map((debt) => invoiceRow(debt));
  if (usage.uncovered > 0.009) {
    const pending = document.createElement("article");
    pending.className = "charge-row invoice-row";
    const name = document.createElement("div");
    name.className = "charge-name";
    name.textContent = "Extrato ainda sem fatura";
    const meta = document.createElement("div");
    meta.className = "charge-meta";
    meta.textContent = "Também entra no limite";
    const amount = document.createElement("div");
    amount.className = "charge-amount";
    amount.textContent = money(usage.uncovered);
    pending.append(name, amount, meta);
    invoiceRows.push(pending);
  }
  document.getElementById("invoice-list")?.replaceChildren(...invoiceRows);
  const invoiceEmpty = document.getElementById("invoice-empty");
  if (invoiceEmpty) invoiceEmpty.hidden = invoiceRows.length > 0;
  open.sort((a, b) => txRank(b) - txRank(a) || String(b.spent_at).localeCompare(String(a.spent_at)));
  paid.sort((a, b) => txRank(b) - txRank(a) || String(b.paid_at).localeCompare(String(a.paid_at)));
  document.getElementById("charge-open")?.replaceChildren(...open.map((item) => chargeRow(card, item)));
  document.getElementById("charge-paid")?.replaceChildren(...paid.map((item) => chargeRow(card, item)));
  const openEmpty = document.getElementById("charge-open-empty");
  const paidEmpty = document.getElementById("charge-paid-empty");
  if (openEmpty) openEmpty.hidden = open.length > 0;
  if (paidEmpty) paidEmpty.hidden = paid.length > 0;
}

async function loadCards() {
  try {
    wallet = await api("GET", "/cards");
  } catch {
    wallet = [];
  }
  if (!wallet.some((card) => card.id === selectedCardId)) selectedCardId = wallet[0]?.id ?? null;
  fillImportCards();
  renderCardsView();
  syncDebtCardField();
  if (debts.length) renderDebts();
}

async function setChargePaid(card, charge, paid) {
  const previous = charge.paid_at;
  charge.paid_at = paid ? previous || new Date().toISOString() : null;
  bumpInvoiceLocal(card, paid ? -Number(charge.amount) : Number(charge.amount));
  renderDebts();
  toast(paid ? "Pago e a fatura diminuiu" : "Voltou para a fatura");
  try {
    const result = await api("PUT", `/cards/${card.id}/charges/${charge.id}`, {
      description: charge.description,
      amount: Number(charge.amount),
      spent_at: String(charge.spent_at).slice(0, 10),
      paid,
    });
    await syncWallet(result);
  } catch (err) {
    charge.paid_at = previous;
    toast(err.message, "error");
    await reloadWallet();
  }
}

async function removeCharge(card, charge) {
  const unpaid = !charge.paid_at;
  const list = card.charges || [];
  const index = list.indexOf(charge);
  if (index >= 0) list.splice(index, 1);
  if (unpaid) bumpInvoiceLocal(card, -Number(charge.amount));
  renderDebts();
  toast(`"${charge.description}" excluído`);
  try {
    const result = await api("DELETE", `/cards/${card.id}/charges/${charge.id}`);
    await syncWallet(result);
  } catch (err) {
    if (index >= 0) list.splice(index, 0, charge);
    toast(err.message, "error");
    await reloadWallet();
  }
}

function bindCards() {
  document.querySelector('[data-open-form="card-form"]')?.addEventListener("click", () => {
    editingCardId = null;
    document.getElementById("card-form")?.reset();
    setCardBrand("visa");
    setCardColor("#820ad1");
    const submit = document.getElementById("card-submit");
    if (submit) submit.textContent = "Salvar cartão";
  });
  document.querySelectorAll("#card-form [data-brand]").forEach((btn) => {
    btn.addEventListener("click", () => setCardBrand(btn.dataset.brand));
  });
  document.querySelectorAll("#card-form [data-color]").forEach((btn) => {
    btn.addEventListener("click", () => setCardColor(btn.dataset.color));
  });
  document.querySelector('[data-open-form="charge-form"]')?.addEventListener("click", () => {
    editingCharge = null;
    document.getElementById("charge-form")?.reset();
    setChargePaidFlag(false);
    const date = document.getElementById("charge-date");
    if (date) date.value = today();
    const submit = document.getElementById("charge-submit");
    if (submit) submit.textContent = "Adicionar";
  });
  document.querySelectorAll("#charge-form [data-charge-paid]").forEach((btn) => {
    btn.addEventListener("click", () => setChargePaidFlag(btn.dataset.chargePaid === "1"));
  });
  document.getElementById("card-cancel")?.addEventListener("click", resetCardForm);
  document.getElementById("charge-cancel")?.addEventListener("click", resetChargeForm);
  document.getElementById("card-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const issuer = document.getElementById("card-issuer").value.trim();
    const last4 = document.getElementById("card-last4").value.replace(/\D/g, "");
    const creditLimit = parseAmount(document.getElementById("card-limit").value);
    if (!issuer) return toast("Informe a empresa do cartão", "error");
    if (!/^\d{4}$/.test(last4)) return toast("Use os 4 últimos números", "error");
    if (Number.isNaN(creditLimit)) return toast("Informe o limite", "error");
    const submit = document.getElementById("card-submit");
    if (submit) submit.disabled = true;
    const payload = {
      issuer,
      brand: document.getElementById("card-brand").value,
      last4,
      credit_limit: creditLimit,
      color: document.getElementById("card-color").value,
    };
    try {
      if (editingCardId) {
        await api("PUT", `/cards/${editingCardId}`, payload);
        selectedCardId = editingCardId;
        resetCardForm();
        await loadCards();
        toast("Cartão atualizado");
      } else {
        const created = await api("POST", "/cards", payload);
        selectedCardId = created.id;
        resetCardForm();
        await loadCards();
        toast("Cartão adicionado");
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      if (submit) submit.disabled = false;
    }
  });
  document.getElementById("charge-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const card = selectedCard();
    if (!card) return;
    const description = document.getElementById("charge-description").value.trim();
    const amount = parseAmount(document.getElementById("charge-amount").value);
    const spentAt = document.getElementById("charge-date").value || today();
    if (!description) return toast("Informe a descrição", "error");
    if (Number.isNaN(amount)) return toast("Valor inválido. Use por exemplo 49,90", "error");
    try {
      const alreadyPaid = document.getElementById("charge-paid-flag").value === "1";
      const current = editingCharge;
      if (current) {
        const wasUnpaid = !current.paid_at;
        const prev = { ...current };
        if (wasUnpaid) bumpInvoiceLocal(card, -Number(current.amount));
        Object.assign(current, { description, amount, spent_at: spentAt, paid_at: alreadyPaid ? current.paid_at || new Date().toISOString() : null });
        if (!alreadyPaid) bumpInvoiceLocal(card, amount);
        resetChargeForm();
        renderDebts();
        toast("Lançamento atualizado");
        const result = await api("PUT", `/cards/${card.id}/charges/${prev.id}`, {
          description,
          amount,
          spent_at: spentAt,
          paid: alreadyPaid,
        });
        await syncWallet(result);
      } else {
        const temp = {
          id: `tmp-${Date.now()}`,
          card_id: card.id,
          description,
          amount,
          spent_at: spentAt,
          paid_at: alreadyPaid ? new Date().toISOString() : null,
        };
        card.charges = card.charges || [];
        card.charges.unshift(temp);
        if (!alreadyPaid) bumpInvoiceLocal(card, amount);
        resetChargeForm();
        renderDebts();
        toast(alreadyPaid ? "Lançado como pago" : "Lançado e a fatura aumentou");
        const result = await api("POST", `/cards/${card.id}/charges`, {
          description,
          amount,
          spent_at: spentAt,
          paid: alreadyPaid,
        });
        await syncWallet(result);
      }
    } catch (err) {
      toast(err.message, "error");
      await reloadWallet();
    }
  });
  document.getElementById("card-edit")?.addEventListener("click", () => {
    const card = selectedCard();
    if (card) startEditCard(card);
  });
  document.getElementById("card-remove")?.addEventListener("click", async () => {
    const card = selectedCard();
    if (!card) return;
    const ok = await askDialog({
      title: "Excluir cartão?",
      text: `Apagar o ${card.issuer} final ${card.last4} e o extrato dele?`,
      okLabel: "Excluir",
      cancelLabel: "Cancelar",
    });
    if (ok !== true) return;
    try {
      await api("DELETE", `/cards/${card.id}`);
      selectedCardId = null;
      await loadCards();
      toast("Cartão excluído");
    } catch (err) {
      toast(err.message, "error");
    }
  });
}

let bootDone = false;
function revealApp() {
  if (bootDone) return;
  bootDone = true;
  document.documentElement.classList.remove("booting");
  document.documentElement.classList.add("ready");
  const screen = document.getElementById("boot-screen");
  if (screen) screen.setAttribute("aria-busy", "false");
}
setTimeout(revealApp, 12000);

window.addEventListener("pageshow", (event) => {
  if (previewMode || !event.persisted) return;
  document.documentElement.classList.add("booting");
  api("GET", "/me")
    .then((me) => {
      userId = me?.id || "anon";
      avatarKey = `bg-avatar:${userId}`;
      setAccount(me || {});
      revealApp();
    })
    .catch(() => {
      window.location.replace("login.html");
    });
});

(async function init() {
  if (!previewMode) {
    try {
      const me = await api("GET", "/me");
      userId = me?.id || "anon";
      avatarKey = `bg-avatar:${userId}`;
      rememberAvatar(me?.avatar || "");
      setAccount(me || {});
    } catch {
      window.location.replace("login.html");
      return;
    }
  }
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
  bindCards();
  bindTelegram();
  const start = viewFromHash();
  if (start !== "home") showView(start, false);
  if (previewMode) allTransactions = demoTransactions();
  if (!document.getElementById("view-home")?.hidden) renderDashboard();
  try {
    await Promise.all([
      loadCategories(),
      loadSettings(),
      loadTransactions(),
      loadDebts(),
      loadSubscriptions(),
      loadSavings(),
      loadCards(),
    ]);
  } catch (err) {
    toast(err.message || "Não foi possível carregar o painel", "error");
  }
  revealApp();
})();

/* ---------- controles customizados ---------- */

function enhanceSelect(select, { colorize = ["category", "category-filter", "edit-category", "save-category"].includes(select?.id) } = {}) {
  if (!select || select.dataset.enhanced) return;
  select.dataset.enhanced = "1";
  select.classList.add("native-field");
  select.tabIndex = -1;
  const wrap = document.createElement("div");
  wrap.className = "menu-select";
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);

  const listId = `${select.id || `select-${Math.random().toString(36).slice(2, 8)}`}-menu`;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "menu-select-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", listId);
  const labelText = select.getAttribute("aria-label") || select.labels?.[0]?.textContent?.trim();
  if (labelText) btn.setAttribute("aria-label", labelText);
  if (select.id) {
    select.labels?.forEach((label) => label.addEventListener("click", (event) => {
      event.preventDefault();
      btn.focus();
    }));
  }
  const menu = document.createElement("div");
  menu.className = "menu-select-list";
  menu.id = listId;
  menu.setAttribute("role", "listbox");
  wrap.append(btn, menu);

  const dotColor = (opt) => {
    if (!colorize || !opt.value) return "";
    return catColor(opt.textContent);
  };
  const items = () => [...menu.querySelectorAll(".menu-select-item:not(:disabled)")];

  function close({ focus = false } = {}) {
    wrap.classList.remove("open", "drop-up");
    btn.setAttribute("aria-expanded", "false");
    if (focus) btn.focus();
  }

  function open() {
    if (btn.disabled) return;
    document.querySelectorAll(".menu-select.open, .month-picker.open").forEach((el) => {
      if (el === wrap) return;
      el.classList.remove("open", "drop-up");
      el.querySelector(":scope > .menu-select-btn")?.setAttribute("aria-expanded", "false");
    });
    paint();
    const room = window.innerHeight - btn.getBoundingClientRect().bottom;
    wrap.classList.toggle("drop-up", room < 280 && btn.getBoundingClientRect().top > room);
    wrap.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    const active = menu.querySelector(".menu-select-item.is-active") || items()[0];
    active?.focus({ preventScroll: true });
    active?.scrollIntoView({ block: "nearest" });
  }

  function choose(opt) {
    if (select.value !== opt.value) {
      select.value = opt.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    close({ focus: true });
  }

  function paint() {
    const current = select.selectedOptions[0];
    const color = current ? dotColor(current) : "";
    btn.disabled = select.disabled;
    btn.innerHTML = `<span class="menu-select-value">${color ? `<span class="menu-dot" style="--c:${color}"></span>` : ""}<span></span></span>${ICON.chevron}`;
    btn.querySelector(".menu-select-value > span:last-child").textContent = current ? current.textContent : "Selecionar";
    menu.innerHTML = "";
    [...select.options].forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "menu-select-item" + (opt.selected ? " is-active" : "");
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(opt.selected));
      item.tabIndex = -1;
      item.disabled = opt.disabled;
      if (colorize) {
        const dot = document.createElement("span");
        dot.className = "menu-dot";
        const c = dotColor(opt);
        if (c) dot.style.setProperty("--c", c);
        item.appendChild(dot);
      }
      const label = document.createElement("span");
      label.className = "menu-select-label";
      label.textContent = opt.textContent;
      item.appendChild(label);
      if (opt.selected) item.insertAdjacentHTML("beforeend", `<span class="menu-select-check">${ICON.check}</span>`);
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        choose(opt);
      });
      menu.appendChild(item);
    });
  }

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (wrap.classList.contains("open")) close();
    else open();
  });

  btn.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });

  menu.addEventListener("keydown", (event) => {
    const list = items();
    const at = list.indexOf(document.activeElement);
    const move = (index) => list[Math.max(0, Math.min(list.length - 1, index))]?.focus();
    if (event.key === "ArrowDown") { event.preventDefault(); move(at + 1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); move(at - 1); }
    else if (event.key === "Home") { event.preventDefault(); move(0); }
    else if (event.key === "End") { event.preventDefault(); move(list.length - 1); }
    else if (event.key === "Escape") { event.preventDefault(); close({ focus: true }); }
    else if (event.key === "Tab") close();
  });

  // Code that sets .value or .selectedIndex directly fires no event, so the button would keep the old label.
  for (const prop of ["value", "selectedIndex"]) {
    const native = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
    Object.defineProperty(select, prop, {
      configurable: true,
      get() { return native.get.call(this); },
      set(next) { native.set.call(this, next); paint(); },
    });
  }

  new MutationObserver(paint).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "selected", "label"] });
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
  document.querySelectorAll("select").forEach((select) => enhanceSelect(select));
  enhanceMonth(monthFilter);
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".month-panel")) return;
  document.querySelectorAll(".menu-select.open, .month-picker.open").forEach((el) => {
    el.classList.remove("open", "drop-up");
    el.querySelector(":scope > .menu-select-btn")?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("bg-theme", () => {
  if (document.getElementById("chartFlow")) renderDashboard();
});
