const KEY = “meu-salario-japao-v3”;

const initial = {
month: new Date().toISOString().slice(0, 7),

salary: {
base: 250000,
normal: 160,
ot: 25,
night: 25,
nightFixed: 1500,
benefits: 0,
deductions: 0
},

days: {},
expenses: [],
name: “”
};

function cloneInitial() {
return JSON.parse(JSON.stringify(initial));
}

function loadData() {
try {
const saved = JSON.parse(localStorage.getItem(KEY));

if (!saved) {
  return cloneInitial();
}
return {
  ...cloneInitial(),
  ...saved,
  salary: {
    ...initial.salary,
    ...(saved.salary || {})
  },
  days: saved.days || {},
  expenses: Array.isArray(saved.expenses)
    ? saved.expenses
    : [],
  name: saved.name || ""
};

} catch {
return cloneInitial();
}
}

let data = loadData();
let viewMonth = data.month;

/* =========================
ELEMENTOS
========================= */

const grossEl = document.getElementById(“gross”);
const overtimeEl = document.getElementById(“overtime”);
const netEl = document.getElementById(“net”);
const availableEl = document.getElementById(“available”);

const monthTitleEl = document.getElementById(“monthTitle”);
const daysEl = document.getElementById(“days”);
const limitTextEl = document.getElementById(“limitText”);

const baseSalaryEl = document.getElementById(“baseSalary”);
const normalHoursEl = document.getElementById(“normalHours”);
const otRateEl = document.getElementById(“otRate”);
const nightRateEl = document.getElementById(“nightRate”);
const nightFixedEl = document.getElementById(“nightFixed”);
const benefitsEl = document.getElementById(“benefits”);
const deductionsEl = document.getElementById(“deductions”);

const userNameEl = document.getElementById(“userName”);

const expensesListEl = document.getElementById(“expensesList”);
const expenseTotalEl = document.getElementById(“expenseTotal”);

const prevMonthBtn = document.getElementById(“prevMonth”);
const nextMonthBtn = document.getElementById(“nextMonth”);

const saveSalaryBtn = document.getElementById(“saveSalary”);
const addExpenseBtn = document.getElementById(“addExpense”);

const exportBtn = document.getElementById(“exportBtn”);
const importFileEl = document.getElementById(“importFile”);
const resetBtn = document.getElementById(“resetBtn”);

const installBtn = document.getElementById(“installBtn”);

/* =========================
AUXILIARES
========================= */

function yen(value) {
return new Intl.NumberFormat(“ja-JP”, {
style: “currency”,
currency: “JPY”,
maximumFractionDigits: 0
}).format(Math.round(Number(value) || 0));
}

function saveData() {
data.month = viewMonth;
localStorage.setItem(KEY, JSON.stringify(data));
}

function daysInMonth(yearMonth) {
const [year, month] = yearMonth.split(”-”).map(Number);
return new Date(year, month, 0).getDate();
}

function dateKey(day) {
return ${viewMonth}-${String(day).padStart(2, "0")};
}

function formatMonth(yearMonth) {
const date = new Date(${yearMonth}-01T12:00:00);

return date.toLocaleDateString(“pt-BR”, {
month: “long”,
year: “numeric”
});
}

function minutes(time) {
if (!time || !time.includes(”:”)) {
return null;
}

const parts = time.split(”:”).map(Number);

if (
parts.length !== 2 ||
Number.isNaN(parts[0]) ||
Number.isNaN(parts[1])
) {
return null;
}

return parts[0] * 60 + parts[1];
}

/* =========================
CALCULAR HORAS
========================= */

function calculateHours(start, end, breakHours) {

const startMin = minutes(start);
const endMin = minutes(end);

if (startMin === null || endMin === null) {
return 0;
}

let total = endMin - startMin;

if (total < 0) {
total += 24 * 60;
}

const breakMin =
Math.max(0, Number(breakHours) || 0) * 60;

total -= breakMin;

if (total < 0) {
total = 0;
}

return total / 60;
}

/* =========================
DIA PADRÃO
========================= */

function defaultDay() {
return {
status: “worked”,
start: “08:00”,
end: “17:00”,
break: 1,
hours: 8,
night: 0
};
}

/* =========================
CÁLCULO DO MÊS
========================= */

