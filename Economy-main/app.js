'use strict';

const STORAGE_KEY = 'mi-dinero-static-v1';
const LEGACY_STORAGE_KEY = 'mi-dinero-html-simple';

const defaultData = {
  accounts: [
    { id: 1, name: 'Bancolombia', type: 'Cuenta corriente', balance: 6842500 },
    { id: 2, name: 'Nequi', type: 'Billetera digital', balance: 842300 },
    { id: 3, name: 'Efectivo', type: 'Billetera física', balance: 156000 }
  ],
  movements: [
    { id: 1, name: 'Pago de nómina', category: 'Salario', account: 'Bancolombia', date: 'Hoy', type: 'Ingreso', amount: 4800000 },
    { id: 2, name: 'Mercado semanal', category: 'Alimentación', account: 'Nequi', date: 'Ayer', type: 'Egreso', amount: 186500 },
    { id: 3, name: 'Aporte fondo de emergencia', category: 'Ahorro', account: 'Bancolombia', date: 'Ayer', type: 'Egreso', amount: 350000 },
    { id: 4, name: 'Transporte', category: 'Movilidad', account: 'Efectivo', date: 'Lun', type: 'Egreso', amount: 42000 }
  ],
  goals: [
    { id: 1, name: 'Vacaciones', target: 5000000, saved: 3200000, deadline: 'Jun 2027' },
    { id: 2, name: 'Fondo de emergencia', target: 2500000, saved: 1800000, deadline: 'Abr 2027' }
  ],
  recurring: [
    { id: 1, name: 'Internet', amount: 52000, day: 4, account: 'Bancolombia' },
    { id: 2, name: 'Plan de celular', amount: 35000, day: 12, account: 'Nequi' }
  ]
};

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

const elements = {
  total: document.getElementById('total-balance'),
  income: document.getElementById('income-total'),
  expense: document.getElementById('expense-total'),
  recentMovements: document.getElementById('recent-movements-list'),
  allMovements: document.getElementById('all-movements-list'),
  accounts: document.getElementById('accounts-list'),
  goals: document.getElementById('goals-list'),
  recurring: document.getElementById('recurring-list'),
  filter: document.getElementById('movement-filter'),
  status: document.getElementById('status-message'),
  backdrop: document.getElementById('modal-backdrop'),
  modalTitle: document.getElementById('modal-title'),
  form: document.getElementById('entry-form'),
  name: document.getElementById('entry-name'),
  nameLabel: document.getElementById('name-label'),
  type: document.getElementById('entry-type'),
  category: document.getElementById('entry-category'),
  account: document.getElementById('entry-account'),
  accountType: document.getElementById('entry-account-type'),
  accountTypeField: document.getElementById('account-type-field'),
  movementFields: document.getElementById('movement-fields'),
  amount: document.getElementById('entry-amount'),
  amountLabel: document.getElementById('amount-label')
};

let storageWarning = '';
const state = loadData();
let balanceHidden = false;
let returnFocusTo = null;

function copyDefaultData() {
  return JSON.parse(JSON.stringify(defaultData));
}

