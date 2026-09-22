const KEY = "meu-salario-japao-v3";

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
  name: ""
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));

    if (!saved) {
      return JSON.parse(JSON.stringify(initial));
    }

    return {
      ...JSON.parse(JSON.stringify(initial)),
      ...saved,
      salary: {
        ...initial.salary,
        ...(saved.salary || {})
      },
      days: saved.days || {},
      expenses: Array.isArray(saved.expenses) ? saved.expenses : [],
      name: saved.name || ""
    };
  } catch {
    return JSON.parse(JSON.stringify(initial));
  }
}

let data = loadData();
let viewMonth = data.month || initial.month;


/* =========================
   ELEMENTOS DA INTERFACE
========================= */

const grossEl = document.getElementById("gross");
const overtimeEl = document.getElementById("overtime");
const netEl = document.getElementById("net");
const availableEl = document.getElementById("available");

const monthTitleEl = document.getElementById("monthTitle");
const daysEl = document.getElementById("days");
const limitTextEl = document.getElementById("limitText");

const baseSalaryEl = document.getElementById("baseSalary");
const normalHoursEl = document.getElementById("normalHours");
const otRateEl = document.getElementById("otRate");
const nightRateEl = document.getElementById("nightRate");
const nightFixedEl = document.getElementById("nightFixed");
const benefitsEl = document.getElementById("benefits");
const deductionsEl = document.getElementById("deductions");

const userNameEl = document.getElementById("userName");

const expensesListEl = document.getElementById("expensesList");
const expenseTotalEl = document.getElementById("expenseTotal");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const addDayBtn = document.getElementById("addDay");

const saveSalaryBtn = document.getElementById("saveSalary");
const addExpenseBtn = document.getElementById("addExpense");

const exportBtn = document.getElementById("exportBtn");
const importFileEl = document.getElementById("importFile");
const resetBtn = document.getElementById("resetBtn");

const installBtn = document.getElementById("installBtn");


/* =========================
   FUNÇÕES AUXILIARES
========================= */

function yen(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(Math.round(Number(value) || 0));
}

function save() {
  data.month = viewMonth;
  localStorage.setItem(KEY, JSON.stringify(data));
  render();
}