function calculateMonth() {

let totalHours = 0;
let totalOvertime = 0;
let totalNight = 0;
let nightDays = 0;

Object.keys(data.days).forEach(key => {

if (!key.startsWith(viewMonth)) {
  return;
}
const day = data.days[key];
if (!day || day.status !== "worked") {
  return;
}
const hours =
  Number(day.hours) || 0;
const overtime =
  Math.max(0, hours - 8);
const night =
  Math.max(0, Number(day.night) || 0);
totalHours += hours;
totalOvertime += overtime;
totalNight += night;
if (night > 0) {
  nightDays++;
}

});

const base =
Number(data.salary.base) || 0;

const normal =
Number(data.salary.normal) || 160;

const hourly =
normal > 0
? base / normal
: 0;

const otPercent =
(Number(data.salary.ot) || 0) / 100;

const nightPercent =
(Number(data.salary.night) || 0) / 100;

const overtimePay =
hourly *
otPercent *
totalOvertime;

const nightPay =
hourly *
nightPercent *
totalNight;

const nightFixedPay =
nightDays *
(Number(data.salary.nightFixed) || 0);

const benefits =
Number(data.salary.benefits) || 0;

const deductions =
Number(data.salary.deductions) || 0;

const expenses =
data.expenses.reduce(
(sum, expense) =>
sum + (Number(expense.amount) || 0),
0
);

const gross =
base +
overtimePay +
nightPay +
nightFixedPay +
benefits;

const net =
gross - deductions;

const available =
net - expenses;

return {
totalHours,
totalOvertime,
totalNight,
nightDays,
overtimePay,
nightPay,
nightFixedPay,
gross,
net,
expenses,
available
};
}

/* =========================
ATUALIZAR TOPO
========================= */

function updateSummary() {

const result =
calculateMonth();

grossEl.textContent =
yen(result.gross);

overtimeEl.textContent =
result.totalOvertime.toFixed(1) + “h”;

netEl.textContent =
yen(result.net);

availableEl.textContent =
yen(result.available);

limitTextEl.textContent =
result.totalOvertime.toFixed(1) +
“h / 45h”;
}

/* =========================
SALÁRIO
========================= */

function renderSalary() {

baseSalaryEl.value =
data.salary.base;

normalHoursEl.value =
data.salary.normal;

otRateEl.value =
data.salary.ot;

nightRateEl.value =
data.salary.night;

nightFixedEl.value =
data.salary.nightFixed;

benefitsEl.value =
data.salary.benefits;

deductionsEl.value =
data.salary.deductions;

userNameEl.value =
data.name || “”;
}

/* =========================
DIAS
========================= */

