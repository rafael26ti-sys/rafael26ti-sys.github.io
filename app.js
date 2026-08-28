(() => {
  "use strict";

  const STORAGE_KEY = "controle-rural-simples.profissional.v1";
  const VIEWS = ["dashboard", "financeiro", "agenda", "plantacoes", "animais", "estoque", "maquinas"];

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
      inventory: [
        {
          id: "seed-stock-1",
          name: "Sementes de milho",
          category: "Sementes",
          quantity: 18,
          unit: "sacos",
          minimum: 10,
          location: "Galpão de insumos",
          updatedAt: isoDate(new Date()),
        },
        {
          id: "seed-stock-2",
          name: "Fertilizante NPK 20-05-20",
          category: "Fertilizantes",
          quantity: 8,
          unit: "sacos",
          minimum: 12,
          location: "Galpão de insumos",
          updatedAt: isoDate(new Date()),
        },
        {
          id: "seed-stock-3",
          name: "Ração leiteira",
          category: "Rações",
          quantity: 4,
          unit: "sacos",
          minimum: 8,
          location: "Depósito de ração",
          updatedAt: isoDate(new Date()),
        },
        {
          id: "seed-stock-4",
          name: "Vacina contra febre aftosa",
          category: "Medicamentos",
          quantity: 0,
          unit: "doses",
          minimum: 20,
          location: "Armário veterinário",
          updatedAt: isoDate(new Date()),
        },
        {
          id: "seed-stock-5",
          name: "Óleo diesel",
          category: "Combustível",
          quantity: 240,
          unit: "litros",
          minimum: 100,
          location: "Tanque principal",
          updatedAt: isoDate(new Date()),
        },
        {
          id: "seed-stock-6",
          name: "Café beneficiado",
          category: "Produtos colhidos",
          quantity: 32,
          unit: "sacas",
          minimum: 5,
          location: "Armazém",
          updatedAt: isoDate(new Date()),
        },
        {
          id: "seed-stock-7",
          name: "Herbicida seletivo",
          category: "Defensivos",
          quantity: 6,
          unit: "litros",
          minimum: 5,
          location: "Armário de defensivos",
          updatedAt: isoDate(new Date()),
        },
      ],
      machines: [
        {
          id: "seed-machine-1",
          name: "Trator principal",
          type: "Trator",
          brand: "John Deere",
          model: "5078E",
          year: 2021,
          hours: 1264.5,
          fuelConsumption: 3480,
          lastMaintenance: addDays(-45),
          nextMaintenance: addDays(12),
          repairCost: 1850,
          status: "Disponível",
          updatedAt: isoDate(new Date()),
          history: [],
        },
        {
          id: "seed-machine-2",
          name: "Colheitadeira de café",
          type: "Colheitadeira",
          brand: "Jacto",
          model: "KTR 3000",
          year: 2019,
          hours: 2187,
          fuelConsumption: 6720,
          lastMaintenance: addDays(-92),
          nextMaintenance: addDays(-3),
          repairCost: 4320,
          status: "Trabalhando",
          updatedAt: isoDate(new Date()),
          history: [],
        },
        {
          id: "seed-machine-3",
          name: "Roçadeira lateral",
          type: "Implemento",
          brand: "Baldan",
          model: "RPDL 1700",
          year: 2022,
          hours: 684,
          fuelConsumption: 0,
          lastMaintenance: addDays(-18),
          nextMaintenance: addDays(72),
          repairCost: 640,
          status: "Em manutenção",
          updatedAt: isoDate(new Date()),
          history: [],
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
      if (!validState(parsed)) return seedState();
      if (!Array.isArray(parsed.inventory)) parsed.inventory = seedState().inventory;
      if (!Array.isArray(parsed.machines)) parsed.machines = seedState().machines;
      parsed.machines.forEach((machine) => {
        if (!Array.isArray(machine.history)) machine.history = [];
      });
      return parsed;
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
    dashboardAlertCount: document.querySelector("#dashboard-alert-count"),
    dashboardAlertList: document.querySelector("#dashboard-alert-list"),
    notificationButton: document.querySelector("#notification-button"),
    notificationCount: document.querySelector("#notification-count"),
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
    navStockCount: document.querySelector("#nav-stock-count"),
    stockSummary: document.querySelector("#stock-summary"),
    stockAlert: document.querySelector("#stock-alert"),
    stockAlertText: document.querySelector("#stock-alert-text"),
    stockSearch: document.querySelector("#stock-search"),
    stockCategoryFilter: document.querySelector("#stock-category-filter"),
    stockStatusFilter: document.querySelector("#stock-status-filter"),
    stockCount: document.querySelector("#stock-count"),
    stockTableBody: document.querySelector("#stock-table-body"),
    stockEmpty: document.querySelector("#stock-empty"),
    navMachineCount: document.querySelector("#nav-machine-count"),
    machineSummary: document.querySelector("#machine-summary"),
    machineAlert: document.querySelector("#machine-alert"),
    machineAlertText: document.querySelector("#machine-alert-text"),
    machineSearch: document.querySelector("#machine-search"),
    machineTypeFilter: document.querySelector("#machine-type-filter"),
    machineStatusFilter: document.querySelector("#machine-status-filter"),
    machineCount: document.querySelector("#machine-count"),
    machineTableBody: document.querySelector("#machine-table-body"),
    machineEmpty: document.querySelector("#machine-empty"),
    transactionDialog: document.querySelector("#transaction-dialog"),
    transactionForm: document.querySelector("#transaction-form"),
    taskDialog: document.querySelector("#task-dialog"),
    taskForm: document.querySelector("#task-form"),
    cropDialog: document.querySelector("#crop-dialog"),
    cropForm: document.querySelector("#crop-form"),
    animalDialog: document.querySelector("#animal-dialog"),
    animalForm: document.querySelector("#animal-form"),
    stockDialog: document.querySelector("#stock-dialog"),
    stockForm: document.querySelector("#stock-form"),
    stockMovementDialog: document.querySelector("#stock-movement-dialog"),
    stockMovementForm: document.querySelector("#stock-movement-form"),
    stockMovementName: document.querySelector("#stock-movement-name"),
    stockMovementBalance: document.querySelector("#stock-movement-balance"),
    machineDialog: document.querySelector("#machine-dialog"),
    machineForm: document.querySelector("#machine-form"),
    machineActivityDialog: document.querySelector("#machine-activity-dialog"),
    machineActivityForm: document.querySelector("#machine-activity-form"),
    machineActivityName: document.querySelector("#machine-activity-name"),
    machineActivityBalance: document.querySelector("#machine-activity-balance"),
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
    estoque: "Estoque",
    maquinas: "Máquinas e equipamentos",
  };

  let state = loadState();
  let taskFilter = "todas";
  let stockMovementItemId = null;
  let machineActivityItemId = null;
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

  function machineCondition(machine) {
    if (machine.status === "Em manutenção") return "maintenance";
    const remainingDays = daysUntil(machine.nextMaintenance);
    if (remainingDays < 0) return "overdue";
    if (remainingDays <= 15) return "due";
    return "ok";
  }

  function machineStatusLabel(machine) {
    const condition = machineCondition(machine);
    if (condition === "overdue") return "Manutenção atrasada";
    if (condition === "due") return "Manutenção próxima";
    return machine.status;
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
    const stockAlerts = state.inventory.filter((item) => Number(item.quantity) <= Number(item.minimum)).length;
    elements.navStockCount.textContent = String(stockAlerts);
    const machineAlerts = state.machines.filter((machine) => machineCondition(machine) !== "ok").length;
    elements.navMachineCount.textContent = String(machineAlerts);
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

  function stockCondition(item) {
    const quantity = Number(item.quantity || 0);
    const minimum = Number(item.minimum || 0);
    if (quantity <= 0) return "out";
    if (quantity <= minimum) return "low";
    return "ok";
  }

  function formatStockAmount(item) {
    return Number(item.quantity || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " " + item.unit;
  }

  function renderDashboardAlerts() {
    const alerts = [];
    const criticalStock = state.inventory
      .filter((item) => stockCondition(item) !== "ok")
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))[0];

    if (criticalStock) {
      alerts.push({
        color: stockCondition(criticalStock) === "out" ? "red" : "orange",
        title: stockCondition(criticalStock) === "out" ? "Item sem estoque" : "Estoque baixo",
        detail: criticalStock.name + ": " + formatStockAmount(criticalStock),
        view: "estoque",
      });
    }

    const criticalMachine = [...state.machines]
      .filter((machine) => machineCondition(machine) !== "ok")
      .sort((a, b) => {
        const order = { overdue: 0, maintenance: 1, due: 2, ok: 3 };
        return order[machineCondition(a)] - order[machineCondition(b)] || a.nextMaintenance.localeCompare(b.nextMaintenance);
      })[0];

    if (criticalMachine) {
      const remainingDays = daysUntil(criticalMachine.nextMaintenance);
      alerts.push({
        color: machineCondition(criticalMachine) === "overdue" ? "red" : "orange",
        title: machineStatusLabel(criticalMachine),
        detail:
          machineCondition(criticalMachine) === "overdue"
            ? criticalMachine.name + " está atrasada há " + Math.abs(remainingDays) + " dias"
            : criticalMachine.name + " · " + formatDate(criticalMachine.nextMaintenance),
        view: "maquinas",
      });
    }

    const nextVaccine = state.animals
      .filter((animal) => daysUntil(animal.nextVaccine) >= 0 && daysUntil(animal.nextVaccine) <= 30)
      .sort((a, b) => a.nextVaccine.localeCompare(b.nextVaccine))[0];
    if (nextVaccine) {
      alerts.push({
        color: "red",
        title: "Vacinação próxima",
        detail: nextVaccine.name + " vence em " + daysUntil(nextVaccine.nextVaccine) + " dias",
        view: "animais",
      });
    }

    const nextHarvest = state.crops
      .filter((crop) => crop.status !== "Colhida" && daysUntil(crop.harvestDate) >= 0)
      .sort((a, b) => a.harvestDate.localeCompare(b.harvestDate))[0];
    if (nextHarvest) {
      alerts.push({
        color: "orange",
        title: "Colheita de " + nextHarvest.name,
        detail: "Previsão para daqui a " + daysUntil(nextHarvest.harvestDate) + " dias",
        view: "plantacoes",
      });
    }

    if (alerts.length < 4) {
      alerts.push({
        color: "blue",
        title: "Possibilidade de chuva",
        detail: "35% nas próximas 24 horas",
        view: "dashboard",
      });
    }

    const visibleAlerts = alerts.slice(0, 4);
    elements.dashboardAlertCount.textContent = String(visibleAlerts.length);
    elements.notificationCount.textContent = String(visibleAlerts.length);
    elements.notificationButton.setAttribute("aria-label", visibleAlerts.length + " alertas importantes");

    elements.dashboardAlertList.replaceChildren(
      ...visibleAlerts.map((alert) => {
        const item = document.createElement("li");
        const dot = document.createElement("span");
        dot.className = "alert-dot alert-" + alert.color;
        const button = document.createElement("button");
        button.className = "alert-action";
        button.type = "button";
        button.dataset.goView = alert.view;
        const copy = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = alert.title;
        const detail = document.createElement("small");
        detail.textContent = alert.detail;
        copy.append(title, detail);
        button.append(copy);
        item.append(dot, button);
        return item;
      }),
    );
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

  function renderStock() {
    const inventory = state.inventory || [];
    const lowItems = inventory.filter((item) => stockCondition(item) === "low");
    const outItems = inventory.filter((item) => stockCondition(item) === "out");
    const categories = new Set(inventory.map((item) => item.category));

    elements.stockSummary.replaceChildren(
      createAnimalStat("Itens cadastrados", inventory.length),
      createAnimalStat("Categorias", categories.size),
      createAnimalStat("Estoque baixo", lowItems.length),
      createAnimalStat("Sem estoque", outItems.length),
    );

    const alertItems = [...outItems, ...lowItems];
    elements.stockAlert.hidden = alertItems.length === 0;
    elements.stockAlertText.textContent = alertItems.length
      ? alertItems.length + (alertItems.length === 1 ? " item precisa" : " itens precisam") + " de reposição."
      : "";

    const search = normalize(elements.stockSearch.value);
    const category = elements.stockCategoryFilter.value;
    const status = elements.stockStatusFilter.value;
    const filtered = inventory
      .filter((item) => [item.name, item.category, item.location].some((value) => normalize(value).includes(search)))
      .filter((item) => category === "todas" || item.category === category)
      .filter((item) => status === "todos" || stockCondition(item) === status)
      .sort((a, b) => {
        const order = { out: 0, low: 1, ok: 2 };
        return order[stockCondition(a)] - order[stockCondition(b)] || a.name.localeCompare(b.name, "pt-BR");
      });

    elements.stockCount.textContent = filtered.length + (filtered.length === 1 ? " item" : " itens");
    elements.stockTableBody.replaceChildren(
      ...filtered.map((item) => {
        const row = document.createElement("tr");
        const identity = document.createElement("td");
        const name = document.createElement("strong");
        name.textContent = item.name;
        const updated = document.createElement("small");
        updated.textContent = "Atualizado em " + formatDate(item.updatedAt || isoDate(new Date()));
        identity.append(name, updated);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = item.category;

        const quantity = document.createElement("td");
        const quantityStrong = document.createElement("strong");
        quantityStrong.className = "stock-quantity";
        quantityStrong.textContent = formatStockAmount(item);
        quantity.append(quantityStrong);

        const minimum = document.createElement("td");
        minimum.textContent = Number(item.minimum).toLocaleString("pt-BR") + " " + item.unit;

        const location = document.createElement("td");
        location.textContent = item.location;

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        const condition = stockCondition(item);
        statusBadge.className = "stock-status stock-status-" + condition;
        statusBadge.textContent = { ok: "Normal", low: "Estoque baixo", out: "Sem estoque" }[condition];
        statusCell.append(statusBadge);

        const actions = document.createElement("td");
        const actionsWrap = document.createElement("div");
        actionsWrap.className = "stock-actions";
        const movement = document.createElement("button");
        movement.className = "stock-move-button";
        movement.type = "button";
        movement.dataset.stockMove = item.id;
        movement.textContent = "Movimentar";
        movement.setAttribute("aria-label", "Registrar entrada ou saída de " + item.name);
        actionsWrap.append(movement, createDeleteButton("stock", item.id, item.name));
        actions.append(actionsWrap);

        row.append(identity, categoryCell, quantity, minimum, location, statusCell, actions);
        return row;
      }),
    );

    const empty = filtered.length === 0;
    elements.stockEmpty.hidden = !empty;
    elements.stockTableBody.closest("table").hidden = empty;
  }

  function renderMachines() {
    const machines = state.machines || [];
    const available = machines.filter((machine) => machine.status === "Disponível").length;
    const working = machines.filter((machine) => machine.status === "Trabalhando").length;
    const attention = machines.filter((machine) => machineCondition(machine) !== "ok").length;
    const totalRepairCost = machines.reduce((total, machine) => total + Number(machine.repairCost || 0), 0);

    elements.machineSummary.replaceChildren(
      createAnimalStat("Equipamentos", machines.length),
      createAnimalStat("Disponíveis", available),
      createAnimalStat("Em trabalho", working),
      createAnimalStat("Gastos com consertos", currency.format(totalRepairCost)),
    );

    elements.machineAlert.hidden = attention === 0;
    elements.machineAlertText.textContent = attention
      ? attention + (attention === 1 ? " equipamento exige" : " equipamentos exigem") + " atenção na manutenção."
      : "";

    const search = normalize(elements.machineSearch.value);
    const type = elements.machineTypeFilter.value;
    const status = elements.machineStatusFilter.value;
    const filtered = machines
      .filter((machine) =>
        [machine.name, machine.type, machine.brand, machine.model].some((value) => normalize(value).includes(search)),
      )
      .filter((machine) => type === "todos" || machine.type === type)
      .filter((machine) => status === "todos" || machine.status === status)
      .sort((a, b) => {
        const order = { overdue: 0, maintenance: 1, due: 2, ok: 3 };
        return order[machineCondition(a)] - order[machineCondition(b)] || a.name.localeCompare(b.name, "pt-BR");
      });

    elements.machineCount.textContent = filtered.length + (filtered.length === 1 ? " equipamento" : " equipamentos");
    elements.machineTableBody.replaceChildren(
      ...filtered.map((machine) => {
        const row = document.createElement("tr");
        const identity = document.createElement("td");
        const name = document.createElement("strong");
        name.textContent = machine.name;
        const details = document.createElement("small");
        details.textContent = [machine.brand, machine.model, machine.year].filter(Boolean).join(" · ");
        identity.append(name, details);

        const typeCell = document.createElement("td");
        typeCell.textContent = machine.type;

        const usage = document.createElement("td");
        const hours = document.createElement("strong");
        hours.textContent = Number(machine.hours || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " h";
        const fuel = document.createElement("small");
        fuel.textContent = Number(machine.fuelConsumption || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " L de combustível";
        usage.append(hours, fuel);

        const maintenance = document.createElement("td");
        const nextDate = document.createElement("strong");
        nextDate.textContent = formatDate(machine.nextMaintenance);
        const maintenanceDetail = document.createElement("small");
        const remainingDays = daysUntil(machine.nextMaintenance);
        maintenanceDetail.textContent =
          remainingDays < 0
            ? "Atrasada há " + Math.abs(remainingDays) + " dias"
            : remainingDays === 0
              ? "Prevista para hoje"
              : "Faltam " + remainingDays + " dias";
        maintenance.append(nextDate, maintenanceDetail);

        const cost = document.createElement("td");
        cost.textContent = currency.format(Number(machine.repairCost || 0));

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        const condition = machineCondition(machine);
        const visualStatus =
          condition === "ok" ? (machine.status === "Trabalhando" ? "working" : "available") : condition;
        statusBadge.className = "machine-status machine-status-" + visualStatus;
        statusBadge.textContent = machineStatusLabel(machine);
        statusCell.append(statusBadge);

        const actions = document.createElement("td");
        const actionsWrap = document.createElement("div");
        actionsWrap.className = "machine-actions";
        const update = document.createElement("button");
        update.className = "stock-move-button";
        update.type = "button";
        update.dataset.machineActivity = machine.id;
        update.textContent = "Atualizar";
        update.setAttribute("aria-label", "Registrar uso ou manutenção de " + machine.name);
        actionsWrap.append(update, createDeleteButton("machine", machine.id, machine.name));
        actions.append(actionsWrap);

        row.append(identity, typeCell, usage, maintenance, cost, statusCell, actions);
        return row;
      }),
    );

    const empty = filtered.length === 0;
    elements.machineEmpty.hidden = !empty;
    elements.machineTableBody.closest("table").hidden = empty;
  }

  function renderAll() {
    renderMetrics();
    renderDashboardChart();
    renderDashboardTasks();
    renderDashboardCrops();
    renderDashboardAlerts();
    renderFinance();
    renderAgenda();
    renderCrops();
    renderAnimals();
    renderStock();
    renderMachines();
  }

  function openDialog(type) {
    const map = {
      transaction: [elements.transactionDialog, elements.transactionForm],
      task: [elements.taskDialog, elements.taskForm],
      crop: [elements.cropDialog, elements.cropForm],
      animal: [elements.animalDialog, elements.animalForm],
      stock: [elements.stockDialog, elements.stockForm],
      machine: [elements.machineDialog, elements.machineForm],
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
    if (type === "machine") {
      form.elements.year.value = new Date().getFullYear();
      form.elements.lastMaintenance.value = isoDate(new Date());
      form.elements.nextMaintenance.value = addDays(90);
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

  function handleStockSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    state.inventory.push({
      id: createId("stock"),
      name: String(data.get("name")).trim(),
      category: data.get("category"),
      quantity: Number(data.get("quantity")),
      unit: data.get("unit"),
      minimum: Number(data.get("minimum")),
      location: String(data.get("location")).trim(),
      updatedAt: isoDate(new Date()),
    });
    saveState();
    renderAll();
    closeDialogs();
    showView("estoque");
    showToast("Item adicionado ao estoque.");
  }

  function handleMachineSubmit(event) {
    event.preventDefault();
    event.currentTarget.elements.nextMaintenance.setCustomValidity("");
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    if (data.get("nextMaintenance") < data.get("lastMaintenance")) {
      event.currentTarget.elements.nextMaintenance.setCustomValidity(
        "A próxima manutenção deve ser posterior à última manutenção.",
      );
      event.currentTarget.elements.nextMaintenance.reportValidity();
      return;
    }
    state.machines.push({
      id: createId("machine"),
      name: String(data.get("name")).trim(),
      type: data.get("type"),
      brand: String(data.get("brand")).trim(),
      model: String(data.get("model")).trim(),
      year: Number(data.get("year")),
      hours: Number(data.get("hours")),
      fuelConsumption: Number(data.get("fuelConsumption")),
      lastMaintenance: data.get("lastMaintenance"),
      nextMaintenance: data.get("nextMaintenance"),
      repairCost: Number(data.get("repairCost")),
      status: data.get("status"),
      updatedAt: isoDate(new Date()),
      history: [],
    });
    saveState();
    renderAll();
    closeDialogs();
    showView("maquinas");
    showToast("Máquina ou equipamento cadastrado com sucesso.");
  }

  function openStockMovement(id) {
    const item = state.inventory.find((stockItem) => stockItem.id === id);
    if (!item) return;
    stockMovementItemId = id;
    elements.stockMovementForm.reset();
    elements.stockMovementName.textContent = item.name;
    elements.stockMovementBalance.textContent = "Saldo atual: " + formatStockAmount(item);
    elements.stockMovementDialog.showModal();
    window.setTimeout(() => elements.stockMovementForm.querySelector("select, input")?.focus(), 0);
  }

  function handleStockMovement(event) {
    event.preventDefault();
    event.currentTarget.elements.quantity.setCustomValidity("");
    if (!event.currentTarget.reportValidity()) return;
    const item = state.inventory.find((stockItem) => stockItem.id === stockMovementItemId);
    if (!item) return;
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get("quantity"));
    const type = data.get("type");

    if (type === "saida" && amount > Number(item.quantity)) {
      event.currentTarget.elements.quantity.setCustomValidity("A saída não pode ser maior que o saldo disponível.");
      event.currentTarget.elements.quantity.reportValidity();
      return;
    }

    item.quantity = Math.max(0, Number(item.quantity) + (type === "entrada" ? amount : -amount));
    item.updatedAt = isoDate(new Date());
    saveState();
    renderAll();
    closeDialogs();
    showView("estoque");
    showToast(type === "entrada" ? "Entrada registrada no estoque." : "Saída registrada no estoque.");
    stockMovementItemId = null;
  }

  function openMachineActivity(id) {
    const machine = state.machines.find((item) => item.id === id);
    if (!machine) return;
    machineActivityItemId = id;
    elements.machineActivityForm.reset();
    elements.machineActivityForm.elements.date.value = isoDate(new Date());
    elements.machineActivityForm.elements.nextMaintenance.value = machine.nextMaintenance;
    elements.machineActivityForm.elements.status.value = machine.status;
    elements.machineActivityName.textContent = machine.name;
    elements.machineActivityBalance.textContent =
      Number(machine.hours || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
      " h trabalhadas · " +
      Number(machine.fuelConsumption || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
      " L registrados";
    elements.machineActivityDialog.showModal();
    window.setTimeout(() => elements.machineActivityForm.querySelector("select, input")?.focus(), 0);
  }

  function handleMachineActivity(event) {
    event.preventDefault();
    event.currentTarget.elements.nextMaintenance.setCustomValidity("");
    if (!event.currentTarget.reportValidity()) return;
    const machine = state.machines.find((item) => item.id === machineActivityItemId);
    if (!machine) return;
    const data = new FormData(event.currentTarget);
    const activityType = data.get("type");
    const activityDate = data.get("date");
    const nextMaintenance = data.get("nextMaintenance");

    if (activityType === "manutencao" && nextMaintenance < activityDate) {
      event.currentTarget.elements.nextMaintenance.setCustomValidity(
        "Informe uma próxima manutenção posterior à data deste serviço.",
      );
      event.currentTarget.elements.nextMaintenance.reportValidity();
      return;
    }

    const addedHours = Number(data.get("hours") || 0);
    const addedFuel = Number(data.get("fuel") || 0);
    const addedCost = Number(data.get("cost") || 0);
    machine.hours = Number(machine.hours || 0) + addedHours;
    machine.fuelConsumption = Number(machine.fuelConsumption || 0) + addedFuel;
    machine.repairCost = Number(machine.repairCost || 0) + addedCost;
    machine.nextMaintenance = nextMaintenance;
    machine.status = data.get("status");
    machine.updatedAt = activityDate;
    if (activityType === "manutencao") machine.lastMaintenance = activityDate;
    machine.history.unshift({
      id: createId("machine-activity"),
      type: activityType,
      date: activityDate,
      hours: addedHours,
      fuel: addedFuel,
      cost: addedCost,
      note: String(data.get("note") || "").trim(),
    });
    machine.history = machine.history.slice(0, 20);

    saveState();
    renderAll();
    closeDialogs();
    showView("maquinas");
    showToast(activityType === "manutencao" ? "Manutenção registrada e alertas atualizados." : "Uso do equipamento atualizado.");
    machineActivityItemId = null;
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
      stock: "inventory",
      machine: "machines",
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
  elements.stockForm.addEventListener("submit", handleStockSubmit);
  elements.stockMovementForm.addEventListener("submit", handleStockMovement);
  elements.machineForm.addEventListener("submit", handleMachineSubmit);
  elements.machineActivityForm.addEventListener("submit", handleMachineActivity);
  elements.confirmDelete.addEventListener("click", confirmDelete);
  elements.financeMonth.addEventListener("change", renderFinance);
  elements.financeTypeFilter.addEventListener("change", renderFinance);
  elements.animalSearch.addEventListener("input", renderAnimals);
  elements.stockSearch.addEventListener("input", renderStock);
  elements.stockCategoryFilter.addEventListener("change", renderStock);
  elements.stockStatusFilter.addEventListener("change", renderStock);
  elements.machineSearch.addEventListener("input", renderMachines);
  elements.machineTypeFilter.addEventListener("change", renderMachines);
  elements.machineStatusFilter.addEventListener("change", renderMachines);

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

    const stockMoveButton = event.target.closest("[data-stock-move]");
    if (stockMoveButton) openStockMovement(stockMoveButton.dataset.stockMove);

    const machineActivityButton = event.target.closest("[data-machine-activity]");
    if (machineActivityButton) openMachineActivity(machineActivityButton.dataset.machineActivity);

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
