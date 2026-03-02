// TOKEN E PROTEÇÃO
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

// MOSTRAR USUÁRIO NO TOPO (AVATAR + EMAIL)
const miniEmail = document.querySelector('.mini-email');
const avatar = document.getElementById('user-avatar');

if (token && miniEmail && avatar) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  miniEmail.textContent = payload.email;
  avatar.textContent = payload.email.charAt(0).toUpperCase();
}

// ELEMENTOS DA TELA
const form = document.getElementById('transaction-form');
const list = document.getElementById('transaction-list');
const incomeDisplay = document.getElementById('income');
const expenseDisplay = document.getElementById('expense');
const totalDisplay = document.getElementById('total');

const logoutBtn = document.getElementById('logout-btn');
const btnIncome = document.getElementById('btn-income');
const btnExpense = document.getElementById('btn-expense');
const typeInput = document.getElementById('type');

const monthFilter = document.getElementById('month-filter');
const clearFilterBtn = document.getElementById('clear-filter');

const chartMode = document.getElementById('chart-mode');

let currentMonth = "";
let chartType = 'doughnut';
let chart;

// LOGOUT
logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

// BOTÕES RECEITA / DESPESA
btnIncome?.addEventListener('click', () => {
  typeInput.value = 'income';
  btnIncome.classList.add('active');
  btnExpense.classList.remove('active');
});

btnExpense?.addEventListener('click', () => {
  typeInput.value = 'expense';
  btnExpense.classList.add('active');
  btnIncome.classList.remove('active');
});

// FILTRO POR MÊS
monthFilter?.addEventListener('change', () => {
  currentMonth = monthFilter.value;
  loadTransactions();
});

clearFilterBtn?.addEventListener('click', () => {
  currentMonth = "";
  if (monthFilter) monthFilter.value = "";
  loadTransactions();
});

// MODO DO GRÁFICO
chartMode?.addEventListener('change', () => {
  chartType = chartMode.value;
  loadTransactions();
});

// HEADERS COM TOKEN
function authHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: 'Bearer ' + token
  };
}

// MODAL EDITAR
const editModal = document.getElementById('edit-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelEditBtn = document.getElementById('cancel-edit');

const editForm = document.getElementById('edit-form');
const editDescription = document.getElementById('edit-description');
const editAmount = document.getElementById('edit-amount');

const editIncomeBtn = document.getElementById('edit-income');
const editExpenseBtn = document.getElementById('edit-expense');

let editingTransaction = null;
let editTypeValue = 'income';

function openEditModal(t) {
  editingTransaction = t;

  editDescription.value = t.description;
  editAmount.value = Number(t.amount).toFixed(2);
  editTypeValue = t.type;

  if (editTypeValue === 'income') {
    editIncomeBtn.classList.add('active');
    editExpenseBtn.classList.remove('active');
  } else {
    editExpenseBtn.classList.add('active');
    editIncomeBtn.classList.remove('active');
  }

  editModal.classList.remove('hidden');
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editingTransaction = null;
}

closeModalBtn?.addEventListener('click', closeEditModal);
cancelEditBtn?.addEventListener('click', closeEditModal);

editModal?.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) closeEditModal();
});

editIncomeBtn?.addEventListener('click', () => {
  editTypeValue = 'income';
  editIncomeBtn.classList.add('active');
  editExpenseBtn.classList.remove('active');
});

editExpenseBtn?.addEventListener('click', () => {
  editTypeValue = 'expense';
  editExpenseBtn.classList.add('active');
  editIncomeBtn.classList.remove('active');
});

// SALVAR EDIÇÃO
editForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!editingTransaction) return;

  const description = editDescription.value.trim();
  const amount = parseFloat(String(editAmount.value).replace(',', '.'));
  const type = editTypeValue;

  if (!description || Number.isNaN(amount)) {
    alert('Preencha corretamente.');
    return;
  }

  const response = await fetch(`/transactions/${editingTransaction.id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ description, amount, type })
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return;
  }

  closeEditModal();
  loadTransactions();
});

// DELETAR
async function deleteTransaction(id) {
  const response = await fetch(`/transactions/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return;
  }

  loadTransactions();
}

// CARREGAR TRANSAÇÕES
async function loadTransactions() {
  const url = currentMonth
    ? `/transactions?month=${encodeURIComponent(currentMonth)}`
    : '/transactions';

  const response = await fetch(url, {
    headers: authHeaders(),
    cache: 'no-store'
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return;
  }

  const transactions = await response.json();

  list.innerHTML = '';

  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    const li = document.createElement('li');

    const left = document.createElement('span');
    left.textContent = t.description;

    const right = document.createElement('div');

    const value = document.createElement('span');
    value.textContent = `R$ ${Number(t.amount).toFixed(2)}`;

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => openEditModal(t));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', () => deleteTransaction(t.id));

    right.appendChild(value);
    right.appendChild(editBtn);
    right.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);

    if (t.type === 'income') income += Number(t.amount);
    else expense += Number(t.amount);
  });

  const total = income - expense;

  incomeDisplay.textContent = `R$ ${income.toFixed(2)}`;
  expenseDisplay.textContent = `R$ ${expense.toFixed(2)}`;
  totalDisplay.textContent = `R$ ${total.toFixed(2)}`;

  updateChart(income, expense, transactions);
}

// ADICIONAR
form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = typeInput.value;

  if (!description || Number.isNaN(amount)) {
    alert('Preencha corretamente os campos.');
    return;
  }

  const response = await fetch('/transactions', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ description, amount, type })
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return;
  }

  form.reset();
  typeInput.value = 'income';
  btnIncome.classList.add('active');
  btnExpense.classList.remove('active');

  loadTransactions();
});

// GRÁFICO
function updateChart(income, expense, transactions) {
  const ctx = document.getElementById('financeChart');
  if (!ctx) return;

  if (chart) chart.destroy();

  if (chartType === 'doughnut') {
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Receitas', 'Despesas'],
        datasets: [{ data: [income, expense] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#ffffff' } }
        }
      }
    });
    return;
  }

  const byDay = new Map();

  transactions.forEach(t => {
    const day = String(t.date || '').slice(0, 10);
    if (!day) return;

    if (!byDay.has(day)) byDay.set(day, { income: 0, expense: 0 });

    const item = byDay.get(day);
    if (t.type === 'income') item.income += Number(t.amount);
    else item.expense += Number(t.amount);
  });

  const labels = Array.from(byDay.keys()).sort();
  const incomeData = labels.map(d => byDay.get(d).income);
  const expenseData = labels.map(d => byDay.get(d).expense);

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Receitas', data: incomeData },
        { label: 'Despesas', data: expenseData }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#ffffff' } }
      },
      scales: {
        x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,.08)' } },
        y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,.08)' } }
      }
    }
  });
}

// INICIALIZAÇÃO
loadTransactions();