function renderDays() {

daysEl.innerHTML = “”;

const totalDays =
daysInMonth(viewMonth);

for (
let number = 1;
number <= totalDays;
number++
) {

const key =
  dateKey(number);
const day =
  data.days[key]
    ? {
        ...defaultDay(),
        ...data.days[key]
      }
    : defaultDay();
const date =
  new Date(`${key}T12:00:00`);
const weekday =
  date.toLocaleDateString(
    "pt-BR",
    { weekday: "short" }
  );
const container =
  document.createElement("div");
container.className = "day";
container.innerHTML = `
  <div class="dayhead">
    <span class="daydate">
      ${String(number).padStart(2, "0")}
      · ${weekday}
    </span>
    <span class="badge">
      ${
        day.status === "worked"
          ? "Trabalho"
          : day.status === "off"
          ? "Folga"
          : day.status === "yukyu"
          ? "Yūkyū"
          : "Falta"
      }
    </span>
  </div>
  <div class="grid">
    <label>
      Status
      <select
        data-key="${key}"
        data-field="status"
      >
        <option value="worked">Trabalho</option>
        <option value="off">Folga</option>
        <option value="yukyu">Yūkyū</option>
        <option value="absent">Falta</option>
      </select>
    </label>
    <label>
      Horas trabalhadas
      <input
        data-key="${key}"
        data-field="hours"
        type="number"
        step="0.25"
        min="0"
        max="24"
        value="${day.hours}"
      >
    </label>
    <label>
      Entrada
      <input
        data-key="${key}"
        data-field="start"
        type="time"
        value="${day.start}"
      >
    </label>
    <label>
      Saída
      <input
        data-key="${key}"
        data-field="end"
        type="time"
        value="${day.end}"
      >
    </label>
    <label>
      Intervalo (h)
      <input
        data-key="${key}"
        data-field="break"
        type="number"
        step="0.25"
        min="0"
        max="12"
        value="${day.break}"
      >
    </label>
    <label>
      Horas noturnas
      <input
        data-key="${key}"
        data-field="night"
        type="number"
        step="0.25"
        min="0"
        max="24"
        value="${day.night}"
      >
    </label>
  </div>
`;
const controls =
  container.querySelectorAll(
    "input, select"
  );
controls.forEach(control => {
  control.value =
    day[control.dataset.field];
  control.addEventListener(
    "input",
    () => {
      const field =
        control.dataset.field;
      if (!data.days[key]) {
        data.days[key] =
          defaultDay();
      }
      let value =
        control.value;
      if (
        control.type === "number"
      ) {
        value =
          Number(value) || 0;
      }
      data.days[key][field] =
        value;
      /*
       * Entrada, saída ou intervalo
       * recalculam automaticamente
       * as horas trabalhadas.
       */
      if (
        field === "start" ||
        field === "end" ||
        field === "break"
      ) {
        const calculated =
          calculateHours(
            data.days[key].start,
            data.days[key].end,
            data.days[key].break
          );
        data.days[key].hours =
          Math.round(
            calculated * 4
          ) / 4;
      }
      saveData();
      updateSummary();
    }
  );
  control.addEventListener(
    "change",
    () => {
      const field =
        control.dataset.field;
      if (
        field === "start" ||
        field === "end" ||
        field === "break"
      ) {
        const calculated =
          calculateHours(
            data.days[key].start,
            data.days[key].end,
            data.days[key].break
          );
        data.days[key].hours =
          Math.round(
            calculated * 4
          ) / 4;
      }
      saveData();
      renderDays();
      updateSummary();
    }
  );
});
daysEl.appendChild(container);

}
}

/* =========================
DESPESAS
========================= */

