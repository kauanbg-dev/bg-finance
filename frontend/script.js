const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

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
const KEYWORDS = [
  [/sal[aá]rio|pagamento|holerite/i, "Salário", "income"],
  [/freelance|freela|cliente/i, "Freelance", "income"],
  [/dividend|rendimento|juros/i, "Investimentos", "income"],
  [/mercado|ifood|padaria|restaurante|lanche|almo[cç]o|jantar|feira/i, "Alimentação", "expense"],
  [/aluguel|condom[ií]nio|luz|energia|água|agua|internet|iptu/i, "Moradia", "expense"],
  [/uber|99|gasolina|combust[ií]vel|passagem|estacionamento|metro|ônibus/i, "Transporte", "expense"],
  [/farm[aá]cia|m[eé]dic|plano de sa[uú]de|consulta/i, "Saúde", "expense"],
  [/netflix|spotify|prime|youtube|assinatura/i, "Assinaturas", "expense"],
  [/cinema|bar|viagem|show|lazer/i, "Lazer", "expense"],
  [/curso|faculdade|livro|escola/i, "Educação", "expense"],
];

function money(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
if (payload && miniEmail && avatar) {
  miniEmail.textContent = payload.email || "";
  avatar.textContent = (payload.email || "B").charAt(0).toUpperCase();
}

const form = document.getElementById("transaction-form");
const tbody = document.getElementById("transaction-list");
const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const totalDisplay = document.getElementById("total");
const savingsDisplay = document.getElementById("savings-rate");
const logoutBtn = document.getElementById("logout-btn");
const btnIncome = document.getElementById("btn-income");
const btnExpense = document.getElementById("btn-expense");
const typeInput = document.getElementById("type");
const monthFilter = document.getElementById("month-filter");
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

let allTransactions = [];
let apiCategories = [];
let sortKey = "date";
let sortDir = "desc";
let charts = {};

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

function categoriesFor(type) {
  const fromApi = apiCategories.filter((c) => c.type === type);
  if (fromApi.length) return fromApi;
  const names = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  return names.map((name) => ({ id: name, name, type }));
}

function fillCategorySelect(select, type, selected) {
  const cats = categoriesFor(type);
  select.innerHTML = cats
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");
  if (selected == null || selected === "") return;
  const match = cats.find(
    (c) => String(c.id) === String(selected) || c.name === selected
  );
  if (match) select.value = String(match.id);
}

function setType(type) {
  typeInput.value = type;
  btnIncome.classList.toggle("active", type === "income");
  btnExpense.classList.toggle("active", type === "expense");
  fillCategorySelect(categorySelect, type, categorySelect.value);
}

btnIncome?.addEventListener("click", () => setType("income"));
btnExpense?.addEventListener("click", () => setType("expense"));

if (dateInput && !dateInput.value) {
  dateInput.value = new Date().toISOString().slice(0, 10);
}
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
  return raw || new Date().toISOString().slice(0, 10);
}

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
  editAmount.value = Number(t.amount).toFixed(2);
  editTypeValue = t.type;
  editDate.value = txDate(t);
  fillCategorySelect(editCategory, t.type, t.category_id || inferCategory(t));
  editIncomeBtn.classList.toggle("active", t.type === "income");
  editExpenseBtn.classList.toggle("active", t.type === "expense");
  editModal.classList.remove("hidden");
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
  fillCategorySelect(editCategory, "income", editCategory.value);
});
editExpenseBtn?.addEventListener("click", () => {
  editTypeValue = "expense";
  editExpenseBtn.classList.add("active");
  editIncomeBtn.classList.remove("active");
  fillCategorySelect(editCategory, "expense", editCategory.value);
});

editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!editingTransaction) return;
  const description = editDescription.value.trim();
  const amount = parseFloat(String(editAmount.value).replace(",", "."));
  const type = editTypeValue;
  const category = editCategory.value;
  const date = editDate.value;
  if (!description || Number.isNaN(amount)) {
    alert("Preencha corretamente.");
    return;
  }
  const response = await fetch(`/transactions/${editingTransaction.id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      description,
      amount,
      type,
      category_id: Number(editCategory.value) || null,
      category: editCategory.selectedOptions[0]?.text,
      date,
    }),
  });
  if (handleAuth(response)) return;
  saveCategory(editingTransaction.id, editCategory.selectedOptions[0]?.text || category);
  closeEditModal();
  loadTransactions();
});

async function deleteTransaction(id) {
  const response = await fetch(`/transactions/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (handleAuth(response)) return;
  loadTransactions();
}

function filteredRows() {
  const month = monthFilter?.value || "";
  const type = typeFilter?.value || "";
  const cat = categoryFilter?.value || "";
  const q = (searchFilter?.value || "").trim().toLowerCase();
  return allTransactions.filter((t) => {
    const date = txDate(t);
    const category = inferCategory(t);
    if (month && !date.startsWith(month)) return false;
    if (type && t.type !== type) return false;
    if (cat && category !== cat) return false;
    if (q && !String(t.description).toLowerCase().includes(q)) return false;
    return true;
  });
}

