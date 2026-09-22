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

/* =========================================================
DADOS
========================================================= */

function cloneInitial() {
return JSON.parse(JSON.stringify(initial));
}

function loadData() {
try {
const saved = JSON.parse(
localStorage.getItem(KEY)
);

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
  days:
    saved.days &&
    typeof saved.days === "object"
      ? saved.days
      : {},
  expenses:
    Array.isArray(saved.expenses)
      ? saved.expenses
      : [],
  name:
    saved.name || ""
};

} catch {
return cloneInitial();
}
}

let data = loadData();

let viewMonth =
data.month ||
new Date().toISOString().slice(0, 7);

/* =========================================================
ELEMENTOS
========================================================= */

const grossEl =
document.getElementById(“gross”);

const overtimeEl =
document.getElementById(“overtime”);

const netEl =
document.getElementById(“net”);

const availableEl =
document.getElementById(“available”);

const monthTitleEl =
document.getElementById(“monthTitle”);

const daysEl =
document.getElementById(“days”);

const limitTextEl =
document.getElementById(“limitText”);

const baseSalaryEl =
document.getElementById(“baseSalary”);

const normalHoursEl =
document.getElementById(“normalHours”);

const otRateEl =
document.getElementById(“otRate”);

const nightRateEl =
document.getElementById(“nightRate”);

const nightFixedEl =
document.getElementById(“nightFixed”);

const benefitsEl =
document.getElementById(“benefits”);

const deductionsEl =
document.getElementById(“deductions”);

const userNameEl =
document.getElementById(“userName”);

const expensesListEl =
document.getElementById(“expensesList”);

const expenseTotalEl =
document.getElementById(“expenseTotal”);

const prevMonthBtn =
document.getElementById(“prevMonth”);

const nextMonthBtn =
document.getElementById(“nextMonth”);

const addDayBtn =
document.getElementById(“addDay”);

const saveSalaryBtn =
document.getElementById(“saveSalary”);

const addExpenseBtn =
document.getElementById(“addExpense”);

const exportBtn =
document.getElementById(“exportBtn”);

const importFileEl =
document.getElementById(“importFile”);

const resetBtn =
document.getElementById(“resetBtn”);

const installBtn =
document.getElementById(“installBtn”);

/* =========================================================
FORMATAÇÃO
========================================================= */

function yen(value) {

return new Intl.NumberFormat(
“ja-JP”,
{
style: “currency”,
currency: “JPY”,
maximumFractionDigits: 0
}
).format(
Math.round(
Number(value) || 0
)
);
}

function saveData() {

data.month =
viewMonth;

localStorage.setItem(
KEY,
JSON.stringify(data)
);
}

/* =========================================================
CALENDÁRIO
========================================================= */

function daysInMonth(yearMonth) {

const parts =
yearMonth.split(”-”).map(Number);

const year =
parts[0];

const month =
parts[1];

return new Date(
year,
month,
0
).getDate();
}

function dateKey(day) {

return (
viewMonth +
“-” +
String(day).padStart(2, “0”)
);
}

function formatMonth(yearMonth) {

const date =
new Date(
${yearMonth}-01T12:00:00
);

return date.toLocaleDateString(
“pt-BR”,
{
month: “long”,
year: “numeric”
}
);
}

/* =========================================================
HORÁRIOS
========================================================= */

function minutesFromTime(time) {

if (
!time ||
!time.includes(”:”)
) {
return null;
}

const parts =
time.split(”:”).map(Number);

if (
parts.length !== 2 ||
Number.isNaN(parts[0]) ||
Number.isNaN(parts[1])
) {
return null;
}

return (
parts[0] * 60 +
parts[1]
);
}

function calculateHours(
start,
end,
breakHours
) {

const startMinutes =
minutesFromTime(start);

const endMinutes =
minutesFromTime(end);

if (
startMinutes === null ||
endMinutes === null
) {
return 0;
}

let totalMinutes =
endMinutes -
startMinutes;

// Turno atravessando meia-noite
if (totalMinutes < 0) {
totalMinutes +=
24 * 60;
}

const breakMinutes =
Math.max(
0,
Number(breakHours) || 0
) * 60;

totalMinutes -=
breakMinutes;

if (totalMinutes < 0) {
totalMinutes = 0;
}

return totalMinutes / 60;
}

/* =========================================================
DIA PADRÃO
========================================================= */

function defaultDay() {

return {
status: “worked”,

start: "08:00",
end: "17:00",
break: 1,
hours: 8,
night: 0

};
}

/* =========================================================
CÁLCULO DO MÊS
========================================================= */