function escapeHTML(value) {
return String(value ?? “”)
.replace(/&/g, “&”)
.replace(/</g, “<”)
.replace(/>/g, “>”)
.replace(/”/g, “"”)
.replace(/’/g, “'”);
}

function renderExpenses() {

expensesListEl.innerHTML = “”;

if (!data.expenses.length) {

expensesListEl.innerHTML =
  '<p class="note">Nenhuma despesa cadastrada.</p>';

} else {

data.expenses.forEach(
  (expense, index) => {
    const row =
      document.createElement("div");
    row.className =
      "expense";
    row.innerHTML = `
      <span>
        ${escapeHTML(expense.name)}
        <br>
        <small>
          ${yen(expense.amount)}
        </small>
      </span>
      <button>
        Excluir
      </button>
    `;
    row
      .querySelector("button")
      .addEventListener(
        "click",
        () => {
          data.expenses.splice(
            index,
            1
          );
          saveData();
          renderExpenses();
          updateSummary();
        }
      );
    expensesListEl.appendChild(row);
  }
);

}

expenseTotalEl.textContent =
yen(
calculateMonth().expenses
);
}

/* =========================
ABAS
========================= */

document
.querySelectorAll(”.tab”)
.forEach(button => {

button.addEventListener(
  "click",
  () => {
    document
      .querySelectorAll(".tab")
      .forEach(tab =>
        tab.classList.remove("active")
      );
    document
      .querySelectorAll(".panel")
      .forEach(panel =>
        panel.classList.remove("active")
      );
    button.classList.add("active");
    const panel =
      document.getElementById(
        button.dataset.tab
      );
    if (panel) {
      panel.classList.add("active");
    }
  }
);

});

/* =========================
MUDAR MÊS
========================= */

prevMonthBtn.addEventListener(
“click”,
() => {

const date =
  new Date(
    `${viewMonth}-01T12:00:00`
  );
date.setMonth(
  date.getMonth() - 1
);
viewMonth =
  date.toISOString()
    .slice(0, 7);
saveData();
render();

}
);

nextMonthBtn.addEventListener(
“click”,
() => {

const date =
  new Date(
    `${viewMonth}-01T12:00:00`
  );
date.setMonth(
  date.getMonth() + 1
);
viewMonth =
  date.toISOString()
    .slice(0, 7);
saveData();
render();

}
);

/* =========================
SALVAR SALÁRIO
========================= */

saveSalaryBtn.addEventListener(
“click”,
() => {

data.salary = {
  base:
    Number(baseSalaryEl.value) || 0,
  normal:
    Number(normalHoursEl.value) || 160,
  ot:
    Number(otRateEl.value) || 0,
  night:
    Number(nightRateEl.value) || 0,
  nightFixed:
    Number(nightFixedEl.value) || 0,
  benefits:
    Number(benefitsEl.value) || 0,
  deductions:
    Number(deductionsEl.value) || 0
};
data.name =
  userNameEl.value.trim();
saveData();
updateSummary();
alert(
  "Salário salvo com sucesso!"
);

}
);

/* =========================
NOME
========================= */

userNameEl.addEventListener(
“change”,
() => {

data.name =
  userNameEl.value.trim();
saveData();

}
);

/* =========================
DESPESA
========================= */

addExpenseBtn.addEventListener(
“click”,
() => {

const name =
  prompt(
    "Nome da despesa:"
  );
if (!name) {
  return;
}
const amount =
  Number(
    prompt(
      "Valor em ¥:"
    )
  );
if (
  Number.isFinite(amount) &&
  amount > 0
) {
  data.expenses.push({
    name: name.trim(),
    amount
  });
  saveData();
  renderExpenses();
  updateSummary();
}

}
);

/* =========================
BACKUP
========================= */

exportBtn.addEventListener(
“click”,
() => {

const blob =
  new Blob(
    [
      JSON.stringify(
        data,
        null,
        2
      )
    ],
    {
      type:
        "application/json"
    }
  );
const url =
  URL.createObjectURL(blob);
const link =
  document.createElement("a");
link.href = url;
link.download =
  "meu-salario-japao-backup.json";
document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(url);

}
);

/* =========================
IMPORTAR
========================= */

importFileEl.addEventListener(
“change”,
event => {

const file =
  event.target.files[0];
if (!file) {
  return;
}
const reader =
  new FileReader();
reader.onload = () => {
  try {
    const imported =
      JSON.parse(
        reader.result
      );
    data = {
      ...cloneInitial(),
      ...imported,
      salary: {
        ...initial.salary,
        ...(imported.salary || {})
      },
      days:
        imported.days || {},
      expenses:
        Array.isArray(
          imported.expenses
        )
          ? imported.expenses
          : [],
      name:
        imported.name || ""
    };
    viewMonth =
      data.month;
    saveData();
    render();
    alert(
      "Backup importado com sucesso!"
    );
  } catch {
    alert(
      "Arquivo inválido."
    );
  }
  importFileEl.value = "";
};
reader.readAsText(file);

}
);

/* =========================
RESET
========================= */

resetBtn.addEventListener(
“click”,
() => {

if (
  !confirm(
    "Apagar todos os dados deste aparelho?"
  )
) {
  return;
}
data =
  cloneInitial();
viewMonth =
  data.month;
saveData();
render();

}
);

/* =========================
PWA
========================= */

let deferredPrompt = null;

window.addEventListener(
“beforeinstallprompt”,
event => {

event.preventDefault();
deferredPrompt =
  event;
if (installBtn) {
  installBtn.hidden = false;
}

}
);

if (installBtn) {

installBtn.addEventListener(
“click”,
async () => {

  if (!deferredPrompt) {
    return;
  }
  deferredPrompt.prompt();
  try {
    await deferredPrompt.userChoice;
  } catch {}
  deferredPrompt = null;
  installBtn.hidden = true;
}

);
}

/* =========================
SERVICE WORKER
========================= */

if (“serviceWorker” in navigator) {

window.addEventListener(
“load”,
() => {

  navigator.serviceWorker
    .register(
      "./sw.js?v=32"
    )
    .then(
      registration => {
        registration.update();
      }
    )
    .catch(
      error => {
        console.warn(
          "Service Worker:",
          error
        );
      }
    );
}

);
}

/* =========================
RENDER
========================= */

function render() {

monthTitleEl.textContent =
formatMonth(viewMonth);

renderSalary();
renderDays();
renderExpenses();
updateSummary();
}

render();
