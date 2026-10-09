const token = localStorage.getItem("token");
const previewMode = new URLSearchParams(location.search).get("preview") === "1";
if (!token && !previewMode) window.location.href = "login.html";

const CATEGORY_KEY = "bg-finance-categories";
const INCOME_CATS = ["Salário", "Freelance", "Investimentos", "Extra", "Outros"];
const EXPENSE_CATS = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Assinaturas",
  "Trabalho",
  "Outros",
];
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
};
const KEYWORDS = [
  [/sal[aá]rio|pagamento|holerite/i, "Salário", "income"],
  [/freelance|freela|cliente/i, "Freelance", "income"],
  [/dividend|rendimento|juros/i, "Investimentos", "income"],
  [/mercado|ifood|padaria|restaurante|lanche|almo[cç]o|jantar|feira/i, "Alimentação", "expense"],
  [/aluguel|condom[ií]nio|luz|energia|água|agua|internet|iptu/i, "Moradia", "expense"],
  [/uber|\b99\b|gasolina|combust[ií]vel|passagem|estacionamento|metr[oô]|ônibus|onibus/i, "Transporte", "expense"],
  [/farm[aá]cia|m[eé]dic|plano de sa[uú]de|consulta|academia/i, "Saúde", "expense"],
  [/netflix|spotify|prime|youtube|assinatura|disney|hbo/i, "Assinaturas", "expense"],
  [/cinema|\bbar\b|viagem|show|lazer/i, "Lazer", "expense"],
  [/curso|faculdade|livro|escola/i, "Educação", "expense"],
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

function catColor(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
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

function askDialog({ title, text = "", placeholder = "", okLabel = "Confirmar", input = false, inputType = "text", danger = false }) {
  return new Promise((resolve) => {
    dialogTitle.textContent = title;
    dialogText.textContent = text;
    dialogField.classList.toggle("hidden", !input);
    dialogInput.type = input ? inputType : "text";
    dialogInput.autocomplete = inputType === "password" ? "current-password" : "off";
    dialogInput.value = "";
    dialogInput.placeholder = placeholder;
    dialogOk.textContent = okLabel;
    dialogOk.classList.toggle("danger", danger);
    dialog.classList.remove("hidden");
    (input ? dialogInput : dialogOk).focus();

    const backdrop = dialog.querySelector(".modal-backdrop");
    const finish = (value) => {
      dialog.classList.add("hidden");
      dialogInput.type = "text";
      dialogOk.classList.remove("danger");
      dialogForm.removeEventListener("submit", onSubmit);
      dialogCancel.removeEventListener("click", onCancel);
      backdrop.removeEventListener("click", onCancel);
      closeActiveDialog = null;
      resolve(value);
    };
    const onSubmit = (e) => {
      e.preventDefault();
      finish(input ? dialogInput.value.trim() : true);
    };
    const onCancel = () => finish(null);
    dialogForm.addEventListener("submit", onSubmit);
    dialogCancel.addEventListener("click", onCancel);
    backdrop.addEventListener("click", onCancel);
    closeActiveDialog = onCancel;
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
let previewDebts = [];

function seedPreviewDebts() {
  if (previewDebts.length) return;
  const soon = shiftDay(today(), 3);
  const late = shiftDay(today(), -4);
  previewDebts = [
    { id: ++previewSeq, name: "Cartão de crédito", kind: "credit_card", amount: 842.3, due_date: soon, notes: "Fatura do mês", paid_at: null },
    { id: ++previewSeq, name: "Empréstimo pessoal", kind: "loan", amount: 3200, due_date: late, notes: "Parcela 4 de 12", paid_at: null },
  ];
}

function shiftDay(iso, delta) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function previewApi(method, url, body) {
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
  const byName = new Map(fromApi.map((c) => [c.name.toLowerCase(), c]));
  const defaults = (type === "income" ? INCOME_CATS : EXPENSE_CATS).filter((name) => name !== "Outros");
  const known = new Set([...defaults, "Outros"].map((name) => name.toLowerCase()));
  const pick = (name) => byName.get(name.toLowerCase()) || { id: name, name, type };
  const custom = fromApi
    .filter((c) => !known.has(c.name.toLowerCase()))
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
  try {
    await api("PUT", `/transactions/${editingTransaction.id}`, body);
    saveCategory(editingTransaction.id, body.category);
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
  if (!sorted.length) showMoreBtn.classList.add("hidden");
  if (loading) return emptyRow("Carregando lançamentos…");
  if (!allTransactions.length) return emptyRow("Nenhum lançamento ainda. Adicione o primeiro acima.");
  if (!sorted.length) return emptyRow("Nada encontrado com esses filtros.");

  tbody.innerHTML = "";
  const remaining = sorted.length - visibleCount;
  showMoreBtn.classList.toggle("hidden", remaining <= 0);
  showMoreBtn.textContent = `Mostrar mais · ${remaining} restante${remaining === 1 ? "" : "s"}`;
  sorted.slice(0, visibleCount).forEach((t) => {
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
  if (document.getElementById("view-home")?.hidden) return;
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

function applyFilters() {
  visibleCount = PAGE_SIZE;
  renderDashboard();
}

monthFilter?.addEventListener("change", applyFilters);
typeFilter?.addEventListener("change", applyFilters);
categoryFilter?.addEventListener("change", applyFilters);
searchFilter?.addEventListener("input", applyFilters);
chartMode?.addEventListener("change", renderDashboard);

function stepMonth(delta) {
  monthFilter.value = shiftMonth(monthFilter.value || today().slice(0, 7), monthFilter.value ? delta : 0);
  monthFilter.dispatchEvent(new Event("change"));
}
monthPrev?.addEventListener("click", () => stepMonth(-1));
monthNext?.addEventListener("click", () => stepMonth(1));

clearFilterBtn?.addEventListener("click", () => {
  [monthFilter, typeFilter, categoryFilter].forEach((el) => {
    if (!el) return;
    el.value = "";
    el.dispatchEvent(new Event("change"));
  });
  if (searchFilter) searchFilter.value = "";
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
  submitBtn.disabled = true;
  submitBtn.textContent = "Salvando…";
  try {
    const created = await api("POST", "/transactions", body);
    if (created?.id) saveCategory(created.id, body.category);
    descriptionInput.value = "";
    amountInput.value = "";
    categoryTouched = false;
    descriptionInput.focus();
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
  document.querySelectorAll(".menu-select.open, .month-picker.open").forEach((el) => el.classList.remove("open"));
  if (closeActiveDialog) closeActiveDialog();
  else if (!editModal.classList.contains("hidden")) closeEditModal();
});

/* ---------- menu, dívidas e ajustes ---------- */

const VIEWS = new Set(["home", "debts", "settings"]);
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
  if (name === "home") renderDashboard();
  if (scroll) window.scrollTo(0, 0);
}

function pinTabbar() {
  const bar = document.querySelector(".tabbar");
  const vv = window.visualViewport;
  if (!bar || !vv) return;
  const hiddenBelow = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
  bar.style.setProperty("--vv-shift", `${Math.round(hiddenBelow)}px`);
}

function bindNavigation() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
  window.addEventListener("hashchange", () => showView(viewFromHash(), false));
  pinTabbar();
  window.visualViewport?.addEventListener("resize", pinTabbar);
  window.visualViewport?.addEventListener("scroll", pinTabbar);
  window.addEventListener("resize", pinTabbar);
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

function resetDebtForm() {
  editingDebtId = null;
  debtForm?.reset();
  setDebtKind("credit_card");
  if (debtSubmit) debtSubmit.textContent = "Adicionar dívida";
  debtCancel?.classList.add("hidden");
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

function debtCard(debt, paid) {
  const article = document.createElement("article");
  article.className = "debt-item" + (paid ? " is-paid" : "");
  const info = paid ? null : dueMeta(debt.due_date);

  const top = document.createElement("div");
  top.className = "debt-top";
  const main = document.createElement("div");
  const title = document.createElement("div");
  title.className = "debt-title";
  title.textContent = debt.name;
  const meta = document.createElement("p");
  meta.className = "debt-meta";
  const parts = [];
  if (debt.due_date) parts.push(`${paid ? "Vencia " : ""}${formatDate(String(debt.due_date).slice(0, 10))}`);
  if (debt.notes) parts.push(debt.notes);
  meta.textContent = parts.join(" · ") || (paid ? "Quitada" : "Sem vencimento");
  const tags = document.createElement("div");
  tags.className = "debt-tags";
  const kind = document.createElement("span");
  kind.className = "tag";
  kind.textContent = DEBT_KINDS[debt.kind] || "Outro";
  tags.appendChild(kind);
  if (paid) {
    const tag = document.createElement("span");
    tag.className = "tag good";
    tag.textContent = "Paga";
    tags.appendChild(tag);
  } else if (info) {
    const tag = document.createElement("span");
    tag.className = `tag ${info.tone}`;
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
    actions.append(
      debtAction(ICON.check, "Marcar como paga", () => setDebtPaid(debt, true)),
      debtAction(ICON.edit, "Editar", () => startEditDebt(debt))
    );
  }
  actions.appendChild(debtAction(ICON.trash, "Excluir", () => removeDebt(debt), "delete"));
  article.append(top, actions);
  return article;
}

function renderDebts() {
  const open = debts.filter((d) => !d.paid_at);
  const paid = debts.filter((d) => d.paid_at);
  const total = open.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const openEl = document.getElementById("debt-open");
  const hint = document.getElementById("debt-open-hint");
  const nextEl = document.getElementById("debt-next");
  const nextHint = document.getElementById("debt-next-hint");
  const badge = document.getElementById("debt-badge");
  const count = document.getElementById("debt-count");
  const empty = document.getElementById("debt-empty");
  const paidCard = document.getElementById("debt-paid-card");
  if (openEl) openEl.textContent = money(total);
  if (hint) hint.textContent = open.length === 1 ? "1 dívida" : open.length ? `${open.length} dívidas` : "Nenhuma dívida";
  const upcoming = open.filter((d) => d.due_date).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
  const next = upcoming[0];
  if (nextEl && nextHint) {
    if (!next) {
      nextEl.textContent = "—";
      nextHint.textContent = open.length ? "Sem data marcada" : "Nada a pagar";
    } else {
      const info = dueMeta(next.due_date);
      nextEl.textContent = formatDate(String(next.due_date).slice(0, 10)).slice(0, 5);
      nextHint.textContent = info ? `${next.name} · ${info.text}` : next.name;
    }
  }
  if (badge) {
    badge.hidden = open.length === 0;
    badge.textContent = open.length > 9 ? "9+" : String(open.length);
  }
  if (count) count.textContent = open.length === 1 ? "1 em aberto" : `${open.length} em aberto`;
  const list = document.getElementById("debt-list");
  const paidList = document.getElementById("debt-paid-list");
  if (list) {
    list.replaceChildren();
    open.forEach((debt) => list.appendChild(debtCard(debt, false)));
  }
  if (paidCard) paidCard.hidden = paid.length === 0;
  if (paidList) {
    paidList.replaceChildren();
    paid.forEach((debt) => paidList.appendChild(debtCard(debt, true)));
  }
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

async function setDebtPaid(debt, paid) {
  try {
    await api("PUT", `/debts/${debt.id}`, debtPayloadFrom(debt, paid));
    await loadDebts();
    toast(paid ? "Dívida marcada como paga" : "Dívida reaberta");
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
  debtSubmit.textContent = "Salvar";
  debtCancel.classList.remove("hidden");
  debtForm.scrollIntoView({ behavior: "smooth", block: "start" });
  debtName.focus();
}

function bindDebts() {
  document.querySelectorAll("#debt-form [data-kind]").forEach((btn) => {
    btn.addEventListener("click", () => setDebtKind(btn.dataset.kind));
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
    const current = debts.find((d) => d.id === editingDebtId);
    const body = {
      name,
      amount,
      due_date: debtDue.value,
      kind: debtKind.value || "credit_card",
      notes: debtNotes.value.trim(),
      paid: Boolean(current?.paid_at),
    };
    debtSubmit.disabled = true;
    try {
      if (editingDebtId) {
        await api("PUT", `/debts/${editingDebtId}`, body);
        toast("Dívida atualizada");
      } else {
        await api("POST", "/debts", body);
        toast("Dívida adicionada");
      }
      resetDebtForm();
      await loadDebts();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      debtSubmit.disabled = false;
    }
  });
}

(async function init() {
  enhanceControls();
  buildChartPrefs();
  applyChartPrefs();
  bindNavigation();
  bindDebts();
  const start = viewFromHash();
  if (start !== "home") showView(start, false);
  if (previewMode) allTransactions = demoTransactions();
  if (!document.getElementById("view-home")?.hidden) renderDashboard();
  await loadCategories();
  await loadSettings();
  await Promise.all([loadTransactions(), loadDebts()]);
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