function calculateMonth() {

let totalHours = 0;

let totalOvertime = 0;

let totalNight = 0;

let nightDays = 0;

Object.keys(data.days)
.forEach(key => {

  if (
    !key.startsWith(
      viewMonth + "-"
    )
  ) {
    return;
  }
  const day =
    data.days[key];
  if (
    !day ||
    day.status !== "worked"
  ) {
    return;
  }
  const hours =
    Math.max(
      0,
      Number(day.hours) || 0
    );
  const overtime =
    Math.max(
      0,
      hours - 8
    );
  const night =
    Math.max(
      0,
      Number(day.night) || 0
    );
  totalHours +=
    hours;
  totalOvertime +=
    overtime;
  totalNight +=
    night;
  if (night > 0) {
    nightDays++;
  }
});

const base =
Number(
data.salary.base
) || 0;

const normalHours =
Number(
data.salary.normal
) || 160;

const hourly =
normalHours > 0
? base / normalHours
: 0;

const overtimeRate =
(
Number(
data.salary.ot
) || 0
) / 100;

const nightRate =
(
Number(
data.salary.night
) || 0
) / 100;

const overtimePay =
hourly *
overtimeRate *
totalOvertime;

const nightPay =
hourly *
nightRate *
totalNight;

const nightFixedPay =
nightDays *
(
Number(
data.salary.nightFixed
) || 0
);

const benefits =
Number(
data.salary.benefits
) || 0;

const deductions =
Number(
data.salary.deductions
) || 0;

const expenses =
data.expenses.reduce(
(
total,
expense
) => {

    return (
      total +
      (
        Number(
          expense.amount
        ) || 0
      )
    );
  },
  0
);

const gross =
base +
overtimePay +
nightPay +
nightFixedPay +
benefits;

const net =
gross -
deductions;

const available =
net -
expenses;

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

/* =========================================================
RESUMO
========================================================= */

function updateSummary() {

const result =
calculateMonth();

grossEl.textContent =
yen(
result.gross
);

overtimeEl.textContent =
result.totalOvertime
.toFixed(1) +
“h”;

netEl.textContent =
yen(
result.net
);

availableEl.textContent =
yen(
result.available
);

limitTextEl.textContent =
result.totalOvertime
.toFixed(1) +
“h / 45h”;
}

/* =========================================================
SALÁRIO
========================================================= */

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

/* =========================================================
DIAS DO MÊS
========================================================= */

function renderDays() {

daysEl.innerHTML = “”;

// Corrige mês inválido
if (
!viewMonth ||
!/^\d{4}-\d{2}$/.test(
viewMonth
)
) {

viewMonth =
  new Date()
    .toISOString()
    .slice(0, 7);

}

const totalDays =
daysInMonth(
viewMonth
);

for (
let dayNumber = 1;
dayNumber <= totalDays;
dayNumber++
) {

const key =
  dateKey(
    dayNumber
  );
/*
 * Cria o dia somente se
 * ele ainda não existir.
 *
 * Isso evita apagar dados
 * já registrados.
 */
if (
  !data.days[key]
) {
  data.days[key] =
    defaultDay();
}
const day = {
  ...defaultDay(),
  ...data.days[key]
};
const date =
  new Date(
    `${key}T12:00:00`
  );
const weekday =
  date.toLocaleDateString(
    "pt-BR",
    {
      weekday: "short"
    }
  );
const container =
  document.createElement(
    "div"
  );
container.className =
  "day";
container.innerHTML = `
  <div class="dayhead">
    <span class="daydate">
      ${String(
        dayNumber
      ).padStart(2, "0")}
      ·
      ${weekday}
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
        <option value="worked">
          Trabalho
        </option>
        <option value="off">
          Folga
        </option>
        <option value="yukyu">
          Yūkyū
        </option>
        <option value="absent">
          Falta
        </option>
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
        inputmode="decimal"
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
        inputmode="decimal"
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
        inputmode="decimal"
      >
    </label>
  </div>
`;
/*
 * Define o valor correto
 * do seletor de status.
 */
const statusSelect =
  container.querySelector(
    '[data-field="status"]'
  );
statusSelect.value =
  day.status;
/*
 * Eventos dos campos
 */
const controls =
  container.querySelectorAll(
    "input, select"
  );
controls.forEach(
  control => {
    control.addEventListener(
      "change",
      () => {
        const field =
          control.dataset.field;
        let value =
          control.value;
        if (
          control.type ===
          "number"
        ) {
          value =
            Number(
              value
            ) || 0;
        }
        data.days[key][field] =
          value;
        /*
         * Entrada, saída ou intervalo:
         * recalcula horas.
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
        /*
         * Atualiza somente a lista
         * depois de salvar.
         */
        renderDays();
      }
    );
  }
);
daysEl.appendChild(
  container
);

}

/*

* Salva os dias criados.
    */

saveData();
}

/* =========================================================
DESPESAS
========================================================= */

function escapeHTML(value) {

return String(
value ?? “”
)
.replace(
/&/g,
“&”
)
.replace(
/</g,
“<”
)
.replace(
/>/g,
“>”
)
.replace(
/”/g,
“"”
)
.replace(
/’/g,
“'”
);
}

function renderExpenses() {

expensesListEl.innerHTML = “”;

if (
!data.expenses.length
) {

expensesListEl.innerHTML =
  '<p class="note">Nenhuma despesa cadastrada.</p>';

} else {

data.expenses.forEach(
  (
    expense,
    index
  ) => {
    const row =
      document.createElement(
        "div"
      );
    row.className =
      "expense";
    row.innerHTML = `
      <span>
        ${escapeHTML(
          expense.name
        )}
        <br>
        <small>
          ${yen(
            expense.amount
          )}
        </small>
      </span>
      <button>
        Excluir
      </button>
    `;
    row
      .querySelector(
        "button"
      )
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
    expensesListEl.appendChild(
      row
    );
  }
);

}

expenseTotalEl.textContent =
yen(
calculateMonth()
.expenses
);
}

/* =========================================================
ABAS
========================================================= */

document
.querySelectorAll(”.tab”)
.forEach(
button => {

  button.addEventListener(
    "click",
    () => {
      document
        .querySelectorAll(
          ".tab"
        )
        .forEach(
          tab =>
            tab.classList
              .remove(
                "active"
              )
        );
      document
        .querySelectorAll(
          ".panel"
        )
        .forEach(
          panel =>
            panel.classList
              .remove(
                "active"
              )
        );
      button.classList.add(
        "active"
      );
      const panel =
        document.getElementById(
          button.dataset.tab
        );
      if (panel) {
        panel.classList.add(
          "active"
        );
      }
    }
  );
}

);

/* =========================================================
MUDAR MÊS
========================================================= */

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
  date
    .toISOString()
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
  date
    .toISOString()
    .slice(0, 7);
saveData();
render();

}
);