function loadData() {
  let saved;
  let sourceKey = STORAGE_KEY;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      sourceKey = LEGACY_STORAGE_KEY;
      saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    storageWarning = 'El navegador no permite guardar datos. Los cambios solo estarán disponibles mientras esta página siga abierta.';
    return copyDefaultData();
  }

  if (!saved) return copyDefaultData();

  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') throw new Error('Formato no válido');

    const accounts = Array.isArray(parsed.accounts)
      ? parsed.accounts.filter((item) =>
        item && Number.isFinite(Number(item.id)) && typeof item.name === 'string' &&
        typeof item.type === 'string' && Number.isFinite(Number(item.balance))
      ).map((item) => ({
        id: Number(item.id),
        name: item.name.slice(0, 80),
        type: item.type.slice(0, 50),
        balance: Number(item.balance)
      }))
      : [];

    const accountNames = new Set(accounts.map((account) => account.name));
    const movements = Array.isArray(parsed.movements)
      ? parsed.movements.filter((item) =>
        item && Number.isFinite(Number(item.id)) && typeof item.name === 'string' &&
        typeof item.category === 'string' && accountNames.has(item.account) &&
        (item.type === 'Ingreso' || item.type === 'Egreso') &&
        Number.isFinite(Number(item.amount)) && Number(item.amount) > 0
      ).map((item) => ({
        id: Number(item.id),
        name: item.name.slice(0, 80),
        category: item.category.slice(0, 50),
        account: item.account,
        date: typeof item.date === 'string' ? item.date.slice(0, 40) : '',
        type: item.type,
        amount: Number(item.amount)
      }))
      : [];

    const goals = Array.isArray(parsed.goals) ? parsed.goals.filter((goal) =>
      goal && typeof goal.name === 'string' && Number(goal.target) > 0 &&
      Number.isFinite(Number(goal.saved))
    ) : [];
    const recurring = Array.isArray(parsed.recurring) ? parsed.recurring.filter((payment) =>
      payment && typeof payment.name === 'string' && Number(payment.amount) >= 0 &&
      Number.isFinite(Number(payment.day))
    ) : [];

    const data = { accounts, movements, goals, recurring };
    if (sourceKey === LEGACY_STORAGE_KEY) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        storageWarning = 'Tus datos anteriores se cargaron, pero el navegador no permitió crear una copia actualizada.';
      }
    }
    return data;
  } catch {
    storageWarning = 'No se pudieron leer los datos guardados; se cargaron los datos de ejemplo.';
    return copyDefaultData();
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showMessage('No se pudieron guardar los cambios en este navegador.', true);
    return false;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatCOP(value) {
  return moneyFormatter.format(value);
}

function showMessage(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle('error', isError);
  window.clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = window.setTimeout(() => {
    elements.status.textContent = '';
    elements.status.classList.remove('error');
  }, 6000);
}

function renderSummary() {
  const income = state.movements
    .filter((movement) => movement.type === 'Ingreso')
    .reduce((sum, movement) => sum + movement.amount, 0);
  const expense = state.movements
    .filter((movement) => movement.type === 'Egreso')
    .reduce((sum, movement) => sum + movement.amount, 0);
  const balance = state.accounts.reduce((sum, account) => sum + account.balance, 0);

  elements.total.textContent = balanceHidden ? '••••••••' : formatCOP(balance);
  elements.income.textContent = formatCOP(income);
  elements.expense.textContent = formatCOP(expense);
}

function movementMarkup(movement, canDelete = false) {
  const isIncome = movement.type === 'Ingreso';
  return `
    <article class="movement">
      <span class="movement-icon ${isIncome ? 'income' : 'expense'}" aria-hidden="true">${isIncome ? '↑' : '↓'}</span>
      <div class="movement-detail">
        <strong>${escapeHtml(movement.name)}</strong>
        <span>${escapeHtml(movement.category)} · ${escapeHtml(movement.account)}</span>
      </div>
      <div class="movement-meta">
        <strong class="${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : '−'}${formatCOP(movement.amount)}</strong>
        <span>${escapeHtml(movement.date)}</span>
      </div>
      ${canDelete ? `<button class="delete-movement" type="button" data-delete-movement="${Number(movement.id)}" aria-label="Eliminar ${escapeHtml(movement.name)}">×</button>` : ''}
    </article>
  `;
}

function renderMovements() {
  const sorted = [...state.movements].sort((a, b) => b.id - a.id);
  elements.recentMovements.innerHTML = sorted.length
    ? sorted.slice(0, 4).map((movement) => movementMarkup(movement)).join('')
    : '<p class="empty-state">Todavía no tienes movimientos.</p>';

  const filter = elements.filter.value;
  const filtered = filter === 'Todos' ? sorted : sorted.filter((movement) => movement.type === filter);
  elements.allMovements.innerHTML = filtered.length
    ? filtered.map((movement) => movementMarkup(movement, true)).join('')
    : '<p class="empty-state">No hay movimientos para mostrar.</p>';
}

function accountStyle(name) {
  const normalized = name.toLocaleLowerCase('es');
  if (normalized.includes('nequi')) return 'nequi';
  if (normalized.includes('efectivo')) return 'cash';
  return '';
}

function renderAccounts() {
  elements.accounts.innerHTML = state.accounts.length
    ? state.accounts.map((account) => `
      <div class="account">
        <span class="account-logo ${accountStyle(account.name)}" aria-hidden="true">${escapeHtml(account.name.slice(0, 1).toUpperCase())}</span>
        <div class="account-detail"><strong>${escapeHtml(account.name)}</strong><span>${escapeHtml(account.type)}</span></div>
        <span class="account-balance">${formatCOP(account.balance)}</span>
      </div>
    `).join('')
    : '<p class="empty-state">Agrega una cuenta para comenzar.</p>';

  elements.account.innerHTML = state.accounts.map((account) =>
    `<option value="${escapeHtml(account.name)}">${escapeHtml(account.name)}</option>`
  ).join('');
}

function renderGoals() {
  elements.goals.innerHTML = state.goals.length
    ? state.goals.map((goal) => {
      const target = Number(goal.target);
      const saved = Number(goal.saved);
      const progress = Math.min(Math.max((saved / target) * 100, 0), 100);
      return `
        <div class="goal-item">
          <div class="goal-main">
            <div class="goal-name">${escapeHtml(goal.name)}</div>
            <div class="goal-amounts">${formatCOP(saved)} de ${formatCOP(target)}</div>
            <div class="progress" role="progressbar" aria-label="Progreso de ${escapeHtml(goal.name)}" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100">
              <span style="width:${progress}%"></span>
            </div>
          </div>
          <span class="goal-tag">${escapeHtml(goal.deadline || 'Sin fecha')}</span>
        </div>
      `;
    }).join('')
    : '<p class="empty-state">Todavía no tienes metas de ahorro.</p>';
}

function renderRecurring() {
  elements.recurring.innerHTML = state.recurring.length
    ? [...state.recurring].sort((a, b) => Number(a.day) - Number(b.day)).map((payment) => `
      <div class="recurring-item">
        <span class="date-box"><strong>${escapeHtml(payment.day)}</strong><small>del mes</small></span>
        <div class="recurring-info"><strong>${escapeHtml(payment.name)}</strong><span>${escapeHtml(payment.account || 'Sin cuenta')}</span></div>
        <span class="recurring-amount">${formatCOP(Number(payment.amount))}</span>
      </div>
    `).join('')
    : '<p class="empty-state">No tienes pagos registrados.</p>';
}

function render() {
  renderSummary();
  renderMovements();
  renderAccounts();
  renderGoals();
  renderRecurring();
}

function openModal(mode) {
  if (mode === 'movement' && !state.accounts.length) {
    showMessage('Primero agrega una cuenta para poder registrar un movimiento.', true);
    return;
  }

  elements.form.reset();
  elements.form.dataset.mode = mode;
  const isAccount = mode === 'account';
  elements.modalTitle.textContent = isAccount ? 'Agregar cuenta' : 'Nuevo movimiento';
  elements.nameLabel.textContent = isAccount ? 'Nombre de la cuenta' : 'Nombre del movimiento';
  elements.amountLabel.textContent = isAccount ? 'Saldo inicial (COP)' : 'Monto (COP)';
  elements.movementFields.hidden = isAccount;
  elements.accountTypeField.hidden = !isAccount;
  elements.category.required = !isAccount;
  elements.account.required = !isAccount;
  elements.accountType.required = isAccount;
  elements.amount.min = isAccount ? '0' : '1';
  elements.amount.value = isAccount ? '0' : '';
  elements.category.placeholder = 'Ej. Alimentación';
  returnFocusTo = document.activeElement;
  elements.backdrop.classList.remove('hidden');
  elements.backdrop.setAttribute('aria-hidden', 'false');
  elements.name.focus();
}

function closeModal() {
  elements.backdrop.classList.add('hidden');
  elements.backdrop.setAttribute('aria-hidden', 'true');
  if (returnFocusTo instanceof HTMLElement) returnFocusTo.focus();
}

function addMovement() {
  const name = elements.name.value.trim();
  const category = elements.category.value.trim();
  const accountName = elements.account.value;
  const amount = Number(elements.amount.value);
  const account = state.accounts.find((item) => item.name === accountName);

  if (!name || !category || !account || !Number.isFinite(amount) || amount <= 0) {
    showMessage('Completa los campos e ingresa un monto mayor que cero.', true);
    return;
  }

  const type = elements.type.value;
  account.balance += type === 'Ingreso' ? amount : -amount;
  state.movements.push({
    id: Date.now(),
    name,
    category,
    account: account.name,
    date: new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    type,
    amount
  });

  const saved = saveData();
  render();
  closeModal();
  if (saved) showMessage(type === 'Ingreso' ? 'Ingreso guardado y saldo actualizado.' : 'Gasto guardado y saldo actualizado.');
}

function addAccount() {
  const name = elements.name.value.trim();
  const type = elements.accountType.value.trim();
  const balance = Number(elements.amount.value);

  if (!name || !type || !Number.isFinite(balance) || balance < 0) {
    showMessage('Completa los campos e ingresa un saldo válido.', true);
    return;
  }
  if (state.accounts.some((account) => account.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) {
    showMessage('Ya existe una cuenta con ese nombre.', true);
    return;
  }

  state.accounts.push({ id: Date.now(), name, type, balance });
  const saved = saveData();
  render();
  closeModal();
  if (saved) showMessage('Cuenta agregada correctamente.');
}

function deleteMovement(id) {
  const index = state.movements.findIndex((movement) => movement.id === id);
  if (index < 0) return;

  const movement = state.movements[index];
  if (!window.confirm(`¿Eliminar el movimiento «${movement.name}»? Se corregirá el saldo de la cuenta.`)) return;

  const account = state.accounts.find((item) => item.name === movement.account);
  if (account) account.balance += movement.type === 'Ingreso' ? -movement.amount : movement.amount;
  state.movements.splice(index, 1);
  const saved = saveData();
  render();
  if (saved) showMessage('Movimiento eliminado y saldo corregido.');
}

function updateNavigation() {
  const hash = window.location.hash || '#resumen';
  const currentHash = hash === '#todos-los-movimientos' ? '#movimientos-section' : hash;
  document.querySelectorAll('.nav-item').forEach((link) => {
    const active = link.getAttribute('href') === currentHash;
    link.classList.toggle('active', active);
    if (active) document.getElementById('breadcrumb-current').textContent = `/ ${link.textContent.trim()}`;
  });
}

function exportData() {
  const file = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mi-dinero-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showMessage('Respaldo descargado.');
}

function resetData() {
  if (!window.confirm('Se reemplazarán tus datos actuales por los datos de ejemplo. ¿Continuar?')) return;
  const defaults = copyDefaultData();
  state.accounts = defaults.accounts;
  state.movements = defaults.movements;
  state.goals = defaults.goals;
  state.recurring = defaults.recurring;
  const saved = saveData();
  render();
  if (saved) showMessage('Se restauraron los datos de ejemplo.');
}

document.getElementById('add-movement-btn').addEventListener('click', () => openModal('movement'));
document.getElementById('add-account-btn').addEventListener('click', () => openModal('account'));
document.getElementById('add-account-secondary').addEventListener('click', () => openModal('account'));
document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('cancel-form').addEventListener('click', closeModal);
document.getElementById('help-button').addEventListener('click', () => {
  showMessage('Agrega cuentas y registra ingresos o gastos. Tus datos se guardan en este navegador; puedes descargarlos desde Configuración.');
});
document.getElementById('toggle-balance').addEventListener('click', (event) => {
  balanceHidden = !balanceHidden;
  event.currentTarget.setAttribute('aria-pressed', String(balanceHidden));
  event.currentTarget.setAttribute('aria-label', balanceHidden ? 'Mostrar balance' : 'Ocultar balance');
  renderSummary();
});
document.getElementById('export-data-btn').addEventListener('click', exportData);
document.getElementById('reset-data-btn').addEventListener('click', resetData);
elements.filter.addEventListener('change', renderMovements);
elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!elements.form.reportValidity()) return;
  if (elements.form.dataset.mode === 'account') addAccount();
  else addMovement();
});
elements.allMovements.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-movement]');
  if (button) deleteMovement(Number(button.dataset.deleteMovement));
});
elements.backdrop.addEventListener('click', (event) => {
  if (event.target === elements.backdrop) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !elements.backdrop.classList.contains('hidden')) closeModal();
});
window.addEventListener('hashchange', updateNavigation);

render();
updateNavigation();
if (storageWarning) showMessage(storageWarning, true);