function refreshCategoryFilter() {
  const current = categoryFilter.value;
  const cats = [...new Set(allTransactions.map(inferCategory))].sort();
  categoryFilter.innerHTML =
    `<option value="">Todas</option>` + cats.map((c) => `<option value="${c}">${c}</option>`).join("");
  if (cats.includes(current)) categoryFilter.value = current;
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
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = "";
  sorted.forEach((t) => {
    const tr = document.createElement("tr");
    const category = inferCategory(t);
    const cells = [txDate(t), t.description, category];
    cells.forEach((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    const typeTd = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = `tag ${t.type === "income" ? "income" : "expense"}`;
    tag.textContent = t.type === "income" ? "Receita" : "Despesa";
    typeTd.appendChild(tag);
    tr.appendChild(typeTd);

    const valTd = document.createElement("td");
    valTd.className = "num";
    valTd.textContent = `${t.type === "expense" ? "−" : ""}${money(t.amount)}`;
    tr.appendChild(valTd);

    const actTd = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => openEditModal(t));
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "🗑";
    delBtn.addEventListener("click", () => deleteTransaction(t.id));
    actions.append(editBtn, delBtn);
    actTd.appendChild(actions);
    tr.appendChild(actTd);
    tbody.appendChild(tr);
  });
  txCount.textContent = `${sorted.length} registro${sorted.length === 1 ? "" : "s"}`;
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

function chartDefaults() {
  Chart.defaults.color = "#e5e7eb";
  Chart.defaults.borderColor = "rgba(255,255,255,.08)";
  Chart.defaults.font.family = '"Segoe UI", sans-serif';
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    charts[id] = null;
  }
}

function tooltipBRL(ctx) {
  const v = ctx.parsed.y ?? ctx.parsed;
  return `${ctx.dataset.label}: ${money(v)}`;
}

function updateCharts(rows, income, expense) {
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
    if (!byCat.has(cat)) byCat.set(cat, 0);
    const m = byMonth.get(month);
    const d = byDay.get(date);
    if (t.type === "income") {
      m.income += amount;
      d.income += amount;
    } else {
      m.expense += amount;
      d.expense += amount;
      byCat.set(cat, byCat.get(cat) + amount);
    }
  });

  const months = Array.from(byMonth.keys()).sort();
  let running = 0;
  const saldo = months.map((m) => {
    const item = byMonth.get(m);
    running += item.income - item.expense;
    return running;
  });

  destroyChart("flow");
  charts.flow = new Chart(document.getElementById("chartFlow"), {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          type: "bar",
          label: "Receitas",
          data: months.map((m) => byMonth.get(m).income),
          backgroundColor: "rgba(52, 211, 153, .75)",
          yAxisID: "y",
        },
        {
          type: "bar",
          label: "Despesas",
          data: months.map((m) => byMonth.get(m).expense),
          backgroundColor: "rgba(248, 113, 113, .75)",
          yAxisID: "y",
        },
        {
          type: "line",
          label: "Saldo acumulado",
          data: saldo,
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96,165,250,.15)",
          tension: 0.25,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { label: tooltipBRL } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => money(v) } },
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { callback: (v) => money(v) },
        },
      },
    },
  });

  const catLabels = Array.from(byCat.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  destroyChart("category");
  charts.category = new Chart(document.getElementById("chartCategory"), {
    type: "bar",
    data: {
      labels: catLabels.map((c) => c[0]),
      datasets: [
        {
          label: "Despesas",
          data: catLabels.map((c) => c[1]),
          backgroundColor: [
            "#60a5fa",
            "#a78bfa",
            "#34d399",
            "#f87171",
            "#fbbf24",
            "#22d3ee",
            "#fb7185",
            "#c084fc",
            "#4ade80",
            "#94a3b8",
          ],
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: tooltipBRL } },
      },
      scales: {
        x: { ticks: { callback: (v) => money(v) } },
      },
    },
  });

  destroyChart("mix");
  const mixMode = chartMode?.value || "mix";
  const mixLabels = mixMode === "cats" ? catLabels.map((c) => c[0]) : ["Receitas", "Despesas"];
  const mixData = mixMode === "cats" ? catLabels.map((c) => c[1]) : [income, expense];
  charts.mix = new Chart(document.getElementById("chartMix"), {
    type: "doughnut",
    data: {
      labels: mixLabels,
      datasets: [
        {
          data: mixData,
          backgroundColor: ["#34d399", "#f87171", "#60a5fa", "#a78bfa", "#fbbf24", "#22d3ee", "#fb7185"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${money(ctx.parsed)}`,
          },
        },
      },
    },
  });

  const days = Array.from(byDay.keys()).sort();
  destroyChart("daily");
  charts.daily = new Chart(document.getElementById("chartDaily"), {
    type: "line",
    data: {
      labels: days,
      datasets: [
        {
          label: "Receitas",
          data: days.map((d) => byDay.get(d).income),
          borderColor: "#34d399",
          tension: 0.25,
        },
        {
          label: "Despesas",
          data: days.map((d) => byDay.get(d).expense),
          borderColor: "#f87171",
          tension: 0.25,
        },
        {
          label: "Saldo do dia",
          data: days.map((d) => byDay.get(d).income - byDay.get(d).expense),
          borderColor: "#60a5fa",
          borderDash: [6, 4],
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { label: tooltipBRL } },
      },
      scales: {
        y: { ticks: { callback: (v) => money(v) } },
      },
    },
  });
}

function renderPivot(rows) {
  const months = [...new Set(rows.map((t) => txDate(t).slice(0, 7)))].sort();
  const cats = [...new Set(rows.map(inferCategory))].sort();
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

  const head = ["Categoria", ...months.map((m) => m.slice(5) + "/" + m.slice(0, 4)), "Total"].map(
    (h) => `<th>${h}</th>`
  );
  const body = cats
    .map((c) => {
      let total = 0;
      const cells = months.map((m) => {
        const net = grid[c][m].income - grid[c][m].expense;
        total += net;
        return `<td class="num">${net ? money(net) : "—"}</td>`;
      });
      return `<tr><td>${c}</td>${cells.join("")}<td class="num"><strong>${money(total)}</strong></td></tr>`;
    })
    .join("");

  const totals = months.map((m) => {
    const sum = cats.reduce((acc, c) => acc + grid[c][m].income - grid[c][m].expense, 0);
    return `<td class="num"><strong>${money(sum)}</strong></td>`;
  });
  const grand = cats.reduce((acc, c) => {
    return acc + months.reduce((s, m) => s + grid[c][m].income - grid[c][m].expense, 0);
  }, 0);

  pivotWrap.innerHTML = `
    <table class="sheet pivot">
      <thead><tr>${head.join("")}</tr></thead>
      <tbody>${body}
        <tr><td><strong>Total</strong></td>${totals.join("")}<td class="num"><strong>${money(grand)}</strong></td></tr>
      </tbody>
    </table>`;
}

function renderDashboard() {
  const rows = filteredRows();
  let income = 0;
  let expense = 0;
  rows.forEach((t) => {
    if (t.type === "income") income += Number(t.amount);
    else expense += Number(t.amount);
  });
  const total = income - expense;
  const rate = income > 0 ? ((income - expense) / income) * 100 : 0;
  incomeDisplay.textContent = money(income);
  expenseDisplay.textContent = money(expense);
  totalDisplay.textContent = money(total);
  savingsDisplay.textContent = `${rate.toFixed(1)}%`;
  renderTable(rows);
  updateCharts(rows, income, expense);
  renderPivot(rows);
}

async function loadCategories() {
  const response = await fetch("/categories", { headers: authHeaders(), cache: "no-store" });
  if (handleAuth(response)) return;
  apiCategories = await response.json();
  fillCategorySelect(categorySelect, typeInput.value || "income");
}

async function loadTransactions() {
  const response = await fetch("/transactions", {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (handleAuth(response)) return;
  allTransactions = await response.json();
  refreshCategoryFilter();
  renderDashboard();
}

monthFilter?.addEventListener("change", renderDashboard);
typeFilter?.addEventListener("change", renderDashboard);
categoryFilter?.addEventListener("change", renderDashboard);
searchFilter?.addEventListener("input", renderDashboard);
chartMode?.addEventListener("change", renderDashboard);
clearFilterBtn?.addEventListener("click", () => {
  if (monthFilter) monthFilter.value = "";
  if (typeFilter) typeFilter.value = "";
  if (categoryFilter) categoryFilter.value = "";
  if (searchFilter) searchFilter.value = "";
  renderDashboard();
});

exportBtn?.addEventListener("click", () => {
  const rows = filteredRows();
  const lines = [["Data", "Descricao", "Categoria", "Tipo", "Valor"].join(";")];
  rows.forEach((t) => {
    lines.push(
      [txDate(t), `"${String(t.description).replace(/"/g, '""')}"`, inferCategory(t), t.type, Number(t.amount).toFixed(2)].join(";")
    );
  });
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bg-finance.csv";
  a.click();
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const description = document.getElementById("description").value.trim();
  const amount = parseFloat(String(document.getElementById("amount").value).replace(",", "."));
  const type = typeInput.value;
  const category = categorySelect.value;
  const date = dateInput.value;
  if (!description || Number.isNaN(amount)) {
    alert("Preencha corretamente os campos.");
    return;
  }
  const response = await fetch("/transactions", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      description,
      amount,
      type,
      category_id: Number(categorySelect.value) || null,
      category: categorySelect.selectedOptions[0]?.text,
      date,
    }),
  });
  if (handleAuth(response)) return;
  const created = await response.json().catch(() => null);
  if (created && created.id) {
    saveCategory(created.id, categorySelect.selectedOptions[0]?.text || category);
  }
  form.reset();
  typeInput.value = "income";
  dateInput.value = new Date().toISOString().slice(0, 10);
  setType("income");
  loadTransactions();
});

(async function init() {
  await loadCategories();
  await loadTransactions();
})();