/* =========================================================
BOTÃO + DIA
========================================================= */

if (addDayBtn) {

addDayBtn.addEventListener(
“click”,
() => {

  const firstDay =
    dateKey(1);
  const existing =
    data.days[firstDay];
  if (!existing) {
    data.days[firstDay] =
      defaultDay();
  }
  saveData();
  renderDays();
  updateSummary();
}

);

}

/* =========================================================
SALVAR SALÁRIO
========================================================= */

saveSalaryBtn.addEventListener(
“click”,
() => {

data.salary = {
  base:
    Number(
      baseSalaryEl.value
    ) || 0,
  normal:
    Number(
      normalHoursEl.value
    ) || 160,
  ot:
    Number(
      otRateEl.value
    ) || 0,
  night:
    Number(
      nightRateEl.value
    ) || 0,
  nightFixed:
    Number(
      nightFixedEl.value
    ) || 0,
  benefits:
    Number(
      benefitsEl.value
    ) || 0,
  deductions:
    Number(
      deductionsEl.value
    ) || 0
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

/* =========================================================
NOME
========================================================= */

userNameEl.addEventListener(
“change”,
() => {

data.name =
  userNameEl.value.trim();
saveData();

}
);

/* =========================================================
ADICIONAR DESPESA
========================================================= */

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
  Number.isFinite(
    amount
  ) &&
  amount > 0
) {
  data.expenses.push({
    name:
      name.trim(),
    amount
  });
  saveData();
  renderExpenses();
  updateSummary();
}

}
);

/* =========================================================
EXPORTAR BACKUP
========================================================= */

exportBtn.addEventListener(
“click”,
() => {

const json =
  JSON.stringify(
    data,
    null,
    2
  );
const blob =
  new Blob(
    [json],
    {
      type:
        "application/json"
    }
  );
const url =
  URL.createObjectURL(
    blob
  );
const link =
  document.createElement(
    "a"
  );
link.href =
  url;
link.download =
  "meu-salario-japao-backup.json";
document.body.appendChild(
  link
);
link.click();
link.remove();
URL.revokeObjectURL(
  url
);

}
);

/* =========================================================
IMPORTAR BACKUP
========================================================= */

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
      data.month ||
      viewMonth;
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
reader.readAsText(
  file
);

}
);

/* =========================================================
RESTAURAR
========================================================= */

resetBtn.addEventListener(
“click”,
() => {

const confirmed =
  confirm(
    "Apagar todos os dados deste aparelho?"
  );
if (!confirmed) {
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

/* =========================================================
INSTALAÇÃO PWA
========================================================= */

let deferredPrompt =
null;

window.addEventListener(
“beforeinstallprompt”,
event => {

event.preventDefault();
deferredPrompt =
  event;
if (installBtn) {
  installBtn.hidden =
    false;
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
    await
      deferredPrompt.userChoice;
  } catch {}
  deferredPrompt =
    null;
  installBtn.hidden =
    true;
}

);

}

/* =========================================================
SERVICE WORKER
========================================================= */

if (
“serviceWorker”
in navigator
) {

window.addEventListener(
“load”,
() => {

  navigator.serviceWorker
    .register(
      "./sw.js?v=33"
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

/* =========================================================
INICIAR
========================================================= */

function render() {

monthTitleEl.textContent =
formatMonth(
viewMonth
);

renderSalary();

renderDays();

renderExpenses();

updateSummary();

}

render();
