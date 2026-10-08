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
const miniEmail = document.querySelector(".mini-email");
const avatar = document.getElementById("user-avatar");
if (miniEmail && avatar) {
  const email = payload?.email || (previewMode ? "demo@bgfinance.app" : "");
  miniEmail.textContent = email;
  avatar.textContent = (email || "B").charAt(0).toUpperCase();
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

function askDialog({ title, text = "", placeholder = "", okLabel = "Confirmar", input = false }) {
  return new Promise((resolve) => {
    dialogTitle.textContent = title;
    dialogText.textContent = text;
    dialogField.classList.toggle("hidden", !input);
    dialogInput.value = "";
    dialogInput.placeholder = placeholder;
    dialogOk.textContent = okLabel;
    dialog.classList.remove("hidden");
    (input ? dialogInput : dialogOk).focus();

    const backdrop = dialog.querySelector(".modal-backdrop");
    const finish = (value) => {
      dialog.classList.add("hidden");
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

function previewApi(method, url, body) {
  if (url === "/categories") {
    if (method === "POST") return { id: `custom-${++previewSeq}`, name: body.name, type: body.type, user_id: 1 };
    return [];
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

  const catEntries = Array.from(byCat.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
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

  const mixMode = chartMode?.value || "mix";
  const mixLabels = mixMode === "cats" ? catEntries.map((c) => c[0]) : ["Receitas", "Despesas"];
  const mixData = mixMode === "cats" ? catEntries.map((c) => c[1]) : [income, expense];
  const mixColors = mixMode === "cats" ? catEntries.map((c) => catColor(c[0])) : ["#34d399", "#f87171"];
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

  const days = Array.from(byDay.keys()).sort();
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

(async function init() {
  enhanceControls();
  if (previewMode) allTransactions = demoTransactions();
  renderDashboard();
  await loadCategories();
  await loadTransactions();
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