function daysInMonth(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function dateKey(day) {
  return `${viewMonth}-${String(day).padStart(2, "0")}`;
}

function formatMonth(yearMonth) {
  const date = new Date(`${yearMonth}-01T12:00:00`);

  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function minutesFromTime(time) {
  if (!time || !time.includes(":")) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function calculateWorkedHours(start, end, breakHours) {
  const startMinutes = minutesFromTime(start);
  const endMinutes = minutesFromTime(end);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  let duration = endMinutes - startMinutes;

  // Turno que passa da meia-noite
  if (duration < 0) {
    duration += 24 * 60;
  }

  const breakMinutes = Math.max(
    0,
    Number(breakHours) || 0
  ) * 60;

  const workedMinutes = Math.max(
    0,
    duration - breakMinutes
  );

  return workedMinutes / 60;
}

function defaultDay() {
  return {
    status: "worked",
    start: "08:00",
    end: "17:00",
    break: 1,
    hours: 8,
    night: 0
  };
}


/* =========================
   CÁLCULO DO DIA
========================= */

function calcDay(day) {
  if (!day || day.status !== "worked") {
    return {
      hours: 0,
      ot: 0,
      night: 0
    };
  }

  const hours = Math.max(
    0,
    Number(day.hours) || 0
  );

  const overtime = Math.max(
    0,
    hours - 8
  );

  const night = Math.max(
    0,
    Number(day.night) || 0
  );

  return {
    hours,
    ot: overtime,
    night
  };
}


/* =========================
   CÁLCULO DO MÊS
========================= */

function calc() {
  let hours = 0;
  let overtime = 0;
  let night = 0;
  let nightDays = 0;

  Object.entries(data.days).forEach(([key, day]) => {
    if (!key.startsWith(viewMonth)) {
      return;
    }

    const result = calcDay(day);

    hours += result.hours;
    overtime += result.ot;
    night += result.night;

    if (result.night > 0) {
      nightDays++;
    }
  });

  const base = Number(data.salary.base) || 0;
  const normalHours = Number(data.salary.normal) || 160;

  const hourly = normalHours > 0
    ? base / normalHours
    : 0;

  const overtimeRate =
    (Number(data.salary.ot) || 0) / 100;

  const nightRate =
    (Number(data.salary.night) || 0) / 100;

  const overtimePay =
    hourly * overtimeRate * overtime;

  const nightPay =
    hourly * nightRate * night;

  const nightFixedPay =
    nightDays *
    (Number(data.salary.nightFixed) || 0);

  const benefits =
    Number(data.salary.benefits) || 0;

  const deductions =
    Number(data.salary.deductions) || 0;

  const gross =
    base +
    overtimePay +
    nightPay +
    nightFixedPay +
    benefits;

  const net =
    gross - deductions;

  const expenses =
    data.expenses.reduce(
      (total, expense) =>
        total + (Number(expense.amount) || 0),
      0
    );

  const available =
    net - expenses;

  return {
    hours,
    overtime,
    night,
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
   RENDER PRINCIPAL
========================= */

function render() {
  monthTitleEl.textContent =
    formatMonth(viewMonth);

  const result = calc();

  grossEl.textContent =
    yen(result.gross);

  overtimeEl.textContent =
    `${result.overtime.toFixed(1)}h`;

  netEl.textContent =
    yen(result.net);

  availableEl.textContent =
    yen(result.available);

  limitTextEl.textContent =
    `${result.overtime.toFixed(1)}h / 45h`;

  renderDays();
  renderExpenses();
  renderSalary();
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
    data.name || "";
}


/* =========================
   JORNADA
========================= */

function renderDays() {
  daysEl.innerHTML = "";

  const totalDays =
    daysInMonth(viewMonth);

  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber++) {
    const key = dateKey(dayNumber);

    const day = data.days[key]
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
          ${String(dayNumber).padStart(2, "0")} · ${weekday}
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

    const controls =
      container.querySelectorAll(
        "input, select"
      );

    controls.forEach(control => {
      control.value =
        day[control.dataset.field] ??
        control.value;

      control.addEventListener(
        "change",
        () => {
          const field =
            control.dataset.field;

          if (!data.days[key]) {
            data.days[key] =
              defaultDay();
          }

          let value = control.value;

          if (control.type === "number") {
            value = Number(value) || 0;
          }

          data.days[key][field] =
            value;

          /*
           * Se entrada, saída ou intervalo
           * forem alterados, calcula
           * automaticamente as horas.
           */
          if (
            field === "start" ||
            field === "end" ||
            field === "break"
          ) {
            const calculated =
              calculateWorkedHours(
                data.days[key].start,
                data.days[key].end,
                data.days[key].break
              );

            if (calculated !== null) {
              data.days[key].hours =
                Math.round(calculated * 4) / 4;
            }
          }

          save();
        }
      );
    });

    daysEl.appendChild(container);
  }
}


/* =========================
   DESPESAS
========================= */

function renderExpenses() {
  expensesListEl.innerHTML = "";

  if (!data.expenses.length) {
    expensesListEl.innerHTML =
      '<p class="note">Nenhuma despesa cadastrada.</p>';
  }

  data.expenses.forEach(
    (expense, index) => {
      const row =
        document.createElement("div");

      row.className = "expense";

      const info =
        document.createElement("span");

      info.innerHTML =
        `${escapeHTML(expense.name)}<br>
         <small>${yen(expense.amount)}</small>`;

      const button =
        document.createElement("button");

      button.textContent =
        "Excluir";

      button.addEventListener(
        "click",
        () => {
          data.expenses.splice(index, 1);
          save();
        }
      );

      row.appendChild(info);
      row.appendChild(button);

      expensesListEl.appendChild(row);
    }
  );

  expenseTotalEl.textContent =
    yen(calc().expenses);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   ABAS
========================= */

document
  .querySelectorAll(".tab")
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
   MUDANÇA DE MÊS
========================= */

prevMonthBtn.addEventListener(
  "click",
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

    data.month = viewMonth;

    save();
  }
);

nextMonthBtn.addEventListener(
  "click",
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

    data.month = viewMonth;

    save();
  }
);


/* =========================
   BOTÃO + DIA
========================= */

addDayBtn.addEventListener(
  "click",
  () => {
    const total =
      daysInMonth(viewMonth);

    alert(
      `Este mês já possui ${total} dias.\n\n` +
      "Você pode editar qualquer dia diretamente abaixo."
    );
  }
);


/* =========================
   SALVAR SALÁRIO
========================= */

saveSalaryBtn.addEventListener(
  "click",
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

    save();

    alert(
      "Salário salvo com sucesso!"
    );
  }
);


/* =========================
   NOME
========================= */

userNameEl.addEventListener(
  "change",
  () => {
    data.name =
      userNameEl.value.trim();

    save();
  }
);


/* =========================
   ADICIONAR DESPESA
========================= */

addExpenseBtn.addEventListener(
  "click",
  () => {
    const name =
      prompt("Nome da despesa:");

    if (!name) {
      return;
    }

    const amount =
      Number(
        prompt("Valor em ¥:")
      );

    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      data.expenses.push({
        name: name.trim(),
        amount
      });

      save();
    }
  }
);


/* =========================
   EXPORTAR BACKUP
========================= */

exportBtn.addEventListener(
  "click",
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
   IMPORTAR BACKUP
========================= */

importFileEl.addEventListener(
  "change",
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
          ...JSON.parse(
            JSON.stringify(initial)
          ),
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

        save();

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
   RESTAURAR DADOS
========================= */

resetBtn.addEventListener(
  "click",
  () => {
    const confirmed =
      confirm(
        "Apagar todos os dados deste aparelho?"
      );

    if (!confirmed) {
      return;
    }

    data =
      JSON.parse(
        JSON.stringify(initial)
      );

    viewMonth =
      data.month;

    save();
  }
);


/* =========================
   INSTALAÇÃO PWA
========================= */

let deferredPrompt = null;

window.addEventListener(
  "beforeinstallprompt",
  event => {
    event.preventDefault();

    deferredPrompt = event;

    if (installBtn) {
      installBtn.hidden = false;
    }
  }
);

if (installBtn) {
  installBtn.addEventListener(
    "click",
    async () => {
      if (!deferredPrompt) {
        return;
      }

      deferredPrompt.prompt();

      try {
        await deferredPrompt.userChoice;
      } catch {
        // Ignora cancelamento da instalação
      }

      deferredPrompt = null;
      installBtn.hidden = true;
    }
  );
}


/* =========================
   SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then(registration => {
          registration.update();
        })
        .catch(error => {
          console.warn(
            "Service Worker não registrado:",
            error
          );
        });
    }
  );
}


/* =========================
   INICIAR APLICATIVO
========================= */

render();
