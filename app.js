(() => {
  "use strict";

  const STORAGE_KEY = "controle-rural-simples.profissional.v1";
  const VIEWS = ["dashboard", "financeiro", "agenda", "plantacoes", "animais"];

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const shortDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const compactDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const longDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short" });

  function isoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateFromISO(value) {
    return new Date(`${value}T12:00:00`);
  }

  function addDays(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return isoDate(date);
  }

  function dateInMonth(monthOffset, day) {
    const now = new Date();
    return isoDate(new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 12));
  }

  function monthKey(value) {
    return String(value).slice(0, 7);
  }

  function createId(prefix) {
    return typeof crypto.randomUUID === "function"
      ? `${prefix}-${crypto.randomUUID()}`
      : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function seedState() {
    const monthlyIncome = [21800, 24600, 23100, 27900, 26350, 32480];
    const monthlyExpense = [15100, 16900, 14450, 18300, 17280, 19640];
    const transactions = [];

    for (let index = 0; index < 6; index += 1) {
      const offset = index - 5;
      transactions.push(
        {
          id: `seed-income-${index}`,
          type: "receita",
          date: dateInMonth(offset, 8),
          description: index === 5 ? "Venda de café beneficiado" : "Venda da produção",
          category: "Vendas",
          amount: monthlyIncome[index],
        },
        {
          id: `seed-expense-${index}`,
          type: "despesa",
          date: dateInMonth(offset, 15),
          description: index === 5 ? "Compra de fertilizantes" : "Custos da produção",
          category: index % 2 === 0 ? "Insumos" : "Produção",
          amount: monthlyExpense[index],
        },
      );
    }

    transactions.push(
      {
        id: "seed-income-extra",
        type: "receita",
        date: dateInMonth(0, 21),
        description: "Venda de leite",
        category: "Vendas",
        amount: 4860,
      },
      {
        id: "seed-expense-extra",
        type: "despesa",
        date: dateInMonth(0, 23),
        description: "Combustível do trator",
        category: "Combustível",
        amount: 1180,
      },
    );

    return {
      transactions,
      tasks: [
        {
          id: "seed-task-1",
          title: "Vacinar novilhas",
          date: addDays(1),
          category: "Animais",
          priority: "alta",
          responsible: "Rafael",
          completed: false,
        },
        {
          id: "seed-task-2",
          title: "Aplicar fertilizante no Talhão Norte",
          date: addDays(3),
          category: "Plantação",
          priority: "media",
          responsible: "Carlos",
          completed: false,
        },
        {
          id: "seed-task-3",
          title: "Revisar óleo do trator",
          date: addDays(6),
          category: "Manutenção",
          priority: "media",
          responsible: "Rafael",
          completed: false,
        },
        {
          id: "seed-task-4",
          title: "Pagar fornecedor de sementes",
          date: addDays(8),
          category: "Financeiro",
          priority: "baixa",
          responsible: "Marina",
          completed: false,
        },
        {
          id: "seed-task-5",
          title: "Limpar reservatório de água",
          date: addDays(-2),
          category: "Manutenção",
          priority: "media",
          responsible: "Carlos",
          completed: true,
        },
      ],
      crops: [
        {
          id: "seed-crop-1",
          name: "Café arábica",
          area: 12,
          plantingDate: dateInMonth(-4, 10),
          harvestDate: addDays(8),
          cost: 35760,
          status: "Crescendo",
          harvested: 0,
        },
        {
          id: "seed-crop-2",
          name: "Milho",
          area: 8.5,
          plantingDate: dateInMonth(-2, 4),
          harvestDate: addDays(36),
          cost: 18400,
          status: "Plantada",
          harvested: 0,
        },
        {
          id: "seed-crop-3",
          name: "Hortaliças",
          area: 1.2,
          plantingDate: dateInMonth(-1, 12),
          harvestDate: addDays(14),
          cost: 3680,
          status: "Crescendo",
          harvested: 0,
        },
      ],
      animals: [
        {
          id: "seed-animal-1",
          name: "Brinco 024",
          species: "Bovino",
          breed: "Girolando",
          birthDate: "2023-04-12",
          weight: 438,
          vaccines: "Febre aftosa, brucelose",
          nextVaccine: addDays(3),
          health: "Animal saudável. Última pesagem dentro do esperado.",
        },
        {
          id: "seed-animal-2",
          name: "Estrela",
          species: "Bovino",
          breed: "Holandesa",
          birthDate: "2022-09-03",
          weight: 512,
          vaccines: "Febre aftosa, IBR",
          nextVaccine: addDays(18),
          health: "Em lactação. Acompanhamento veterinário regular.",
        },
        {
          id: "seed-animal-3",
          name: "Brinco 031",
          species: "Bovino",
          breed: "Nelore",
          birthDate: "2024-01-20",
          weight: 286,
          vaccines: "Brucelose",
          nextVaccine: addDays(42),
          health: "Sem ocorrências registradas.",
        },
        {
          id: "seed-animal-4",
          name: "Lua",
          species: "Equino",
          breed: "Mangalarga",
          birthDate: "2021-06-14",
          weight: 398,
          vaccines: "Influenza equina, tétano",
          nextVaccine: addDays(75),
          health: "Casco revisado recentemente.",
        },
      ],
    };
  }

  function validState(value) {
    return Boolean(
      value &&
        Array.isArray(value.transactions) &&
        Array.isArray(value.tasks) &&
        Array.isArray(value.crops) &&
        Array.isArray(value.animals),
    );
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return seedState();
      const parsed = JSON.parse(stored);
      return validState(parsed) ? parsed : seedState();
    } catch {
      return seedState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      showToast("Não foi possível salvar os dados neste navegador.");
    }
  }

  function normalize(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function formatDate(value, compact = false) {
    const parsed = dateFromISO(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : compact
        ? compactDate.format(parsed)
        : shortDate.format(parsed);
  }

  function daysUntil(value) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Math.ceil((dateFromISO(value) - today) / 86400000);
  }

  const elements = {
    sidebar: document.querySelector("#app-sidebar"),
    backdrop: document.querySelector("#app-backdrop"),
    menuButton: document.querySelector("#app-menu-button"),
    topbarTitle: document.querySelector("#topbar-title"),
    todayLabel: document.querySelector("#today-label"),
    content: document.querySelector("#app-content"),
    resetDemo: document.querySelector("#reset-demo"),
    navTaskCount: document.querySelector("#nav-task-count"),
    metricBalance: document.querySelector("#metric-balance"),
    metricIncome: document.querySelector("#metric-income"),
    metricExpense: document.querySelector("#metric-expense"),
    metricAnimals: document.querySelector("#metric-animals"),
    metricTasks: document.querySelector("#metric-tasks"),
    metricResultLabel: document.querySelector("#metric-result-label"),
    dashboardChart: document.querySelector("#dashboard-chart"),
    dashboardTaskList: document.querySelector("#dashboard-task-list"),
    dashboardCrops: document.querySelector("#dashboard-crops"),
    financeMonth: document.querySelector("#finance-month"),
    financeTypeFilter: document.querySelector("#finance-type-filter"),
    financeCount: document.querySelector("#finance-count"),
    financeIncome: document.querySelector("#finance-income"),
    financeExpense: document.querySelector("#finance-expense"),
    financeProfit: document.querySelector("#finance-profit"),
    financeChart: document.querySelector("#finance-chart"),
    financeTableBody: document.querySelector("#finance-table-body"),
    financeEmpty: document.querySelector("#finance-empty"),
    agendaStats: document.querySelector("#agenda-stats"),
    agendaList: document.querySelector("#agenda-list"),
    agendaEmpty: document.querySelector("#agenda-empty"),
    cropSummary: document.querySelector("#crop-summary"),
    cropList: document.querySelector("#crop-list"),
    cropEmpty: document.querySelector("#crop-empty"),
    animalSummary: document.querySelector("#animal-summary"),
    animalSearch: document.querySelector("#animal-search"),
    animalTableBody: document.querySelector("#animal-table-body"),
    animalEmpty: document.querySelector("#animal-empty"),
    transactionDialog: document.querySelector("#transaction-dialog"),
    transactionForm: document.querySelector("#transaction-form"),
    taskDialog: document.querySelector("#task-dialog"),
    taskForm: document.querySelector("#task-form"),
    cropDialog: document.querySelector("#crop-dialog"),
    cropForm: document.querySelector("#crop-form"),
    animalDialog: document.querySelector("#animal-dialog"),
    animalForm: document.querySelector("#animal-form"),
    deleteDialog: document.querySelector("#delete-dialog"),
    confirmDelete: document.querySelector("#confirm-delete"),
    toast: document.querySelector("#app-toast"),
  };

  const viewTitles = {
    dashboard: "Painel principal",
    financeiro: "Financeiro",
    agenda: "Agenda rural",
    plantacoes: "Plantações",
    animais: "Animais",
  };

  let state = loadState();
  let taskFilter = "todas";
  let pendingDelete = null;
  let toastTimer = null;

  if (!elements.financeMonth.value) {
    elements.financeMonth.value = monthKey(isoDate(new Date()));
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 3200);
  }

  function toggleMenu(forceOpen) {
    const open =
      typeof forceOpen === "boolean"
        ? forceOpen
        : !elements.sidebar.classList.contains("open");
    elements.sidebar.classList.toggle("open", open);
    elements.backdrop.hidden = !open;
    elements.menuButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  }

  function showView(name, updateHash = true) {
    const view = VIEWS.includes(name) ? name : "dashboard";
    document.querySelectorAll("[data-page]").forEach((section) => {
      section.hidden = section.dataset.page !== view;
    });
    document.querySelectorAll("[data-view]").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    elements.topbarTitle.textContent = viewTitles[view];
    document.title = `${viewTitles[view]} | Controle Rural Simples`;
    if (updateHash && window.location.hash !== `#${view}`) {
      history.replaceState(null, "", `#${view}`);
    }
    toggleMenu(false);
    elements.content.focus({ preventScroll: true });
    elements.appMain?.scrollTo?.({ top: 0 });
  }

  function currentMonthTransactions() {
    const key = monthKey(isoDate(new Date()));
    return state.transactions.filter((item) => monthKey(item.date) === key);
  }

  function financialTotals(items) {
    const income = items
      .filter((item) => item.type === "receita")
      .reduce((total, item) => total + Number(item.amount || 0), 0);
    const expense = items
      .filter((item) => item.type === "despesa")
      .reduce((total, item) => total + Number(item.amount || 0), 0);
    return { income, expense, result: income - expense };
  }

  function renderMetrics() {
    const totals = financialTotals(currentMonthTransactions());
    const pendingTasks = state.tasks.filter((task) => !task.completed).length;
    elements.metricIncome.textContent = currency.format(totals.income);
    elements.metricExpense.textContent = currency.format(totals.expense);
    elements.metricBalance.textContent = currency.format(totals.result);
    elements.metricBalance.style.color = totals.result < 0 ? "#ffc9c4" : "";
    elements.metricResultLabel.textContent =
      totals.result >= 0 ? "Lucro estimado no mês" : "Prejuízo estimado no mês";
    elements.metricAnimals.textContent = String(state.animals.length);
    elements.metricTasks.textContent = String(pendingTasks);
    elements.navTaskCount.textContent = String(pendingTasks);
  }

  function lastSixMonths() {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1, 12);
      return { key: monthKey(isoDate(date)), label: monthLabel.format(date).replace(".", "") };
    });
  }

  function renderDashboardChart() {
    const months = lastSixMonths().map((month) => {
      const totals = financialTotals(
        state.transactions.filter((item) => monthKey(item.date) === month.key),
      );
      return { ...month, ...totals };
    });
    const max = Math.max(1, ...months.flatMap((month) => [month.income, month.expense]));
    const fragment = document.createDocumentFragment();
    months.forEach((month) => {
      const group = document.createElement("div");
      group.className = "chart-group";
      const income = document.createElement("span");
      income.className = "chart-bar income";
      income.style.height = `${Math.max(2, (month.income / max) * 100)}%`;
      income.title = `${month.label}: receitas ${currency.format(month.income)}`;
      const expense = document.createElement("span");
      expense.className = "chart-bar expense";
      expense.style.height = `${Math.max(2, (month.expense / max) * 100)}%`;
      expense.title = `${month.label}: despesas ${currency.format(month.expense)}`;
      const label = document.createElement("small");
      label.textContent = month.label;
      group.append(income, expense, label);
      fragment.append(group);
    });
    elements.dashboardChart.replaceChildren(fragment);
  }

  function renderDashboardTasks() {
    const tasks = state.tasks
      .filter((task) => !task.completed)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    elements.dashboardTaskList.replaceChildren(
      ...tasks.map((task) => {
        const item = document.createElement("li");
        const toggle = document.createElement("button");
        toggle.className = "task-check";
        toggle.type = "button";
        toggle.dataset.toggleTask = task.id;
        toggle.setAttribute("aria-label", `Concluir ${task.title}`);
        const copy = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = task.title;
        const details = document.createElement("small");
        details.textContent = `${task.category} · ${task.responsible}`;
        copy.append(title, details);
        const date = document.createElement("span");
        date.className = "task-date-badge";
        date.textContent = formatDate(task.date, true);
        item.append(toggle, copy, date);
        return item;
      }),
    );
    if (!tasks.length) {
      const item = document.createElement("li");
      item.textContent = "Nenhuma tarefa pendente.";
      elements.dashboardTaskList.append(item);
    }
  }

  function cropProgress(crop) {
    const start = dateFromISO(crop.plantingDate).getTime();
    const end = dateFromISO(crop.harvestDate).getTime();
    if (crop.status === "Colhida") return 100;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 10;
    return Math.max(5, Math.min(95, ((Date.now() - start) / (end - start)) * 100));
  }

  function renderDashboardCrops() {
    const active = state.crops.filter((crop) => crop.status !== "Colhida").slice(0, 2);
    elements.dashboardCrops.replaceChildren(
      ...active.map((crop) => {
        const card = document.createElement("article");
        card.className = "mini-crop";
        const header = document.createElement("div");
        header.className = "mini-crop-header";
        const name = document.createElement("strong");
        name.textContent = crop.name;
        const status = document.createElement("span");
        status.className = `status-badge status-${normalize(crop.status)}`;
        status.textContent = crop.status;
        header.append(name, status);
        const info = document.createElement("p");
        info.textContent = `${crop.area} ha · colheita ${formatDate(crop.harvestDate, true)}`;
        const progress = document.createElement("div");
        progress.className = "mini-progress";
        const bar = document.createElement("span");
        bar.style.width = `${cropProgress(crop)}%`;
        progress.append(bar);
        card.append(header, info, progress);
        return card;
      }),
    );
    if (!active.length) {
      const empty = document.createElement("p");
      empty.textContent = "Nenhuma plantação ativa.";
      elements.dashboardCrops.append(empty);
    }
  }

  function filteredFinanceTransactions() {
    const key = elements.financeMonth.value;
    const type = elements.financeTypeFilter.value;
    return state.transactions
      .filter((item) => !key || monthKey(item.date) === key)
      .filter((item) => type === "todos" || item.type === type)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function createDeleteButton(type, id, label) {
    const button = document.createElement("button");
    button.className = "row-delete";
    button.type = "button";
    button.dataset.deleteType = type;
    button.dataset.deleteId = id;
    button.setAttribute("aria-label", `Excluir ${label}`);
    button.textContent = "×";
    return button;
  }

  function renderFinance() {
    const filtered = filteredFinanceTransactions();
    const periodItems = state.transactions.filter(
      (item) => !elements.financeMonth.value || monthKey(item.date) === elements.financeMonth.value,
    );
    const totals = financialTotals(periodItems);
    elements.financeIncome.textContent = currency.format(totals.income);
    elements.financeExpense.textContent = currency.format(totals.expense);
    elements.financeProfit.textContent = currency.format(totals.result);
    elements.financeProfit.classList.toggle("positive", totals.result >= 0);
    elements.financeProfit.classList.toggle("negative", totals.result < 0);
    elements.financeCount.textContent = `${filtered.length} ${filtered.length === 1 ? "lançamento" : "lançamentos"}`;

    const max = Math.max(1, totals.income, totals.expense);
    elements.financeChart.replaceChildren(
      createHorizontalBar("Receitas", totals.income, max, "income"),
      createHorizontalBar("Despesas", totals.expense, max, "expense"),
    );

    elements.financeTableBody.replaceChildren(
      ...filtered.map((item) => {
        const row = document.createElement("tr");
        const date = document.createElement("td");
        date.textContent = formatDate(item.date);
        const description = document.createElement("td");
        const descriptionStrong = document.createElement("strong");
        descriptionStrong.textContent = item.description;
        description.append(descriptionStrong);
        const category = document.createElement("td");
        category.textContent = item.category;
        const type = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `type-badge type-${item.type}`;
        badge.textContent = item.type === "receita" ? "Receita" : "Despesa";
        type.append(badge);
        const amount = document.createElement("td");
        amount.className = item.type === "receita" ? "amount-income" : "amount-expense";
        amount.textContent = `${item.type === "receita" ? "+" : "−"} ${currency.format(item.amount)}`;
        const actions = document.createElement("td");
        actions.append(createDeleteButton("transaction", item.id, item.description));
        row.append(date, description, category, type, amount, actions);
        return row;
      }),
    );
    const empty = filtered.length === 0;
    elements.financeEmpty.hidden = !empty;
    elements.financeTableBody.closest("table").hidden = empty;
  }

  function createHorizontalBar(label, value, max, className) {
    const row = document.createElement("div");
    row.className = `horizontal-row ${className}`;
    const name = document.createElement("span");
    name.textContent = label;
    const track = document.createElement("div");
    track.className = "horizontal-track";
    const bar = document.createElement("span");
    bar.style.width = `${(value / max) * 100}%`;
    track.append(bar);
    const amount = document.createElement("strong");
    amount.textContent = currency.format(value);
    row.append(name, track, amount);
    return row;
  }

  function renderAgenda() {
    const pending = state.tasks.filter((task) => !task.completed).length;
    const completed = state.tasks.length - pending;
    const urgent = state.tasks.filter(
      (task) => !task.completed && task.priority === "alta",
    ).length;
    elements.agendaStats.replaceChildren(
      createStat("Tarefas pendentes", pending),
      createStat("Alta prioridade", urgent),
      createStat("Concluídas", completed),
    );

    const filtered = state.tasks
      .filter((task) => {
        if (taskFilter === "pendentes") return !task.completed;
        if (taskFilter === "concluidas") return task.completed;
        return true;
      })
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.date.localeCompare(b.date));

    elements.agendaList.replaceChildren(
      ...filtered.map((task) => {
        const item = document.createElement("article");
        item.className = `agenda-item${task.completed ? " completed" : ""}`;
        const toggle = document.createElement("button");
        toggle.className = "agenda-toggle";
        toggle.type = "button";
        toggle.dataset.toggleTask = task.id;
        toggle.setAttribute(
          "aria-label",
          task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`,
        );
        toggle.textContent = task.completed ? "✓" : "";
        const copy = document.createElement("div");
        const title = document.createElement("strong");
        title.className = "agenda-item-title";
        title.textContent = task.title;
        const info = document.createElement("small");
        info.textContent = `${task.category} · Responsável: ${task.responsible}`;
        copy.append(title, info);
        const priority = document.createElement("span");
        priority.className = `priority-badge priority-${task.priority}`;
        priority.textContent =
          { alta: "Alta", media: "Média", baixa: "Baixa" }[task.priority] || task.priority;
        const date = document.createElement("div");
        date.className = "agenda-date";
        const dateStrong = document.createElement("strong");
        dateStrong.textContent = formatDate(task.date, true);
        const dateSmall = document.createElement("small");
        const difference = daysUntil(task.date);
        dateSmall.textContent =
          difference < 0
            ? "Atrasada"
            : difference === 0
              ? "Hoje"
              : difference === 1
                ? "Amanhã"
                : `Em ${difference} dias`;
        date.append(dateStrong, dateSmall);
        const remove = createDeleteButton("task", task.id, task.title);
        item.append(toggle, copy, priority, date, remove);
        return item;
      }),
    );
    const empty = filtered.length === 0;
    elements.agendaEmpty.hidden = !empty;
  }

  function createStat(label, value) {
    const card = document.createElement("article");
    card.className = "agenda-stat";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = String(value);
    card.append(small, strong);
    return card;
  }

  function renderCrops() {
    const totalArea = state.crops.reduce((total, crop) => total + Number(crop.area || 0), 0);
    const totalCost = state.crops.reduce((total, crop) => total + Number(crop.cost || 0), 0);
    const active = state.crops.filter((crop) => crop.status !== "Colhida").length;
    elements.cropSummary.replaceChildren(
      createSummaryItem("Área total", `${totalArea.toLocaleString("pt-BR")} ha`),
      createSummaryItem("Custo acumulado", currency.format(totalCost)),
      createSummaryItem("Culturas ativas", String(active)),
    );
    elements.cropList.replaceChildren(
      ...state.crops
        .slice()
        .sort((a, b) => a.harvestDate.localeCompare(b.harvestDate))
        .map((crop) => {
          const card = document.createElement("article");
          card.className = "crop-card";
          const header = document.createElement("div");
          header.className = "crop-card-header";
          const title = document.createElement("h2");
          title.textContent = crop.name;
          const status = document.createElement("span");
          status.className = `status-badge status-${normalize(crop.status)}`;
          status.textContent = crop.status;
          header.append(title, status);
          const sub = document.createElement("p");
          sub.textContent = `${crop.area} hectares plantados`;
          const details = document.createElement("dl");
          details.className = "crop-details";
          details.append(
            createDetail("Plantio", formatDate(crop.plantingDate)),
            createDetail("Colheita prevista", formatDate(crop.harvestDate)),
            createDetail("Custo", currency.format(crop.cost)),
            createDetail("Quantidade colhida", `${crop.harvested || 0}`),
          );
          const footer = document.createElement("div");
          footer.className = "crop-card-footer";
          const progress = document.createElement("span");
          progress.className = "record-progress";
          progress.textContent = `${Math.round(cropProgress(crop))}% do ciclo`;
          footer.append(progress, createDeleteButton("crop", crop.id, crop.name));
          card.append(header, sub, details, footer);
          return card;
        }),
    );
    const empty = state.crops.length === 0;
    elements.cropEmpty.hidden = !empty;
    elements.cropList.hidden = empty;
  }

  function createSummaryItem(label, value) {
    const item = document.createElement("span");
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    item.append(small, strong);
    return item;
  }

  function createDetail(label, value) {
    const container = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    container.append(term, description);
    return container;
  }

  function renderAnimals() {
    const averageWeight = state.animals.length
      ? state.animals.reduce((total, animal) => total + Number(animal.weight || 0), 0) /
        state.animals.length
      : 0;
    const vaccinesDue = state.animals.filter((animal) => {
      const days = daysUntil(animal.nextVaccine);
      return days >= 0 && days <= 30;
    }).length;
    elements.animalSummary.replaceChildren(
      createAnimalStat("Total de animais", state.animals.length),
      createAnimalStat("Peso médio", `${averageWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`),
      createAnimalStat("Vacinas em 30 dias", vaccinesDue),
    );

    const term = normalize(elements.animalSearch.value);
    const animals = state.animals
      .filter((animal) =>
        [animal.name, animal.species, animal.breed].some((value) =>
          normalize(value).includes(term),
        ),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    elements.animalTableBody.replaceChildren(
      ...animals.map((animal) => {
        const row = document.createElement("tr");
        const identity = document.createElement("td");
        const name = document.createElement("strong");
        name.textContent = animal.name;
        const health = document.createElement("small");
        health.textContent = animal.health || "Sem observações de saúde";
        identity.append(name, health);
        const species = document.createElement("td");
        const speciesStrong = document.createElement("strong");
        speciesStrong.textContent = animal.species;
        const breed = document.createElement("small");
        breed.textContent = animal.breed;
        species.append(speciesStrong, breed);
        const birth = document.createElement("td");
        birth.textContent = formatDate(animal.birthDate);
        const weight = document.createElement("td");
        weight.textContent = `${Number(animal.weight).toLocaleString("pt-BR")} kg`;
        const vaccine = document.createElement("td");
        const vaccineStrong = document.createElement("strong");
        vaccineStrong.textContent = formatDate(animal.nextVaccine);
        const vaccineDetails = document.createElement("small");
        vaccineDetails.textContent = animal.vaccines || "Nenhuma vacina informada";
        vaccine.append(vaccineStrong, vaccineDetails);
        const actions = document.createElement("td");
        actions.append(createDeleteButton("animal", animal.id, animal.name));
        row.append(identity, species, birth, weight, vaccine, actions);
        return row;
      }),
    );
    const empty = animals.length === 0;
    elements.animalEmpty.hidden = !empty;
    elements.animalTableBody.closest("table").hidden = empty;
  }

  function createAnimalStat(label, value) {
    const card = document.createElement("article");
    card.className = "animal-stat";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = String(value);
    card.append(small, strong);
    return card;
  }

  function renderAll() {
    renderMetrics();
    renderDashboardChart();
    renderDashboardTasks();
    renderDashboardCrops();
    renderFinance();
    renderAgenda();
    renderCrops();
    renderAnimals();
  }

  function openDialog(type) {
    const map = {
      transaction: [elements.transactionDialog, elements.transactionForm],
      task: [elements.taskDialog, elements.taskForm],
      crop: [elements.cropDialog, elements.cropForm],
      animal: [elements.animalDialog, elements.animalForm],
    };
    const [dialog, form] = map[type] || [];
    if (!dialog || !form) return;
    form.reset();
    const dateInput = form.querySelector('input[name="date"]');
    if (dateInput) dateInput.value = isoDate(new Date());
    if (type === "crop") {
      form.elements.plantingDate.value = isoDate(new Date());
      form.elements.harvestDate.value = addDays(90);
    }
    if (type === "animal") {
      form.elements.nextVaccine.value = addDays(30);
    }
    dialog.showModal();
    window.setTimeout(() => form.querySelector("input, select, textarea")?.focus(), 0);
  }

  function closeDialogs() {
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  }

  function handleTransactionSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    state.transactions.push({
      id: createId("transaction"),
      type: data.get("type"),
      date: data.get("date"),
      description: String(data.get("description")).trim(),
      category: data.get("category"),
      amount: Number(data.get("amount")),
    });
    saveState();
    renderAll();
    closeDialogs();
    showView("financeiro");
    showToast("Lançamento salvo e indicadores atualizados.");
  }

  function handleTaskSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    state.tasks.push({
      id: createId("task"),
      title: String(data.get("title")).trim(),
      date: data.get("date"),
      category: data.get("category"),
      priority: data.get("priority"),
      responsible: String(data.get("responsible")).trim(),
      completed: false,
    });
    saveState();
    renderAll();
    closeDialogs();
    showView("agenda");
    showToast("Tarefa adicionada à agenda.");
  }

  function handleCropSubmit(event) {
    event.preventDefault();
    event.currentTarget.elements.harvestDate.setCustomValidity("");
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    const plantingDate = data.get("plantingDate");
    const harvestDate = data.get("harvestDate");
    if (harvestDate < plantingDate) {
      event.currentTarget.elements.harvestDate.setCustomValidity(
        "A colheita deve ser posterior ao plantio.",
      );
      event.currentTarget.elements.harvestDate.reportValidity();
      return;
    }
    event.currentTarget.elements.harvestDate.setCustomValidity("");
    state.crops.push({
      id: createId("crop"),
      name: String(data.get("name")).trim(),
      area: Number(data.get("area")),
      plantingDate,
      harvestDate,
      cost: Number(data.get("cost")),
      status: data.get("status"),
      harvested: Number(data.get("harvested") || 0),
    });
    saveState();
    renderAll();
    closeDialogs();
    showView("plantacoes");
    showToast("Plantação cadastrada com sucesso.");
  }

  function handleAnimalSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    state.animals.push({
      id: createId("animal"),
      name: String(data.get("name")).trim(),
      species: String(data.get("species")).trim(),
      breed: String(data.get("breed")).trim(),
      birthDate: data.get("birthDate"),
      weight: Number(data.get("weight")),
      vaccines: String(data.get("vaccines")).trim(),
      nextVaccine: data.get("nextVaccine"),
      health: String(data.get("health")).trim(),
    });
    saveState();
    renderAll();
    closeDialogs();
    showView("animais");
    showToast("Animal cadastrado com sucesso.");
  }

  function toggleTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveState();
    renderAll();
    showToast(task.completed ? "Tarefa marcada como concluída." : "Tarefa reaberta.");
  }

  function requestDelete(type, id) {
    pendingDelete = { type, id };
    elements.deleteDialog.showModal();
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const collectionMap = {
      transaction: "transactions",
      task: "tasks",
      crop: "crops",
      animal: "animals",
    };
    const collection = collectionMap[pendingDelete.type];
    if (collection) {
      state[collection] = state[collection].filter((item) => item.id !== pendingDelete.id);
      saveState();
      renderAll();
      showToast("Registro excluído.");
    }
    pendingDelete = null;
    elements.deleteDialog.close();
  }

  elements.menuButton.addEventListener("click", () => toggleMenu());
  elements.backdrop.addEventListener("click", () => toggleMenu(false));
  elements.transactionForm.addEventListener("submit", handleTransactionSubmit);
  elements.taskForm.addEventListener("submit", handleTaskSubmit);
  elements.cropForm.addEventListener("submit", handleCropSubmit);
  elements.animalForm.addEventListener("submit", handleAnimalSubmit);
  elements.confirmDelete.addEventListener("click", confirmDelete);
  elements.financeMonth.addEventListener("change", renderFinance);
  elements.financeTypeFilter.addEventListener("change", renderFinance);
  elements.animalSearch.addEventListener("input", renderAnimals);

  elements.resetDemo.addEventListener("click", () => {
    if (!window.confirm("Restaurar todos os dados de demonstração?")) return;
    state = seedState();
    saveState();
    renderAll();
    showToast("Dados de demonstração restaurados.");
  });

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) showView(viewButton.dataset.view);

    const goButton = event.target.closest("[data-go-view]");
    if (goButton) showView(goButton.dataset.goView);

    const openButton = event.target.closest("[data-open-dialog]");
    if (openButton) openDialog(openButton.dataset.openDialog);

    const closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) closeButton.closest("dialog")?.close();

    const taskButton = event.target.closest("[data-toggle-task]");
    if (taskButton) toggleTask(taskButton.dataset.toggleTask);

    const deleteButton = event.target.closest("[data-delete-type]");
    if (deleteButton) {
      requestDelete(deleteButton.dataset.deleteType, deleteButton.dataset.deleteId);
    }

    const filterButton = event.target.closest("[data-task-filter]");
    if (filterButton) {
      taskFilter = filterButton.dataset.taskFilter;
      document.querySelectorAll("[data-task-filter]").forEach((button) => {
        button.classList.toggle("active", button === filterButton);
      });
      renderAgenda();
    }
  });

  document.querySelectorAll(".app-dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  window.addEventListener("hashchange", () => {
    showView(window.location.hash.slice(1), false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) toggleMenu(false);
  });

  elements.todayLabel.textContent = longDate.format(new Date());
  renderAll();
  showView(window.location.hash.slice(1), false);
})();
