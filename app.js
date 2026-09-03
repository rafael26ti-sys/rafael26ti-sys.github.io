(() => {
  "use strict";

  const STORAGE_KEY = "controle-rural-simples.profissional.v1";
  const VIEWS = ["dashboard", "financeiro", "agenda", "plantacoes", "animais", "estoque", "maquinas", "equipe", "mensagens", "relatorios", "clima"];
  const TEAM_ROLE_LABELS = {
    owner: "Dono da fazenda",
    vaqueiro: "Vaqueiro",
    caseiro: "Caseiro",
  };

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
  const reportMonthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const reportDateTime = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const forecastDayLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

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
      weatherLocation: {
        name: "Belo Horizonte",
        admin1: "Minas Gerais",
        country: "Brasil",
        latitude: -19.9208,
        longitude: -43.9378,
      },
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
      if (!parsed.weatherLocation) parsed.weatherLocation = seedState().weatherLocation;
      return parsed;
    } catch {
      return seedState();
    }
  }

  function saveState() {
    try {
      const storedState = {
        ...state,
        transactions:
          financeStorageMode === "local" ? state.transactions : localTransactionBackup,
        tasks: taskStorageMode === "local" ? state.tasks : localTaskBackup,
        crops: cropStorageMode === "local" ? state.crops : localCropBackup,
        animals: animalStorageMode === "local" ? state.animals : localAnimalBackup,
        inventory: stockStorageMode === "local" ? state.inventory : localStockBackup,
        machines: machineStorageMode === "local" ? state.machines : localMachineBackup,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
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
    weatherSymbol: document.querySelector("#weather-symbol"),
    metricWeatherTemperature: document.querySelector("#metric-weather-temperature"),
    metricWeatherSummary: document.querySelector("#metric-weather-summary"),
    dashboardChart: document.querySelector("#dashboard-chart"),
    dashboardTaskList: document.querySelector("#dashboard-task-list"),
    dashboardCrops: document.querySelector("#dashboard-crops"),
    dashboardAlertCount: document.querySelector("#dashboard-alert-count"),
    dashboardAlertList: document.querySelector("#dashboard-alert-list"),
    notificationButton: document.querySelector("#notification-button"),
    notificationCount: document.querySelector("#notification-count"),
    notificationPanel: document.querySelector("#notification-panel"),
    notificationList: document.querySelector("#notification-list"),
    notificationEmpty: document.querySelector("#notification-empty"),
    notificationMarkAll: document.querySelector("#notification-mark-all"),
    storageStatusSidebar: document.querySelector("#storage-status-sidebar"),
    storageStatusCopy: document.querySelector("#storage-status-copy"),
    financeSyncStatus: document.querySelector("#finance-sync-status"),
    financeMonth: document.querySelector("#finance-month"),
    financeTypeFilter: document.querySelector("#finance-type-filter"),
    financeCount: document.querySelector("#finance-count"),
    financeIncome: document.querySelector("#finance-income"),
    financeExpense: document.querySelector("#finance-expense"),
    financeProfit: document.querySelector("#finance-profit"),
    financeChart: document.querySelector("#finance-chart"),
    financeTableBody: document.querySelector("#finance-table-body"),
    financeEmpty: document.querySelector("#finance-empty"),
    taskSyncStatus: document.querySelector("#task-sync-status"),
    taskAssignee: document.querySelector("#task-assignee"),
    agendaStats: document.querySelector("#agenda-stats"),
    agendaList: document.querySelector("#agenda-list"),
    agendaEmpty: document.querySelector("#agenda-empty"),
    cropSummary: document.querySelector("#crop-summary"),
    cropSyncStatus: document.querySelector("#crop-sync-status"),
    cropList: document.querySelector("#crop-list"),
    cropEmpty: document.querySelector("#crop-empty"),
    animalSummary: document.querySelector("#animal-summary"),
    animalSyncStatus: document.querySelector("#animal-sync-status"),
    animalSearch: document.querySelector("#animal-search"),
    animalTableBody: document.querySelector("#animal-table-body"),
    animalEmpty: document.querySelector("#animal-empty"),
    navStockCount: document.querySelector("#nav-stock-count"),
    stockSyncStatus: document.querySelector("#stock-sync-status"),
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
    machineSyncStatus: document.querySelector("#machine-sync-status"),
    machineSummary: document.querySelector("#machine-summary"),
    machineAlert: document.querySelector("#machine-alert"),
    machineAlertText: document.querySelector("#machine-alert-text"),
    machineSearch: document.querySelector("#machine-search"),
    machineTypeFilter: document.querySelector("#machine-type-filter"),
    machineStatusFilter: document.querySelector("#machine-status-filter"),
    machineCount: document.querySelector("#machine-count"),
    machineTableBody: document.querySelector("#machine-table-body"),
    machineEmpty: document.querySelector("#machine-empty"),
    reportMonth: document.querySelector("#report-month"),
    reportAllPeriod: document.querySelector("#report-all-period"),
    reportGeneratedAt: document.querySelector("#report-generated-at"),
    reportPeriodLabel: document.querySelector("#report-period-label"),
    reportBalance: document.querySelector("#report-balance"),
    reportIncome: document.querySelector("#report-income"),
    reportExpense: document.querySelector("#report-expense"),
    reportProductionCost: document.querySelector("#report-production-cost"),
    reportCategoryChart: document.querySelector("#report-category-chart"),
    reportCategoryEmpty: document.querySelector("#report-category-empty"),
    reportCropTableBody: document.querySelector("#report-crop-table-body"),
    reportCropEmpty: document.querySelector("#report-crop-empty"),
    reportOperations: document.querySelector("#report-operations"),
    reportAnimalTableBody: document.querySelector("#report-animal-table-body"),
    reportAnimalEmpty: document.querySelector("#report-animal-empty"),
    reportStockTableBody: document.querySelector("#report-stock-table-body"),
    reportStockEmpty: document.querySelector("#report-stock-empty"),
    reportMachineTableBody: document.querySelector("#report-machine-table-body"),
    reportMachineEmpty: document.querySelector("#report-machine-empty"),
    printReport: document.querySelector("#print-report"),
    navClimateCount: document.querySelector("#nav-climate-count"),
    weatherLocationLabel: document.querySelector("#weather-location-label"),
    weatherUpdatedAt: document.querySelector("#weather-updated-at"),
    weatherStatus: document.querySelector("#weather-status"),
    weatherSearchForm: document.querySelector("#weather-search-form"),
    weatherSearchInput: document.querySelector("#weather-search-input"),
    weatherRefresh: document.querySelector("#weather-refresh"),
    weatherCurrent: document.querySelector("#weather-current"),
    weatherForecast: document.querySelector("#weather-forecast"),
    weatherAlerts: document.querySelector("#weather-alerts"),
    teamRefresh: document.querySelector("#team-refresh"),
    teamInviteForm: document.querySelector("#team-invite-form"),
    teamSyncStatus: document.querySelector("#team-sync-status"),
    teamMembersBody: document.querySelector("#team-members-body"),
    teamMembersEmpty: document.querySelector("#team-members-empty"),
    teamInvitesBody: document.querySelector("#team-invites-body"),
    teamInvitesEmpty: document.querySelector("#team-invites-empty"),
    teamInviteCount: document.querySelector("#team-invite-count"),
    teamLatestInvite: document.querySelector("#team-latest-invite"),
    teamLatestCode: document.querySelector("#team-latest-code"),
    teamLatestExpiry: document.querySelector("#team-latest-expiry"),
    teamCopyLatest: document.querySelector("#team-copy-latest"),
    navMessageCount: document.querySelector("#nav-message-count"),
    messageSyncStatus: document.querySelector("#message-sync-status"),
    messageRefresh: document.querySelector("#message-refresh"),
    messageSummary: document.querySelector("#message-summary"),
    messageStatusFilter: document.querySelector("#message-status-filter"),
    messageCount: document.querySelector("#message-count"),
    messageTableBody: document.querySelector("#message-table-body"),
    messageEmpty: document.querySelector("#message-empty"),
    transactionDialog: document.querySelector("#transaction-dialog"),
    transactionForm: document.querySelector("#transaction-form"),
    taskDialog: document.querySelector("#task-dialog"),
    taskForm: document.querySelector("#task-form"),
    cropDialog: document.querySelector("#crop-dialog"),
    cropForm: document.querySelector("#crop-form"),
    animalDialog: document.querySelector("#animal-dialog"),
    animalForm: document.querySelector("#animal-form"),
    animalHealthDialog: document.querySelector("#animal-health-dialog"),
    animalHealthForm: document.querySelector("#animal-health-form"),
    animalHealthEditor: document.querySelector("#animal-health-editor"),
    animalHealthName: document.querySelector("#animal-health-name"),
    animalHealthSummary: document.querySelector("#animal-health-summary"),
    animalHealthFormTitle: document.querySelector("#animal-health-form-title"),
    animalHealthCancel: document.querySelector("#animal-health-cancel"),
    animalHealthWeightField: document.querySelector("#animal-health-weight-field"),
    animalHealthNextDueField: document.querySelector("#animal-health-next-due-field"),
    animalHealthStatus: document.querySelector("#animal-health-status"),
    animalHealthTableBody: document.querySelector("#animal-health-table-body"),
    animalHealthEmpty: document.querySelector("#animal-health-empty"),
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
    equipe: "Equipe",
    mensagens: "Mensagens recebidas",
    relatorios: "Relatórios",
    clima: "Clima e alertas",
  };

  const editorConfig = {
    transaction: {
      collection: "transactions",
      prefix: "transaction",
      dialog: elements.transactionDialog,
      form: elements.transactionForm,
      newTitle: "Novo lançamento",
      editTitle: "Editar lançamento",
      newSubmit: "Salvar lançamento",
      editSubmit: "Salvar alterações",
    },
    task: {
      collection: "tasks",
      prefix: "task",
      dialog: elements.taskDialog,
      form: elements.taskForm,
      newTitle: "Nova tarefa",
      editTitle: "Editar tarefa",
      newSubmit: "Salvar tarefa",
      editSubmit: "Salvar alterações",
    },
    crop: {
      collection: "crops",
      prefix: "crop",
      dialog: elements.cropDialog,
      form: elements.cropForm,
      newTitle: "Nova plantação",
      editTitle: "Editar plantação",
      newSubmit: "Salvar plantação",
      editSubmit: "Salvar alterações",
    },
    animal: {
      collection: "animals",
      prefix: "animal",
      dialog: elements.animalDialog,
      form: elements.animalForm,
      newTitle: "Novo animal",
      editTitle: "Editar animal",
      newSubmit: "Salvar animal",
      editSubmit: "Salvar alterações",
    },
    stock: {
      collection: "inventory",
      prefix: "stock",
      dialog: elements.stockDialog,
      form: elements.stockForm,
      newTitle: "Novo item",
      editTitle: "Editar item",
      newSubmit: "Salvar item",
      editSubmit: "Salvar alterações",
    },
    machine: {
      collection: "machines",
      prefix: "machine",
      dialog: elements.machineDialog,
      form: elements.machineForm,
      newTitle: "Novo equipamento",
      editTitle: "Editar equipamento",
      newSubmit: "Salvar equipamento",
      editSubmit: "Salvar alterações",
    },
  };

  let state = loadState();
  let localTransactionBackup = state.transactions.map((item) => ({ ...item }));
  let localTaskBackup = state.tasks.map((item) => ({ ...item }));
  let localCropBackup = state.crops.map((item) => ({ ...item }));
  let localAnimalBackup = state.animals.map((item) => ({ ...item }));
  let localStockBackup = state.inventory.map((item) => ({ ...item }));
  let localMachineBackup = state.machines.map((item) => ({
    ...item,
    history: Array.isArray(item.history) ? item.history.map((record) => ({ ...record })) : [],
  }));
  let activeAccount = null;
  let financeStorageMode = "waiting";
  let taskStorageMode = "waiting";
  let cropStorageMode = "waiting";
  let animalStorageMode = "waiting";
  let stockStorageMode = "waiting";
  let machineStorageMode = "waiting";
  let taskFilter = "todas";
  let editingRecord = null;
  let animalHealthAnimalId = null;
  let animalHealthRecords = [];
  let animalHealthEditingId = null;
  let animalHealthLoading = false;
  let stockMovementItemId = null;
  let machineActivityItemId = null;
  let weatherData = null;
  let weatherFetchController = null;
  let pendingDelete = null;
  let toastTimer = null;
  let teamMembers = [];
  let teamInvites = [];
  let contactAdmin = false;
  let contactMessages = [];
  let latestInviteCode = "";
  let notifications = [];
  let notificationsChannel = null;

  if (!elements.financeMonth.value) {
    elements.financeMonth.value = monthKey(isoDate(new Date()));
  }
  if (!elements.reportMonth.value) {
    elements.reportMonth.value = monthKey(isoDate(new Date()));
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 3200);
  }

  function notificationFromDatabase(row) {
    return {
      id: row.id,
      taskId: row.task_id || "",
      title: row.title,
      message: row.message,
      readAt: row.read_at,
      createdAt: row.created_at,
    };
  }

  function notificationDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Agora" : reportDateTime.format(date);
  }

  function setNotificationPanel(open) {
    if (!elements.notificationPanel || !elements.notificationButton) return;
    elements.notificationPanel.hidden = !open;
    elements.notificationButton.setAttribute("aria-expanded", String(open));
  }

  function renderNotifications() {
    if (!elements.notificationList) return;
    const unread = notifications.filter((notification) => !notification.readAt).length;
    elements.notificationCount.textContent = unread > 99 ? "99+" : String(unread);
    elements.notificationCount.hidden = unread === 0;
    elements.notificationButton.setAttribute(
      "aria-label",
      unread === 0
        ? "Nenhuma notificação não lida"
        : `${unread} ${unread === 1 ? "notificação não lida" : "notificações não lidas"}`,
    );
    elements.notificationMarkAll.hidden = unread === 0;
    elements.notificationList.replaceChildren(
      ...notifications.map((notification) => {
        const item = document.createElement("button");
        item.className = `notification-item${notification.readAt ? "" : " is-unread"}`;
        item.type = "button";
        item.dataset.openNotification = notification.id;
        item.dataset.taskId = notification.taskId;

        const icon = document.createElement("span");
        icon.className = "notification-item-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "✓";

        const copy = document.createElement("span");
        copy.className = "notification-item-copy";
        const title = document.createElement("strong");
        title.textContent = notification.title;
        const message = document.createElement("span");
        message.textContent = notification.message;
        const date = document.createElement("small");
        date.textContent = `${notificationDateTime(notification.createdAt)} · Abrir atividade`;
        copy.append(title, message, date);

        const dot = document.createElement("span");
        dot.className = "notification-unread-dot";
        dot.hidden = Boolean(notification.readAt);
        dot.setAttribute("aria-hidden", "true");
        item.append(icon, copy, dot);
        return item;
      }),
    );
    elements.notificationEmpty.hidden = notifications.length > 0;
  }

  async function loadNotificationsFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId || !activeAccount?.userId) return;
    const { data, error } = await client
      .from("notifications")
      .select("id, task_id, title, message, read_at, created_at")
      .eq("farm_id", activeAccount.farmId)
      .eq("recipient_id", activeAccount.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("Falha ao carregar as notificações.", error);
      showToast("Não foi possível carregar suas notificações.");
      return;
    }
    notifications = (data || []).map(notificationFromDatabase);
    renderNotifications();
  }

  function receiveNotification(row, announce = false) {
    const incoming = notificationFromDatabase(row);
    const existingIndex = notifications.findIndex((item) => item.id === incoming.id);
    if (existingIndex >= 0) notifications[existingIndex] = incoming;
    else notifications.unshift(incoming);
    notifications = notifications
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
      .slice(0, 30);
    renderNotifications();
    if (announce && !incoming.readAt) {
      showToast(`Nova atividade para você: ${incoming.message}`);
    }
  }

  async function subscribeToNotifications() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.userId) return;
    if (notificationsChannel) {
      await client.removeChannel(notificationsChannel);
      notificationsChannel = null;
    }
    const filter = `recipient_id=eq.${activeAccount.userId}`;
    notificationsChannel = client
      .channel(`rural-notifications-${activeAccount.userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter },
        (payload) => receiveNotification(payload.new, true),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter },
        (payload) => receiveNotification(payload.new),
      )
      .subscribe();
  }

  async function initializeNotifications() {
    await subscribeToNotifications();
    await loadNotificationsFromSupabase();
  }

  async function markNotificationRead(id) {
    const notification = notifications.find((item) => item.id === id);
    if (!notification || notification.readAt || !activeAccount?.userId) return true;
    const readAt = new Date().toISOString();
    const { data, error } = await window.ruralSupabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("id", id)
      .eq("recipient_id", activeAccount.userId)
      .select("id, read_at")
      .single();
    if (error || !data) {
      console.error("Falha ao marcar a notificação como lida.", error);
      showToast("Não foi possível atualizar esta notificação.");
      return false;
    }
    notification.readAt = data.read_at;
    renderNotifications();
    return true;
  }

  async function markAllNotificationsRead() {
    if (!activeAccount?.userId || !notifications.some((item) => !item.readAt)) return;
    elements.notificationMarkAll.disabled = true;
    const readAt = new Date().toISOString();
    const { error } = await window.ruralSupabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("recipient_id", activeAccount.userId)
      .is("read_at", null);
    elements.notificationMarkAll.disabled = false;
    if (error) {
      console.error("Falha ao marcar as notificações como lidas.", error);
      showToast("Não foi possível atualizar as notificações.");
      return;
    }
    notifications.forEach((notification) => {
      if (!notification.readAt) notification.readAt = readAt;
    });
    renderNotifications();
  }

  async function openNotification(id, taskId) {
    await markNotificationRead(id);
    setNotificationPanel(false);
    showView("agenda");
    window.requestAnimationFrame(() => {
      const task = [...elements.agendaList.querySelectorAll("[data-task-id]")].find(
        (item) => item.dataset.taskId === taskId,
      );
      if (!task) return;
      task.scrollIntoView({ behavior: "smooth", block: "center" });
      task.classList.add("notification-focus");
      window.setTimeout(() => task.classList.remove("notification-focus"), 2600);
    });
  }

  function setFinanceStatus(mode, message) {
    financeStorageMode = mode;
    const visualState =
      mode === "supabase" ? "ready" : mode === "restricted" ? "restricted" : mode;
    if (elements.financeSyncStatus) {
      elements.financeSyncStatus.dataset.state = visualState;
      elements.financeSyncStatus.textContent = message;
    }
    document.querySelectorAll('[data-open-dialog="transaction"]').forEach((button) => {
      button.disabled = mode !== "supabase";
    });
  }

  function setTaskStatus(mode, message) {
    taskStorageMode = mode;
    if (elements.taskSyncStatus) {
      elements.taskSyncStatus.dataset.state = mode === "supabase" ? "ready" : mode;
      elements.taskSyncStatus.textContent = message;
    }
    document.querySelectorAll('[data-open-dialog="task"]').forEach((button) => {
      button.disabled = mode !== "supabase" || activeAccount?.role !== "owner";
    });
  }

  function canManageCrops() {
    return Boolean(activeAccount && ["owner", "caseiro"].includes(activeAccount.role));
  }

  function canManageAnimals() {
    return Boolean(activeAccount && ["owner", "vaqueiro"].includes(activeAccount.role));
  }

  function canManageStock() {
    return Boolean(activeAccount && ["owner", "caseiro"].includes(activeAccount.role));
  }

  function canManageMachines() {
    return Boolean(activeAccount && ["owner", "caseiro"].includes(activeAccount.role));
  }

  function setCropStatus(mode, message) {
    cropStorageMode = mode;
    if (elements.cropSyncStatus) {
      elements.cropSyncStatus.dataset.state = mode === "supabase" ? "ready" : mode;
      elements.cropSyncStatus.textContent = message;
    }
    document.querySelectorAll('[data-open-dialog="crop"]').forEach((button) => {
      button.hidden = !canManageCrops();
      button.disabled = mode !== "supabase";
    });
  }

  function setAnimalStatus(mode, message) {
    animalStorageMode = mode;
    if (elements.animalSyncStatus) {
      elements.animalSyncStatus.dataset.state = mode === "supabase" ? "ready" : mode;
      elements.animalSyncStatus.textContent = message;
    }
    document.querySelectorAll('[data-open-dialog="animal"]').forEach((button) => {
      button.hidden = !canManageAnimals();
      button.disabled = mode !== "supabase";
    });
  }

  function setStockStatus(mode, message) {
    stockStorageMode = mode;
    if (elements.stockSyncStatus) {
      elements.stockSyncStatus.dataset.state = mode === "supabase" ? "ready" : mode;
      elements.stockSyncStatus.textContent = message;
    }
    document.querySelectorAll('[data-open-dialog="stock"]').forEach((button) => {
      button.hidden = !canManageStock();
      button.disabled = mode !== "supabase";
    });
  }

  function setMachineStatus(mode, message) {
    machineStorageMode = mode;
    if (elements.machineSyncStatus) {
      elements.machineSyncStatus.dataset.state = mode === "supabase" ? "ready" : mode;
      elements.machineSyncStatus.textContent = message;
    }
    document.querySelectorAll('[data-open-dialog="machine"]').forEach((button) => {
      button.hidden = !canManageMachines();
      button.disabled = mode !== "supabase";
    });
  }

  function updateStorageSummary() {
    if (!activeAccount) return;
    const financeReady = financeStorageMode === "supabase";
    const tasksReady = taskStorageMode === "supabase";
    const cropsReady = cropStorageMode === "supabase";
    const animalsReady = animalStorageMode === "supabase";
    const stockReady = stockStorageMode === "supabase";
    const machinesReady = machineStorageMode === "supabase";
    let sidebar = "Conectando os dados da propriedade...";
    let banner = "<strong>Acesso protegido pelo Supabase.</strong> Sincronizando os dados da propriedade.";

    if (
      activeAccount.role === "owner" &&
      financeReady &&
      tasksReady &&
      cropsReady &&
      animalsReady &&
      stockReady &&
      machinesReady
    ) {
      sidebar = "Todos os módulos operacionais estão no Supabase.";
      banner = "<strong>Dados da fazenda sincronizados com segurança.</strong> Financeiro, Agenda, Produção, Estoque e Máquinas estão compartilhados.";
    } else if (activeAccount.role === "owner" && financeReady) {
      sidebar = "Financeiro no Supabase; conectando a Agenda.";
      banner = "<strong>Financeiro sincronizado com o Supabase.</strong> A Agenda está sendo conectada.";
    } else if (tasksReady && cropsReady && animalsReady && stockReady && machinesReady) {
      sidebar = "Dados operacionais compartilhados no Supabase.";
      banner = "<strong>Dados da propriedade sincronizados pelo Supabase.</strong> Seu acesso respeita o cargo na fazenda.";
    }

    if (elements.storageStatusSidebar) elements.storageStatusSidebar.textContent = sidebar;
    if (elements.storageStatusCopy) elements.storageStatusCopy.innerHTML = banner;
  }

  function taskFromDatabase(row) {
    return {
      id: row.id,
      title: row.title,
      date: row.due_date,
      category: row.category,
      priority: row.priority,
      responsible: row.responsible_name || "Toda a equipe",
      assignedTo: row.assigned_to || "",
      completed: Boolean(row.completed),
      completedAt: row.completed_at,
    };
  }

  function taskToDatabase(task) {
    return {
      title: task.title,
      due_date: task.date,
      category: task.category,
      priority: task.priority,
      responsible_name: task.responsible,
      assigned_to: task.assignedTo || null,
      notes: null,
    };
  }

  const CROP_STATUS_TO_DATABASE = {
    Preparando: "preparando",
    Plantada: "plantada",
    Crescendo: "crescendo",
    Colhida: "colhida",
  };
  const CROP_STATUS_FROM_DATABASE = {
    preparando: "Preparando",
    plantada: "Plantada",
    crescendo: "Crescendo",
    colhida: "Colhida",
  };

  function cropFromDatabase(row) {
    return {
      id: row.id,
      name: row.name,
      area: Number(row.area_hectares),
      plantingDate: row.planting_date,
      harvestDate: row.planned_harvest_date,
      harvestedOn: row.harvested_on || "",
      harvested: Number(row.harvested_quantity || 0),
      cost: Number(row.production_cost || 0),
      status: CROP_STATUS_FROM_DATABASE[row.status] || "Preparando",
    };
  }

  function cropToDatabase(crop) {
    const status = CROP_STATUS_TO_DATABASE[crop.status] || "preparando";
    return {
      name: crop.name,
      area_hectares: crop.area,
      planting_date: crop.plantingDate,
      planned_harvest_date: crop.harvestDate,
      harvested_on: status === "colhida" ? crop.harvestedOn || isoDate(new Date()) : null,
      harvested_quantity: crop.harvested || 0,
      harvested_unit: null,
      production_cost: crop.cost || 0,
      status,
      notes: null,
    };
  }

  function animalFromDatabase(row) {
    return {
      id: row.id,
      name: row.identifier,
      species: row.species,
      breed: row.breed || "",
      birthDate: row.birth_date || "",
      weight: Number(row.weight_kg || 0),
      vaccines: row.applied_vaccines || "",
      nextVaccine: row.next_vaccination || "",
      health: row.health_notes || "",
    };
  }

  function animalToDatabase(animal) {
    return {
      identifier: animal.name,
      species: animal.species,
      breed: animal.breed || null,
      birth_date: animal.birthDate || null,
      weight_kg: animal.weight || null,
      applied_vaccines: animal.vaccines || null,
      next_vaccination: animal.nextVaccine || null,
      health_notes: animal.health || null,
      active: true,
    };
  }

  const ANIMAL_HEALTH_TYPE_LABELS = {
    vacina: "Vacina",
    saude: "Saúde",
    peso: "Pesagem",
    medicamento: "Medicamento",
  };

  function animalHealthFromDatabase(row) {
    return {
      id: row.id,
      animalId: row.animal_id,
      type: row.record_type,
      occurredOn: row.occurred_on,
      description: row.description,
      weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
      nextDueDate: row.next_due_date || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function animalHealthFromRpc(row) {
    return animalHealthFromDatabase({
      id: row.record_id,
      animal_id: row.record_animal_id,
      record_type: row.saved_record_type,
      occurred_on: row.saved_occurred_on,
      description: row.saved_description,
      weight_kg: row.saved_weight_kg,
      next_due_date: row.saved_next_due_date,
      created_at: row.saved_created_at,
      updated_at: row.saved_updated_at,
    });
  }

  function updateAnimalFromHealthSnapshot(row) {
    const animalId = row.record_animal_id;
    const animal = state.animals.find((item) => item.id === animalId);
    if (!animal) return;
    if (Object.prototype.hasOwnProperty.call(row, "animal_weight_kg")) {
      animal.weight = Number(row.animal_weight_kg || 0);
    }
    if (Object.prototype.hasOwnProperty.call(row, "animal_next_vaccination")) {
      animal.nextVaccine = row.animal_next_vaccination || "";
    }
    if (Object.prototype.hasOwnProperty.call(row, "animal_applied_vaccines")) {
      animal.vaccines = row.animal_applied_vaccines || "";
    }
    if (Object.prototype.hasOwnProperty.call(row, "animal_health_notes")) {
      animal.health = row.animal_health_notes || "";
    }
    saveState();
    renderAll();
  }

  function stockFromDatabase(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      quantity: Number(row.quantity || 0),
      unit: row.unit,
      minimum: Number(row.minimum_quantity || 0),
      location: row.storage_location || "",
      updatedAt: String(row.updated_at || row.created_at || "").slice(0, 10),
    };
  }

  function stockToDatabase(item) {
    return {
      name: item.name,
      category: item.category,
      quantity: item.quantity || 0,
      unit: item.unit,
      minimum_quantity: item.minimum || 0,
      storage_location: item.location || null,
    };
  }

  const MACHINE_STATUS_TO_DATABASE = {
    Disponível: "disponivel",
    Trabalhando: "trabalhando",
    "Em manutenção": "em_manutencao",
  };
  const MACHINE_STATUS_FROM_DATABASE = {
    disponivel: "Disponível",
    trabalhando: "Trabalhando",
    em_manutencao: "Em manutenção",
  };

  function machineRecordFromDatabase(row) {
    return {
      id: row.id,
      type: row.activity_type,
      date: row.occurred_on,
      hours: Number(row.added_hours || 0),
      fuel: Number(row.fuel_liters || 0),
      cost: Number(row.cost || 0),
      note: row.notes || "",
    };
  }

  function machineFromDatabase(row) {
    return {
      id: row.id,
      name: row.name,
      type: row.machine_type,
      brand: row.brand || "",
      model: row.model || "",
      year: row.manufacture_year || "",
      hours: Number(row.work_hours || 0),
      fuelConsumption: Number(row.fuel_consumption_liters || 0),
      lastMaintenance: row.last_maintenance || "",
      nextMaintenance: row.next_maintenance || "",
      repairCost: Number(row.repair_cost || 0),
      status: MACHINE_STATUS_FROM_DATABASE[row.status] || "Disponível",
      updatedAt: String(row.updated_at || row.created_at || "").slice(0, 10),
      history: (row.machine_records || [])
        .map(machineRecordFromDatabase)
        .sort((left, right) => String(right.date).localeCompare(String(left.date)))
        .slice(0, 20),
    };
  }

  function machineToDatabase(machine) {
    return {
      name: machine.name,
      machine_type: machine.type,
      brand: machine.brand || null,
      model: machine.model || null,
      manufacture_year: machine.year || null,
      work_hours: machine.hours || 0,
      fuel_consumption_liters: machine.fuelConsumption || 0,
      last_maintenance: machine.lastMaintenance || null,
      next_maintenance: machine.nextMaintenance || null,
      repair_cost: machine.repairCost || 0,
      status: MACHINE_STATUS_TO_DATABASE[machine.status] || "disponivel",
    };
  }

  function isDemoRecord(record) {
    return String(record?.id || "").startsWith("seed-");
  }

  async function loadCropsFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId) {
      setCropStatus("error", "Falha na conexão");
      return;
    }
    setCropStatus("loading", "Sincronizando plantações...");
    state.crops = [];
    renderAll();
    let { data, error } = await client
      .from("crops")
      .select("id, name, area_hectares, planting_date, planned_harvest_date, harvested_on, harvested_quantity, production_cost, status")
      .eq("farm_id", activeAccount.farmId)
      .order("planned_harvest_date", { ascending: true });
    if (error) {
      console.error("Falha ao carregar as plantações.", error);
      setCropStatus("error", "Plantações indisponíveis");
      showToast("Não foi possível carregar as plantações do Supabase.");
      updateStorageSummary();
      return;
    }

    const rows = data || [];
    const localRecords = localCropBackup.filter((record) => !isDemoRecord(record));
    const missingRecords = localRecords.filter((record) =>
      !rows.some((row) =>
        normalize(row.name) === normalize(record.name) &&
        row.planting_date === record.plantingDate &&
        Number(row.area_hectares) === Number(record.area),
      ),
    );
    let localMigrationSucceeded = true;
    if (canManageCrops() && missingRecords.length) {
      const migrated = await client
        .from("crops")
        .insert(missingRecords.map((record) => ({
          ...cropToDatabase(record),
          farm_id: activeAccount.farmId,
        })))
        .select("id, name, area_hectares, planting_date, planned_harvest_date, harvested_on, harvested_quantity, production_cost, status");
      if (migrated.error) {
        localMigrationSucceeded = false;
        console.error("Falha ao migrar plantações locais.", migrated.error);
        showToast("As plantações do navegador foram preservadas, mas ainda não puderam ser migradas.");
      } else {
        rows.push(...(migrated.data || []));
      }
    }
    if (canManageCrops() && localRecords.length && localMigrationSucceeded) {
      localCropBackup = localCropBackup.filter(isDemoRecord);
    }

    state.crops = rows.map(cropFromDatabase);
    setCropStatus("supabase", canManageCrops() ? "Salvo no Supabase" : "Consulta compartilhada");
    saveState();
    updateStorageSummary();
    renderAll();
  }

  async function loadAnimalsFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId) {
      setAnimalStatus("error", "Falha na conexão");
      return;
    }
    setAnimalStatus("loading", "Sincronizando animais...");
    state.animals = [];
    renderAll();
    let { data, error } = await client
      .from("animals")
      .select("id, identifier, species, breed, birth_date, weight_kg, applied_vaccines, next_vaccination, health_notes")
      .eq("farm_id", activeAccount.farmId)
      .eq("active", true)
      .order("identifier", { ascending: true });
    if (error) {
      console.error("Falha ao carregar os animais.", error);
      setAnimalStatus("error", "Animais indisponíveis");
      showToast("Não foi possível carregar os animais do Supabase.");
      updateStorageSummary();
      return;
    }

    const rows = data || [];
    const localRecords = localAnimalBackup.filter((record) => !isDemoRecord(record));
    const missingRecords = localRecords.filter((record) =>
      !rows.some((row) => normalize(row.identifier) === normalize(record.name)),
    );
    let localMigrationSucceeded = true;
    if (canManageAnimals() && missingRecords.length) {
      const migrated = await client
        .from("animals")
        .insert(missingRecords.map((record) => ({
          ...animalToDatabase(record),
          farm_id: activeAccount.farmId,
        })))
        .select("id, identifier, species, breed, birth_date, weight_kg, applied_vaccines, next_vaccination, health_notes");
      if (migrated.error) {
        localMigrationSucceeded = false;
        console.error("Falha ao migrar animais locais.", migrated.error);
        showToast("Os animais do navegador foram preservados, mas ainda não puderam ser migrados.");
      } else {
        rows.push(...(migrated.data || []));
      }
    }
    if (canManageAnimals() && localRecords.length && localMigrationSucceeded) {
      localAnimalBackup = localAnimalBackup.filter(isDemoRecord);
    }

    state.animals = rows.map(animalFromDatabase);
    setAnimalStatus("supabase", canManageAnimals() ? "Salvo no Supabase" : "Consulta compartilhada");
    saveState();
    updateStorageSummary();
    renderAll();
  }

  async function loadStockFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId) {
      setStockStatus("error", "Falha na conexão");
      return;
    }
    setStockStatus("loading", "Sincronizando estoque...");
    state.inventory = [];
    renderAll();
    let { data, error } = await client
      .from("inventory_items")
      .select("id, name, category, quantity, unit, minimum_quantity, storage_location, created_at, updated_at")
      .eq("farm_id", activeAccount.farmId)
      .order("name", { ascending: true });
    if (error) {
      console.error("Falha ao carregar o estoque.", error);
      setStockStatus("error", "Estoque indisponível");
      showToast("Não foi possível carregar o estoque do Supabase.");
      updateStorageSummary();
      return;
    }

    const rows = data || [];
    const localRecords = localStockBackup.filter((record) => !isDemoRecord(record));
    const missingRecords = localRecords.filter((record) =>
      !rows.some((row) => normalize(row.name) === normalize(record.name)),
    );
    let localMigrationSucceeded = true;
    if (canManageStock() && missingRecords.length) {
      const migrated = await client
        .from("inventory_items")
        .insert(missingRecords.map((record) => ({
          ...stockToDatabase(record),
          farm_id: activeAccount.farmId,
        })))
        .select("id, name, category, quantity, unit, minimum_quantity, storage_location, created_at, updated_at");
      if (migrated.error) {
        localMigrationSucceeded = false;
        console.error("Falha ao migrar o estoque local.", migrated.error);
        showToast("O estoque do navegador foi preservado, mas ainda não pôde ser migrado.");
      } else {
        rows.push(...(migrated.data || []));
      }
    }
    if (canManageStock() && localRecords.length && localMigrationSucceeded) {
      localStockBackup = localStockBackup.filter(isDemoRecord);
    }

    state.inventory = rows.map(stockFromDatabase);
    setStockStatus("supabase", canManageStock() ? "Salvo no Supabase" : "Consulta compartilhada");
    saveState();
    updateStorageSummary();
    renderAll();
  }

  async function loadMachinesFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId) {
      setMachineStatus("error", "Falha na conexão");
      return;
    }
    setMachineStatus("loading", "Sincronizando máquinas...");
    state.machines = [];
    renderAll();
    let { data, error } = await client
      .from("machines")
      .select("id, name, machine_type, brand, model, manufacture_year, work_hours, fuel_consumption_liters, last_maintenance, next_maintenance, repair_cost, status, created_at, updated_at, machine_records(id, activity_type, occurred_on, added_hours, fuel_liters, cost, next_maintenance, status_after, notes, created_at)")
      .eq("farm_id", activeAccount.farmId)
      .order("name", { ascending: true });
    if (error) {
      console.error("Falha ao carregar as máquinas.", error);
      setMachineStatus("error", "Máquinas indisponíveis");
      showToast("Não foi possível carregar as máquinas do Supabase.");
      updateStorageSummary();
      return;
    }

    const rows = data || [];
    const localRecords = localMachineBackup.filter((record) => !isDemoRecord(record));
    const missingRecords = localRecords.filter((record) =>
      !rows.some((row) => normalize(row.name) === normalize(record.name)),
    );
    let localMigrationSucceeded = true;
    if (canManageMachines() && missingRecords.length) {
      const migrated = await client
        .from("machines")
        .insert(missingRecords.map((record) => ({
          ...machineToDatabase(record),
          farm_id: activeAccount.farmId,
        })))
        .select("id, name, machine_type, brand, model, manufacture_year, work_hours, fuel_consumption_liters, last_maintenance, next_maintenance, repair_cost, status, created_at, updated_at");
      if (migrated.error) {
        localMigrationSucceeded = false;
        console.error("Falha ao migrar as máquinas locais.", migrated.error);
        showToast("As máquinas do navegador foram preservadas, mas ainda não puderam ser migradas.");
      } else {
        rows.push(...(migrated.data || []).map((row) => ({ ...row, machine_records: [] })));
      }
    }
    if (canManageMachines() && localRecords.length && localMigrationSucceeded) {
      localMachineBackup = localMachineBackup.filter(isDemoRecord);
    }

    state.machines = rows.map(machineFromDatabase);
    setMachineStatus("supabase", canManageMachines() ? "Salvo no Supabase" : "Consulta compartilhada");
    saveState();
    updateStorageSummary();
    renderAll();
  }

  function canCurrentUserToggleTask(task) {
    return Boolean(
      activeAccount &&
        (activeAccount.role === "owner" || !task.assignedTo || task.assignedTo === activeAccount.userId),
    );
  }

  function refreshTaskAssigneeOptions(selectedValue = elements.taskAssignee?.value || "") {
    if (!elements.taskAssignee) return;
    const members = teamMembers.length
      ? teamMembers
      : activeAccount
        ? [{
            userId: activeAccount.userId,
            fullName: activeAccount.fullName,
            role: activeAccount.role,
            status: "active",
          }]
        : [];
    const options = [];
    const everyone = document.createElement("option");
    everyone.value = "";
    everyone.textContent = "Toda a equipe";
    everyone.dataset.fullName = "Toda a equipe";
    options.push(everyone);
    members.forEach((member) => {
      const option = document.createElement("option");
      option.value = member.userId;
      option.dataset.fullName = member.fullName;
      option.textContent = `${member.fullName} — ${TEAM_ROLE_LABELS[member.role] || "Membro"}${member.status === "active" ? "" : " (desativado)"}`;
      option.disabled = member.status !== "active";
      options.push(option);
    });
    elements.taskAssignee.replaceChildren(...options);
    elements.taskAssignee.value = selectedValue;
  }

  async function loadTasksFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId) {
      setTaskStatus("error", "Falha na conexão");
      return;
    }
    setTaskStatus("loading", "Sincronizando agenda...");
    state.tasks = [];
    renderAll();
    const { data, error } = await client
      .from("tasks")
      .select("id, title, due_date, category, priority, responsible_name, assigned_to, completed, completed_at")
      .eq("farm_id", activeAccount.farmId)
      .order("due_date", { ascending: true });
    if (error) {
      console.error("Falha ao carregar as tarefas.", error);
      setTaskStatus("error", "Agenda indisponível");
      showToast("Não foi possível carregar a Agenda do Supabase.");
      updateStorageSummary();
      return;
    }
    state.tasks = (data || []).map(taskFromDatabase);
    setTaskStatus("supabase", "Agenda compartilhada");
    updateStorageSummary();
    renderAll();
  }

  function setTeamStatus(mode, message) {
    if (!elements.teamSyncStatus) return;
    elements.teamSyncStatus.dataset.state = mode;
    elements.teamSyncStatus.textContent = message;
  }

  function teamDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : reportDateTime.format(date);
  }

  function createTeamBadge(label, kind) {
    const badge = document.createElement("span");
    badge.className = `team-badge team-badge-${kind}`;
    badge.textContent = label;
    return badge;
  }

  function appendTeamCell(row, content) {
    const cell = document.createElement("td");
    if (content instanceof Node) cell.append(content);
    else cell.textContent = content;
    row.append(cell);
    return cell;
  }

  function renderTeamMembers() {
    if (!elements.teamMembersBody) return;
    elements.teamMembersBody.replaceChildren();
    const sortedMembers = [...teamMembers].sort((left, right) => {
      if (left.role === "owner") return -1;
      if (right.role === "owner") return 1;
      return left.fullName.localeCompare(right.fullName, "pt-BR");
    });

    sortedMembers.forEach((member) => {
      const row = document.createElement("tr");
      const person = document.createElement("div");
      person.className = "team-person";
      const avatar = document.createElement("span");
      avatar.textContent = member.fullName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase();
      const identity = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = member.fullName;
      const detail = document.createElement("small");
      detail.textContent = member.role === "owner" ? "Responsável pela propriedade" : "Funcionário da propriedade";
      identity.append(name, detail);
      person.append(avatar, identity);
      appendTeamCell(row, person);

      if (member.role === "owner") {
        appendTeamCell(row, createTeamBadge(TEAM_ROLE_LABELS.owner, "owner"));
      } else {
        const roleSelect = document.createElement("select");
        roleSelect.className = "team-role-select";
        roleSelect.dataset.teamRole = member.userId;
        [["vaqueiro", "Vaqueiro"], ["caseiro", "Caseiro"]].forEach(([value, label]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          option.selected = member.role === value;
          roleSelect.append(option);
        });
        roleSelect.setAttribute("aria-label", `Cargo de ${member.fullName}`);
        appendTeamCell(row, roleSelect);
      }

      appendTeamCell(
        row,
        createTeamBadge(member.status === "active" ? "Ativo" : "Desativado", member.status === "active" ? "active" : "inactive"),
      );
      appendTeamCell(row, teamDateTime(member.createdAt));

      const actions = document.createElement("div");
      actions.className = "record-actions";
      if (member.role !== "owner") {
        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = member.status === "active" ? "team-action team-action-danger" : "team-action";
        toggleButton.dataset.teamStatus = member.userId;
        toggleButton.dataset.nextStatus = member.status === "active" ? "inactive" : "active";
        toggleButton.textContent = member.status === "active" ? "Desativar" : "Ativar";
        actions.append(toggleButton);
      } else {
        const ownerLabel = document.createElement("small");
        ownerLabel.className = "team-owner-note";
        ownerLabel.textContent = "Acesso principal";
        actions.append(ownerLabel);
      }
      appendTeamCell(row, actions);
      elements.teamMembersBody.append(row);
    });
    elements.teamMembersEmpty.hidden = sortedMembers.length > 0;
  }

  function inviteState(invite) {
    if (invite.usedAt) return { label: "Utilizado", kind: "used" };
    if (new Date(invite.expiresAt).getTime() <= Date.now()) return { label: "Expirado", kind: "expired" };
    return { label: "Disponível", kind: "active" };
  }

  function renderTeamInvites() {
    if (!elements.teamInvitesBody) return;
    elements.teamInvitesBody.replaceChildren();
    teamInvites.forEach((invite) => {
      const row = document.createElement("tr");
      const code = document.createElement("code");
      code.className = "team-invite-code";
      code.textContent = invite.code;
      appendTeamCell(row, code);
      appendTeamCell(row, TEAM_ROLE_LABELS[invite.role] || invite.role);
      appendTeamCell(row, invite.invitedEmail || "Qualquer e-mail");
      appendTeamCell(row, teamDateTime(invite.expiresAt));
      const status = inviteState(invite);
      appendTeamCell(row, createTeamBadge(status.label, status.kind));

      const actions = document.createElement("div");
      actions.className = "record-actions";
      if (status.kind === "active") {
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "team-action";
        copyButton.dataset.copyInvite = invite.code;
        copyButton.textContent = "Copiar";
        const revokeButton = document.createElement("button");
        revokeButton.type = "button";
        revokeButton.className = "team-action team-action-danger";
        revokeButton.dataset.revokeInvite = invite.id;
        revokeButton.textContent = "Cancelar";
        actions.append(copyButton, revokeButton);
      }
      appendTeamCell(row, actions);
      elements.teamInvitesBody.append(row);
    });
    elements.teamInvitesEmpty.hidden = teamInvites.length > 0;
    elements.teamInviteCount.textContent = `${teamInvites.length} convite${teamInvites.length === 1 ? "" : "s"}`;
  }

  async function loadTeamFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId || activeAccount.role !== "owner") return;
    setTeamStatus("loading", "Carregando equipe...");

    const [memberResult, inviteResult] = await Promise.all([
      client
        .from("farm_members")
        .select("user_id, role, status, created_at")
        .eq("farm_id", activeAccount.farmId)
        .order("created_at", { ascending: true }),
      client
        .from("farm_invites")
        .select("id, code, role, invited_email, expires_at, used_at, created_at")
        .eq("farm_id", activeAccount.farmId)
        .order("created_at", { ascending: false }),
    ]);
    if (memberResult.error || inviteResult.error) {
      console.error("Falha ao carregar a equipe.", memberResult.error || inviteResult.error);
      setTeamStatus("error", "Equipe indisponível");
      showToast("Não foi possível carregar a equipe do Supabase.");
      return;
    }

    const memberRows = memberResult.data || [];
    const userIds = memberRows.map((member) => member.user_id);
    let profiles = [];
    if (userIds.length) {
      const profileResult = await client
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      if (profileResult.error) {
        console.error("Falha ao carregar os perfis da equipe.", profileResult.error);
        setTeamStatus("error", "Perfis indisponíveis");
        showToast("Não foi possível carregar os nomes da equipe.");
        return;
      }
      profiles = profileResult.data || [];
    }
    const names = new Map(profiles.map((profile) => [profile.user_id, profile.full_name]));
    teamMembers = memberRows.map((member) => ({
      userId: member.user_id,
      role: member.role,
      status: member.status,
      createdAt: member.created_at,
      fullName: names.get(member.user_id) || "Usuário sem nome",
    }));
    teamInvites = (inviteResult.data || []).map((invite) => ({
      id: invite.id,
      code: invite.code,
      role: invite.role,
      invitedEmail: invite.invited_email,
      expiresAt: invite.expires_at,
      usedAt: invite.used_at,
      createdAt: invite.created_at,
    }));
    renderTeamMembers();
    renderTeamInvites();
    refreshTaskAssigneeOptions();
    const activeCount = teamMembers.filter((member) => member.status === "active").length;
    setTeamStatus("ready", `${activeCount} acesso${activeCount === 1 ? " ativo" : "s ativos"}`);
  }

  const CONTACT_STATUS_LABELS = {
    novo: "Nova",
    lido: "Lida",
    atendido: "Atendida",
  };

  function contactMessageFromDatabase(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function setMessageSyncStatus(stateName, message) {
    if (!elements.messageSyncStatus) return;
    elements.messageSyncStatus.dataset.state = stateName;
    elements.messageSyncStatus.textContent = message;
  }

  function createMessageStat(label, value, kind) {
    const card = document.createElement("article");
    card.className = `message-stat message-stat-${kind}`;
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = String(value);
    card.append(small, strong);
    return card;
  }

  function renderContactMessages() {
    if (!elements.messageTableBody) return;
    const newCount = contactMessages.filter((item) => item.status === "novo").length;
    const readCount = contactMessages.filter((item) => item.status === "lido").length;
    const resolvedCount = contactMessages.filter((item) => item.status === "atendido").length;
    elements.navMessageCount.textContent = String(newCount);
    elements.navMessageCount.hidden = newCount === 0;
    elements.messageSummary.replaceChildren(
      createMessageStat("Novas mensagens", newCount, "new"),
      createMessageStat("Em acompanhamento", readCount, "read"),
      createMessageStat("Atendidas", resolvedCount, "resolved"),
    );

    const filter = elements.messageStatusFilter.value;
    const messages = contactMessages.filter(
      (item) => filter === "todos" || item.status === filter,
    );
    elements.messageCount.textContent = `${messages.length} ${messages.length === 1 ? "mensagem" : "mensagens"}`;
    elements.messageTableBody.replaceChildren(
      ...messages.map((item) => {
        const row = document.createElement("tr");
        const date = document.createElement("td");
        date.textContent = teamDateTime(item.createdAt);

        const person = document.createElement("td");
        const name = document.createElement("strong");
        name.textContent = item.name;
        person.append(name);

        const contact = document.createElement("td");
        contact.className = "message-contact";
        const email = document.createElement("a");
        email.href = `mailto:${item.email}`;
        email.textContent = item.email;
        contact.append(email);
        if (item.phone) {
          const phone = document.createElement("a");
          phone.href = `tel:${item.phone.replace(/[^0-9+]/g, "")}`;
          phone.textContent = item.phone;
          contact.append(phone);
        }

        const message = document.createElement("td");
        message.className = "message-body";
        message.textContent = item.message;

        const status = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `message-status message-status-${item.status}`;
        badge.textContent = CONTACT_STATUS_LABELS[item.status] || item.status;
        status.append(badge);

        const actions = document.createElement("td");
        const select = document.createElement("select");
        select.className = "message-status-select";
        select.dataset.messageStatus = item.id;
        select.setAttribute("aria-label", `Situação da mensagem de ${item.name}`);
        Object.entries(CONTACT_STATUS_LABELS).forEach(([value, label]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          option.selected = value === item.status;
          select.append(option);
        });
        actions.append(select);
        row.append(date, person, contact, message, status, actions);
        return row;
      }),
    );
    const empty = messages.length === 0;
    elements.messageEmpty.hidden = !empty;
    elements.messageTableBody.closest("table").hidden = empty;
  }

  async function loadContactMessages() {
    if (!contactAdmin || !window.ruralSupabase) return;
    setMessageSyncStatus("loading", "Carregando mensagens...");
    elements.messageRefresh.disabled = true;
    let result;
    try {
      result = await window.ruralSupabase
        .from("contact_messages")
        .select("id, name, email, phone, message, status, created_at, updated_at")
        .order("created_at", { ascending: false });
    } catch (error) {
      console.error("Falha de conexão ao carregar as mensagens.", error);
      result = { data: null, error };
    }
    elements.messageRefresh.disabled = false;
    if (result.error) {
      console.error("Falha ao carregar as mensagens.", result.error);
      setMessageSyncStatus("error", "Mensagens indisponíveis");
      showToast("Não foi possível carregar as mensagens de contato.");
      return;
    }
    contactMessages = (result.data || []).map(contactMessageFromDatabase);
    setMessageSyncStatus("ready", "Sincronizado com o Supabase");
    renderContactMessages();
  }

  async function initializeContactMessages() {
    contactAdmin = false;
    document.querySelectorAll("[data-contact-admin-only]").forEach((element) => {
      element.hidden = true;
    });
    if (!window.ruralSupabase || !activeAccount?.userId) return;
    const { data, error } = await window.ruralSupabase.rpc(
      "current_user_is_contact_admin",
    );
    if (error) {
      console.error("Falha ao verificar o acesso às mensagens.", error);
      return;
    }
    contactAdmin = data === true;
    document.querySelectorAll("[data-contact-admin-only]").forEach((element) => {
      element.hidden = !contactAdmin;
    });
    if (!contactAdmin) return;
    await loadContactMessages();
    if (window.location.hash === "#mensagens") showView("mensagens", false);
  }

  async function updateContactMessageStatus(messageId, nextStatus) {
    if (!contactAdmin || !CONTACT_STATUS_LABELS[nextStatus]) return;
    const message = contactMessages.find((item) => item.id === messageId);
    if (!message || message.status === nextStatus) return;
    const previousStatus = message.status;
    message.status = nextStatus;
    renderContactMessages();
    let result;
    try {
      result = await window.ruralSupabase
        .from("contact_messages")
        .update({ status: nextStatus })
        .eq("id", messageId)
        .select("id, name, email, phone, message, status, created_at, updated_at")
        .single();
    } catch (error) {
      console.error("Falha de conexão ao atualizar a mensagem.", error);
      result = { data: null, error };
    }
    if (result.error || !result.data) {
      message.status = previousStatus;
      renderContactMessages();
      console.error("Falha ao atualizar a mensagem.", result.error);
      showToast("Não foi possível atualizar a situação da mensagem.");
      return;
    }
    const saved = contactMessageFromDatabase(result.data);
    const index = contactMessages.findIndex((item) => item.id === saved.id);
    if (index >= 0) contactMessages[index] = saved;
    renderContactMessages();
    showToast(`Mensagem marcada como ${CONTACT_STATUS_LABELS[nextStatus].toLowerCase()}.`);
  }

  async function copyInviteCode(code) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const input = document.createElement("textarea");
      input.value = code;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    showToast("Código de convite copiado.");
  }

  async function createTeamInvite(event) {
    event.preventDefault();
    if (activeAccount?.role !== "owner") return;
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    submitButton.disabled = true;
    submitButton.textContent = "Gerando convite...";
    const { data, error } = await window.ruralSupabase.rpc("create_farm_invite", {
      p_role: formData.get("role"),
      p_invited_email: String(formData.get("email") || "").trim() || null,
    });
    submitButton.disabled = false;
    submitButton.textContent = "Gerar código de convite";
    if (error || !data?.[0]) {
      console.error("Falha ao gerar o convite.", error);
      showToast(error?.message || "Não foi possível gerar o convite.");
      return;
    }
    const invite = data[0];
    latestInviteCode = invite.invite_code;
    elements.teamLatestCode.textContent = latestInviteCode;
    elements.teamLatestExpiry.textContent = `Válido até ${teamDateTime(invite.expires_at)}.`;
    elements.teamLatestInvite.hidden = false;
    form.reset();
    await loadTeamFromSupabase();
    showToast("Convite criado. Envie o código ao funcionário.");
  }

  async function updateTeamMember(userId, changes) {
    if (activeAccount?.role !== "owner" || !userId) return;
    setTeamStatus("loading", "Salvando alteração...");
    const { error } = await window.ruralSupabase
      .from("farm_members")
      .update(changes)
      .eq("farm_id", activeAccount.farmId)
      .eq("user_id", userId);
    if (error) {
      console.error("Falha ao atualizar o membro.", error);
      showToast("Não foi possível alterar o acesso.");
    } else {
      showToast("Acesso atualizado com sucesso.");
    }
    await loadTeamFromSupabase();
  }

  async function revokeTeamInvite(inviteId) {
    if (!window.confirm("Cancelar este convite? O código deixará de funcionar.")) return;
    const { error } = await window.ruralSupabase
      .from("farm_invites")
      .delete()
      .eq("farm_id", activeAccount.farmId)
      .eq("id", inviteId);
    if (error) {
      console.error("Falha ao cancelar o convite.", error);
      showToast("Não foi possível cancelar o convite.");
      return;
    }
    showToast("Convite cancelado.");
    await loadTeamFromSupabase();
  }

  function transactionFromDatabase(row) {
    return {
      id: row.id,
      type: row.transaction_type,
      date: row.occurred_on,
      description: row.description,
      category: row.category,
      amount: Number(row.amount),
    };
  }

  function transactionToDatabase(transaction) {
    return {
      transaction_type: transaction.type,
      occurred_on: transaction.date,
      description: transaction.description,
      category: transaction.category,
      amount: transaction.amount,
      updated_at: new Date().toISOString(),
    };
  }

  async function loadFinanceFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId) {
      setFinanceStatus("error", "Falha na conexão");
      showToast("Não foi possível conectar o Financeiro ao Supabase.");
      return;
    }

    setFinanceStatus("loading", "Sincronizando...");
    state.transactions = [];
    renderAll();
    const { data, error } = await client
      .from("transactions")
      .select("id, transaction_type, occurred_on, description, category, amount")
      .eq("farm_id", activeAccount.farmId)
      .order("occurred_on", { ascending: false });

    if (error) {
      console.error("Falha ao carregar os lançamentos financeiros.", error);
      setFinanceStatus("error", "Sincronização indisponível");
      showToast("Não foi possível carregar os lançamentos do Supabase.");
      return;
    }

    state.transactions = (data || []).map(transactionFromDatabase);
    setFinanceStatus("supabase", "Salvo no Supabase");
    updateStorageSummary();
    renderAll();
  }

  async function connectAccount(account) {
    if (!account?.farmId) return;
    activeAccount = account;
    const isOwner = account.role === "owner";
    document.querySelectorAll("[data-owner-only]").forEach((element) => {
      element.hidden = !isOwner;
    });
    document.querySelectorAll("[data-finance-owner-only]").forEach((element) => {
      element.hidden = !isOwner;
    });
    document.querySelectorAll("[data-task-owner-only]").forEach((element) => {
      element.hidden = !isOwner;
    });
    document.querySelectorAll("[data-contact-admin-only]").forEach((element) => {
      element.hidden = true;
    });
    if (!isOwner && elements.taskDialog?.open) {
      elements.taskDialog.close();
      if (editingRecord?.type === "task") editingRecord = null;
    }
    refreshTaskAssigneeOptions();
    [elements.metricBalance, elements.metricIncome, elements.metricExpense].forEach((metric) => {
      const card = metric?.closest(".app-metric-card");
      if (card) card.hidden = !isOwner;
    });
    const financeOverview = document.querySelector(".finance-overview");
    if (financeOverview) financeOverview.hidden = !isOwner;

    if (!isOwner) {
      state.transactions = [];
      setFinanceStatus("restricted", "Acesso exclusivo do dono");
      renderAll();
      contactAdmin = false;
      contactMessages = [];
      if (["#financeiro", "#equipe", "#mensagens"].includes(window.location.hash)) {
        showView("dashboard");
      }
      await Promise.all([
        loadTasksFromSupabase(),
        loadCropsFromSupabase(),
        loadAnimalsFromSupabase(),
        loadStockFromSupabase(),
        loadMachinesFromSupabase(),
        initializeNotifications(),
      ]);
      return;
    }

    await Promise.all([
      loadFinanceFromSupabase(),
      loadTeamFromSupabase(),
      loadTasksFromSupabase(),
      loadCropsFromSupabase(),
      loadAnimalsFromSupabase(),
      loadStockFromSupabase(),
      loadMachinesFromSupabase(),
      initializeContactMessages(),
      initializeNotifications(),
    ]);
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
    const requestedView = VIEWS.includes(name) ? name : "dashboard";
    const ownerRestricted =
      activeAccount &&
      activeAccount.role !== "owner" &&
      ["financeiro", "equipe"].includes(requestedView);
    const contactRestricted = requestedView === "mensagens" && !contactAdmin;
    const view = ownerRestricted || contactRestricted ? "dashboard" : requestedView;
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

  function weatherCodeInfo(code, isDay = true) {
    const value = Number(code);
    if (value === 0) return { icon: isDay ? "☀" : "☾", label: "Céu limpo" };
    if (value === 1) return { icon: "🌤", label: "Predomínio de sol" };
    if (value === 2) return { icon: "⛅", label: "Parcialmente nublado" };
    if (value === 3) return { icon: "☁", label: "Nublado" };
    if ([45, 48].includes(value)) return { icon: "🌫", label: "Névoa" };
    if ([51, 53, 55, 56, 57].includes(value)) return { icon: "🌦", label: "Garoa" };
    if ([61, 63, 65, 66, 67].includes(value)) return { icon: "🌧", label: "Chuva" };
    if ([71, 73, 75, 77, 85, 86].includes(value)) return { icon: "❄", label: "Neve" };
    if ([80, 81, 82].includes(value)) return { icon: "🌦", label: "Pancadas de chuva" };
    if ([95, 96, 99].includes(value)) return { icon: "⛈", label: "Tempestade" };
    return { icon: "◌", label: "Condição variável" };
  }

  function weatherLocationName() {
    const location = state.weatherLocation;
    return [location.name, location.admin1].filter(Boolean).join(", ");
  }

  function weatherAlertsFromData(data) {
    if (!data?.daily) return [];
    const daily = data.daily;
    const alerts = [];
    const dates = daily.time || [];
    const frostIndex = (daily.temperature_2m_min || []).findIndex((value) => Number(value) <= 3);
    const stormIndex = (daily.weather_code || []).findIndex((value) => Number(value) >= 95);
    const heavyRainIndex = (daily.precipitation_sum || []).findIndex(
      (value, index) =>
        Number(value) >= 30 ||
        (Number(value) >= 15 && Number(daily.precipitation_probability_max?.[index] || 0) >= 85),
    );
    const windIndex = (daily.wind_speed_10m_max || []).findIndex((value) => Number(value) >= 50);
    const weekRain = (daily.precipitation_sum || []).reduce((total, value) => total + Number(value || 0), 0);
    const weekMax = Math.max(...(daily.temperature_2m_max || [0]).map(Number));
    const currentHumidity = Number(data.current?.relative_humidity_2m || 100);

    if (stormIndex >= 0) {
      alerts.push({
        level: "danger",
        icon: "⛈",
        title: "Risco de tempestade",
        detail: "Tempestade prevista para " + formatDate(dates[stormIndex]) + ". Proteja animais e equipamentos.",
      });
    }
    if (heavyRainIndex >= 0) {
      alerts.push({
        level: "danger",
        icon: "☂",
        title: "Possibilidade de chuva forte",
        detail:
          formatDate(dates[heavyRainIndex]) +
          " pode acumular " +
          Number(daily.precipitation_sum[heavyRainIndex]).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
          " mm.",
      });
    }
    if (frostIndex >= 0) {
      alerts.push({
        level: "warning",
        icon: "❄",
        title: "Risco de geada",
        detail:
          "Mínima de " +
          Number(daily.temperature_2m_min[frostIndex]).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
          " °C prevista para " +
          formatDate(dates[frostIndex]) +
          ".",
      });
    }
    if (windIndex >= 0) {
      alerts.push({
        level: "warning",
        icon: "↝",
        title: "Vento forte previsto",
        detail:
          "Ventos de até " +
          Number(daily.wind_speed_10m_max[windIndex]).toLocaleString("pt-BR") +
          " km/h em " +
          formatDate(dates[windIndex]) +
          ".",
      });
    }
    if ((weekRain <= 2 && weekMax >= 30) || currentHumidity <= 35) {
      alerts.push({
        level: "warning",
        icon: "☀",
        title: "Risco de tempo seco",
        detail: "Pouca chuva e baixa umidade podem exigir atenção com irrigação e animais.",
      });
    }
    return alerts;
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
        const canToggle = canCurrentUserToggleTask(task);
        toggle.disabled = !canToggle;
        toggle.setAttribute(
          "aria-label",
          canToggle ? `Concluir ${task.title}` : `${task.title}: somente o responsável pode concluir`,
        );
        if (!canToggle) toggle.title = "Somente o responsável ou o dono pode concluir";
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

    const climateAlert = weatherAlertsFromData(weatherData)[0];
    if (climateAlert) {
      alerts.push({
        color: climateAlert.level === "danger" ? "red" : "orange",
        title: climateAlert.title,
        detail: climateAlert.detail,
        view: "clima",
      });
    } else if (weatherData?.current) {
      const condition = weatherCodeInfo(weatherData.current.weather_code, weatherData.current.is_day === 1);
      alerts.push({
        color: "blue",
        title: condition.label,
        detail:
          weatherLocationName() +
          " · " +
          Number(weatherData.current.temperature_2m).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
          " °C",
        view: "clima",
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

    if (alerts.length < 4 && !weatherData) {
      alerts.push({
        color: "blue",
        title: "Previsão do tempo",
        detail: "Atualizando dados meteorológicos da propriedade",
        view: "clima",
      });
    }

    const visibleAlerts = alerts.slice(0, 4);
    elements.dashboardAlertCount.textContent = String(visibleAlerts.length);

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

  function createEditButton(type, id, label) {
    const button = document.createElement("button");
    button.className = "row-edit";
    button.type = "button";
    button.dataset.editType = type;
    button.dataset.editId = id;
    button.setAttribute("aria-label", `Editar ${label}`);
    button.textContent = "Editar";
    return button;
  }

  function createRecordActions(type, id, label) {
    const actions = document.createElement("div");
    actions.className = "record-actions";
    actions.append(
      createEditButton(type, id, label),
      createDeleteButton(type, id, label),
    );
    return actions;
  }

  function createSharedRecordActions(type, id, label) {
    const actions = document.createElement("div");
    actions.className = "record-actions";
    const canEdit = type === "crop" ? canManageCrops() : canManageAnimals();
    if (canEdit) actions.append(createEditButton(type, id, label));
    if (activeAccount?.role === "owner") actions.append(createDeleteButton(type, id, label));
    return actions;
  }

  function createAnimalActions(animal) {
    const actions = document.createElement("div");
    actions.className = "record-actions animal-record-actions";
    const history = document.createElement("button");
    history.className = "animal-health-button";
    history.type = "button";
    history.dataset.animalHealth = animal.id;
    history.setAttribute("aria-label", `Abrir histórico de saúde de ${animal.name}`);
    history.textContent = "Prontuário";
    actions.append(history);
    if (canManageAnimals()) actions.append(createEditButton("animal", animal.id, animal.name));
    if (activeAccount?.role === "owner") {
      actions.append(createDeleteButton("animal", animal.id, animal.name));
    }
    return actions;
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
        actions.append(createRecordActions("transaction", item.id, item.description));
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
        item.dataset.taskId = task.id;
        const toggle = document.createElement("button");
        toggle.className = "agenda-toggle";
        toggle.type = "button";
        toggle.dataset.toggleTask = task.id;
        toggle.setAttribute(
          "aria-label",
          task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`,
        );
        toggle.textContent = task.completed ? "✓" : "";
        const canToggle = canCurrentUserToggleTask(task);
        toggle.disabled = !canToggle;
        if (!canToggle) {
          toggle.title = "Somente o responsável ou o dono pode alterar esta tarefa";
          toggle.setAttribute("aria-label", `${task.title}: somente o responsável pode alterar`);
        }
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
        const actions = document.createElement("div");
        actions.className = "record-actions";
        if (activeAccount?.role === "owner") {
          actions.append(...createRecordActions("task", task.id, task.title).childNodes);
        }
        item.append(toggle, copy, priority, date, actions);
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
          footer.append(progress, createSharedRecordActions("crop", crop.id, crop.name));
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
        actions.append(createAnimalActions(animal));
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
        actionsWrap.className = "stock-actions record-actions";
        const movement = document.createElement("button");
        movement.className = "stock-move-button";
        movement.type = "button";
        movement.dataset.stockMove = item.id;
        movement.textContent = "Movimentar";
        movement.setAttribute("aria-label", "Registrar entrada ou saída de " + item.name);
        movement.disabled = stockStorageMode !== "supabase";
        actionsWrap.append(movement);
        if (canManageStock()) actionsWrap.append(createEditButton("stock", item.id, item.name));
        if (activeAccount?.role === "owner") {
          actionsWrap.append(createDeleteButton("stock", item.id, item.name));
        }
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
        actionsWrap.className = "machine-actions record-actions";
        const update = document.createElement("button");
        update.className = "stock-move-button";
        update.type = "button";
        update.dataset.machineActivity = machine.id;
        update.textContent = "Atualizar";
        update.setAttribute("aria-label", "Registrar uso ou manutenção de " + machine.name);
        update.disabled = machineStorageMode !== "supabase";
        actionsWrap.append(update);
        if (canManageMachines()) {
          actionsWrap.append(createEditButton("machine", machine.id, machine.name));
        }
        if (activeAccount?.role === "owner") {
          actionsWrap.append(createDeleteButton("machine", machine.id, machine.name));
        }
        actions.append(actionsWrap);

        row.append(identity, typeCell, usage, maintenance, cost, statusCell, actions);
        return row;
      }),
    );

    const empty = filtered.length === 0;
    elements.machineEmpty.hidden = !empty;
    elements.machineTableBody.closest("table").hidden = empty;
  }

  function createReportOperationStat(label, value, detail, tone = "") {
    const card = document.createElement("article");
    card.className = "report-operation-card" + (tone ? " report-operation-" + tone : "");
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = String(value);
    const copy = document.createElement("p");
    copy.textContent = detail;
    card.append(small, strong, copy);
    return card;
  }

  function appendReportCell(row, primary, secondary = "") {
    const cell = document.createElement("td");
    const strong = document.createElement("strong");
    strong.textContent = primary;
    cell.append(strong);
    if (secondary) {
      const small = document.createElement("small");
      small.textContent = secondary;
      cell.append(small);
    }
    row.append(cell);
  }

  function toggleReportTable(body, empty, hasRows) {
    empty.hidden = hasRows;
    body.closest("table").hidden = !hasRows;
  }

  function renderReports() {
    const period = elements.reportMonth.value;
    const transactions = state.transactions.filter(
      (item) => !period || monthKey(item.date) === period,
    );
    const crops = state.crops.filter(
      (crop) =>
        !period || monthKey(crop.plantingDate) === period || monthKey(crop.harvestDate) === period,
    );
    const totals = financialTotals(transactions);
    const productionCost = crops.reduce((total, crop) => total + Number(crop.cost || 0), 0);
    const vaccinesDue = state.animals.filter((animal) => daysUntil(animal.nextVaccine) <= 30).length;
    const stockAttention = state.inventory.filter((item) => stockCondition(item) !== "ok").length;
    const machineAttention = state.machines.filter((machine) => machineCondition(machine) !== "ok").length;

    elements.reportGeneratedAt.textContent = "Gerado em " + reportDateTime.format(new Date());
    elements.reportPeriodLabel.textContent = period
      ? "Período: " + reportMonthLabel.format(new Date(`${period}-01T12:00:00`))
      : "Período: todos os registros";
    elements.reportBalance.textContent = currency.format(totals.result);
    elements.reportBalance.classList.toggle("negative", totals.result < 0);
    elements.reportBalance.classList.toggle("positive", totals.result >= 0);
    elements.reportIncome.textContent = currency.format(totals.income);
    elements.reportExpense.textContent = currency.format(totals.expense);
    elements.reportProductionCost.textContent = currency.format(productionCost);

    const expenseByCategory = new Map();
    transactions
      .filter((item) => item.type === "despesa")
      .forEach((item) => {
        expenseByCategory.set(
          item.category,
          (expenseByCategory.get(item.category) || 0) + Number(item.amount || 0),
        );
      });
    const categories = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1]);
    const maxCategory = Math.max(1, ...categories.map(([, amount]) => amount));
    elements.reportCategoryChart.replaceChildren(
      ...categories.map(([category, amount]) => {
        const row = document.createElement("div");
        row.className = "report-category-row";
        const heading = document.createElement("div");
        const label = document.createElement("strong");
        label.textContent = category;
        const value = document.createElement("span");
        value.textContent = currency.format(amount);
        heading.append(label, value);
        const meter = document.createElement("div");
        meter.className = "report-category-meter";
        const fill = document.createElement("span");
        fill.style.width = `${Math.max(3, (amount / maxCategory) * 100)}%`;
        fill.title = category + ": " + currency.format(amount);
        meter.append(fill);
        row.append(heading, meter);
        return row;
      }),
    );
    elements.reportCategoryEmpty.hidden = categories.length > 0;

    elements.reportCropTableBody.replaceChildren(
      ...crops
        .slice()
        .sort((a, b) => a.harvestDate.localeCompare(b.harvestDate))
        .map((crop) => {
          const row = document.createElement("tr");
          appendReportCell(row, crop.name, Number(crop.area).toLocaleString("pt-BR") + " ha");
          appendReportCell(row, crop.status);
          appendReportCell(row, formatDate(crop.harvestDate));
          appendReportCell(row, Number(crop.harvested || 0).toLocaleString("pt-BR"));
          appendReportCell(row, currency.format(Number(crop.cost || 0)));
          return row;
        }),
    );
    toggleReportTable(elements.reportCropTableBody, elements.reportCropEmpty, crops.length > 0);

    elements.reportOperations.replaceChildren(
      createReportOperationStat("Animais cadastrados", state.animals.length, vaccinesDue + " com vacinação próxima", vaccinesDue ? "warning" : "success"),
      createReportOperationStat("Itens em estoque", state.inventory.length, stockAttention + " precisam de reposição", stockAttention ? "warning" : "success"),
      createReportOperationStat("Máquinas e equipamentos", state.machines.length, machineAttention + " exigem manutenção", machineAttention ? "warning" : "success"),
      createReportOperationStat("Culturas no período", crops.length, crops.filter((crop) => crop.status === "Colhida").length + " colhidas", "neutral"),
    );

    elements.reportAnimalTableBody.replaceChildren(
      ...state.animals.map((animal) => {
        const row = document.createElement("tr");
        appendReportCell(row, animal.name, animal.species + " · " + animal.breed);
        appendReportCell(row, Number(animal.weight || 0).toLocaleString("pt-BR") + " kg");
        const remainingDays = daysUntil(animal.nextVaccine);
        appendReportCell(
          row,
          formatDate(animal.nextVaccine),
          remainingDays < 0
            ? "Atrasada há " + Math.abs(remainingDays) + " dias"
            : remainingDays <= 30
              ? "Próxima vacinação"
              : "Em dia",
        );
        return row;
      }),
    );
    toggleReportTable(
      elements.reportAnimalTableBody,
      elements.reportAnimalEmpty,
      state.animals.length > 0,
    );

    elements.reportStockTableBody.replaceChildren(
      ...state.inventory
        .slice()
        .sort((a, b) => {
          const order = { out: 0, low: 1, ok: 2 };
          return order[stockCondition(a)] - order[stockCondition(b)];
        })
        .map((item) => {
          const row = document.createElement("tr");
          appendReportCell(row, item.name, item.category);
          appendReportCell(row, formatStockAmount(item));
          appendReportCell(row, Number(item.minimum || 0).toLocaleString("pt-BR") + " " + item.unit);
          const statusCell = document.createElement("td");
          const condition = stockCondition(item);
          const badge = document.createElement("span");
          badge.className = "stock-status stock-status-" + condition;
          badge.textContent = { ok: "Normal", low: "Estoque baixo", out: "Sem estoque" }[condition];
          statusCell.append(badge);
          row.append(statusCell);
          return row;
        }),
    );
    toggleReportTable(
      elements.reportStockTableBody,
      elements.reportStockEmpty,
      state.inventory.length > 0,
    );

    elements.reportMachineTableBody.replaceChildren(
      ...state.machines
        .slice()
        .sort((a, b) => a.nextMaintenance.localeCompare(b.nextMaintenance))
        .map((machine) => {
          const row = document.createElement("tr");
          appendReportCell(row, machine.name, machine.type + " · " + machine.brand + " " + machine.model);
          appendReportCell(
            row,
            Number(machine.hours || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " h",
            Number(machine.fuelConsumption || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " L",
          );
          appendReportCell(row, formatDate(machine.nextMaintenance), machineStatusLabel(machine));
          appendReportCell(row, currency.format(Number(machine.repairCost || 0)));
          return row;
        }),
    );
    toggleReportTable(
      elements.reportMachineTableBody,
      elements.reportMachineEmpty,
      state.machines.length > 0,
    );
  }

  function createWeatherMetric(icon, label, value, detail) {
    const card = document.createElement("article");
    card.className = "weather-current-card";
    const symbol = document.createElement("span");
    symbol.textContent = icon;
    symbol.setAttribute("aria-hidden", "true");
    const copy = document.createElement("div");
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    const paragraph = document.createElement("p");
    paragraph.textContent = detail;
    copy.append(small, strong, paragraph);
    card.append(symbol, copy);
    return card;
  }

  function renderWeather() {
    if (!weatherData?.current || !weatherData?.daily) return;
    const current = weatherData.current;
    const daily = weatherData.daily;
    const condition = weatherCodeInfo(current.weather_code, current.is_day === 1);
    const currentHour = String(current.time || "").slice(0, 13);
    const hourlyIndex = (weatherData.hourly?.time || []).findIndex((time) =>
      String(time).startsWith(currentHour),
    );
    const rainChance = Number(
      weatherData.hourly?.precipitation_probability?.[Math.max(0, hourlyIndex)] || 0,
    );
    const alerts = weatherAlertsFromData(weatherData);

    elements.weatherSymbol.textContent = condition.icon;
    elements.metricWeatherTemperature.textContent =
      Number(current.temperature_2m).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " °C";
    elements.metricWeatherSummary.textContent =
      condition.label + " · Chuva " + rainChance + "% · Umidade " + current.relative_humidity_2m + "%";
    elements.navClimateCount.textContent = String(alerts.length);
    elements.weatherLocationLabel.textContent = weatherLocationName();
    elements.weatherUpdatedAt.textContent =
      "Atualizado em " + formatDate(String(current.time).slice(0, 10)) + " às " + String(current.time).slice(11, 16);
    elements.weatherStatus.hidden = true;

    elements.weatherCurrent.replaceChildren(
      createWeatherMetric(
        condition.icon,
        "Condição agora",
        Number(current.temperature_2m).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " °C",
        condition.label,
      ),
      createWeatherMetric(
        "◒",
        "Sensação térmica",
        Number(current.apparent_temperature).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " °C",
        "Temperatura percebida",
      ),
      createWeatherMetric(
        "◉",
        "Umidade",
        Number(current.relative_humidity_2m).toLocaleString("pt-BR") + "%",
        current.relative_humidity_2m <= 35 ? "Umidade baixa" : "Umidade relativa do ar",
      ),
      createWeatherMetric(
        "☂",
        "Possibilidade de chuva",
        rainChance + "%",
        Number(current.precipitation || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mm agora",
      ),
      createWeatherMetric(
        "↝",
        "Vento",
        Number(current.wind_speed_10m).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " km/h",
        "Velocidade a 10 metros",
      ),
    );

    elements.weatherForecast.replaceChildren(
      ...(daily.time || []).map((date, index) => {
        const info = weatherCodeInfo(daily.weather_code[index]);
        const card = document.createElement("article");
        card.className = "weather-forecast-card";
        const day = document.createElement("strong");
        day.textContent = forecastDayLabel.format(dateFromISO(date)).replace(".", "");
        const icon = document.createElement("span");
        icon.textContent = info.icon;
        icon.setAttribute("aria-hidden", "true");
        const description = document.createElement("small");
        description.textContent = info.label;
        const temperatures = document.createElement("p");
        const maximum = document.createElement("strong");
        maximum.textContent =
          Number(daily.temperature_2m_max[index]).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) +
          "°";
        temperatures.append(
          maximum,
          document.createTextNode(
            " / " +
              Number(daily.temperature_2m_min[index]).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) +
              "°",
          ),
        );
        const rain = document.createElement("em");
        rain.textContent = "☂ " + Number(daily.precipitation_probability_max[index] || 0) + "%";
        card.append(day, icon, description, temperatures, rain);
        return card;
      }),
    );

    if (alerts.length) {
      elements.weatherAlerts.replaceChildren(
        ...alerts.map((alert) => {
          const item = document.createElement("article");
          item.className = "weather-alert weather-alert-" + alert.level;
          const icon = document.createElement("span");
          icon.textContent = alert.icon;
          icon.setAttribute("aria-hidden", "true");
          const copy = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = alert.title;
          const detail = document.createElement("p");
          detail.textContent = alert.detail;
          copy.append(title, detail);
          item.append(icon, copy);
          return item;
        }),
      );
    } else {
      const safe = document.createElement("article");
      safe.className = "weather-alert weather-alert-safe";
      const icon = document.createElement("span");
      icon.textContent = "✓";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = "Nenhum alerta importante";
      const detail = document.createElement("p");
      detail.textContent = "A previsão dos próximos sete dias não atingiu os limites de atenção do sistema.";
      copy.append(title, detail);
      safe.append(icon, copy);
      elements.weatherAlerts.replaceChildren(safe);
    }

    renderDashboardAlerts();
  }

  function showWeatherStatus(message, type = "loading") {
    elements.weatherStatus.hidden = false;
    elements.weatherStatus.className = "weather-status weather-status-" + type;
    elements.weatherStatus.textContent = message;
  }

  async function loadWeather() {
    weatherFetchController?.abort();
    weatherFetchController = new AbortController();
    showWeatherStatus("Atualizando a previsão do tempo...");
    elements.weatherRefresh.disabled = true;
    const location = state.weatherLocation;
    const parameters = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
      hourly: "precipitation_probability",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
      timezone: "auto",
      forecast_days: "7",
      wind_speed_unit: "kmh",
    });

    try {
      const response = await fetch("https://api.open-meteo.com/v1/forecast?" + parameters, {
        signal: weatherFetchController.signal,
      });
      if (!response.ok) throw new Error("weather-request");
      weatherData = await response.json();
      renderWeather();
    } catch (error) {
      if (error.name === "AbortError") return;
      showWeatherStatus(
        "Não foi possível atualizar o clima agora. Verifique sua internet e tente novamente.",
        "error",
      );
      elements.metricWeatherSummary.textContent = "Previsão temporariamente indisponível";
      elements.navClimateCount.textContent = "0";
    } finally {
      elements.weatherRefresh.disabled = false;
    }
  }

  async function handleWeatherSearch(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const query = elements.weatherSearchInput.value.trim();
    const [cityName, stateHint = ""] = query.split(",").map((part) => part.trim());
    showWeatherStatus("Buscando " + query + "...");
    const parameters = new URLSearchParams({
      name: cityName,
      count: "10",
      language: "pt",
      format: "json",
    });

    try {
      const response = await fetch("https://geocoding-api.open-meteo.com/v1/search?" + parameters);
      if (!response.ok) throw new Error("geocoding-request");
      const data = await response.json();
      const brazilResults = (data.results || []).filter((item) => item.country_code === "BR");
      const result =
        brazilResults.find((item) => stateHint && normalize(item.admin1).includes(normalize(stateHint))) ||
        brazilResults[0] ||
        data.results?.[0];
      if (!result) {
        showWeatherStatus("Cidade não encontrada. Tente informar o nome e o estado.", "error");
        return;
      }
      state.weatherLocation = {
        name: result.name,
        admin1: result.admin1 || "",
        country: result.country || "",
        latitude: result.latitude,
        longitude: result.longitude,
      };
      saveState();
      elements.weatherSearchInput.value = weatherLocationName();
      await loadWeather();
      showToast("Localização do clima atualizada.");
    } catch {
      showWeatherStatus(
        "Não foi possível buscar a cidade agora. Verifique sua internet e tente novamente.",
        "error",
      );
    }
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
    renderReports();
  }

  function setDialogMode(type, editing) {
    const config = editorConfig[type];
    if (!config) return;
    const title = config.dialog.querySelector(".dialog-header h2");
    const submit = config.form.querySelector('button[type="submit"]');
    if (title) title.textContent = editing ? config.editTitle : config.newTitle;
    if (submit) submit.textContent = editing ? config.editSubmit : config.newSubmit;
  }

  function resetFormValidation(form) {
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.setCustomValidity("");
    });
  }

  function openDialog(type) {
    const config = editorConfig[type];
    if (!config) return;
    if (type === "transaction" && financeStorageMode !== "supabase") {
      showToast("Aguarde o Financeiro terminar de sincronizar.");
      return;
    }
    if (type === "task" && (taskStorageMode !== "supabase" || activeAccount?.role !== "owner")) {
      showToast("Somente o dono pode criar tarefas na Agenda compartilhada.");
      return;
    }
    if (type === "crop" && (cropStorageMode !== "supabase" || !canManageCrops())) {
      showToast("Somente o dono ou o caseiro pode cadastrar plantações.");
      return;
    }
    if (type === "animal" && (animalStorageMode !== "supabase" || !canManageAnimals())) {
      showToast("Somente o dono ou o vaqueiro pode cadastrar animais.");
      return;
    }
    if (type === "stock" && (stockStorageMode !== "supabase" || !canManageStock())) {
      showToast("Somente o dono ou o caseiro pode cadastrar itens do estoque.");
      return;
    }
    if (type === "machine" && (machineStorageMode !== "supabase" || !canManageMachines())) {
      showToast("Somente o dono ou o caseiro pode cadastrar máquinas.");
      return;
    }
    const { dialog, form } = config;
    editingRecord = null;
    form.reset();
    resetFormValidation(form);
    setDialogMode(type, false);
    const dateInput = form.querySelector('input[name="date"]');
    if (dateInput) dateInput.value = isoDate(new Date());
    if (type === "task") refreshTaskAssigneeOptions();
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

  function openEditDialog(type, id) {
    const config = editorConfig[type];
    if (!config) return;
    if (type === "transaction" && financeStorageMode !== "supabase") {
      showToast("Aguarde o Financeiro terminar de sincronizar.");
      return;
    }
    if (type === "task" && (taskStorageMode !== "supabase" || activeAccount?.role !== "owner")) {
      showToast("Somente o dono pode editar tarefas.");
      return;
    }
    if (type === "crop" && (cropStorageMode !== "supabase" || !canManageCrops())) {
      showToast("Somente o dono ou o caseiro pode editar plantações.");
      return;
    }
    if (type === "animal" && (animalStorageMode !== "supabase" || !canManageAnimals())) {
      showToast("Somente o dono ou o vaqueiro pode editar animais.");
      return;
    }
    if (type === "stock" && (stockStorageMode !== "supabase" || !canManageStock())) {
      showToast("Somente o dono ou o caseiro pode editar o estoque.");
      return;
    }
    if (type === "machine" && (machineStorageMode !== "supabase" || !canManageMachines())) {
      showToast("Somente o dono ou o caseiro pode editar máquinas.");
      return;
    }
    const record = state[config.collection].find((item) => item.id === id);
    if (!record) {
      showToast("Não foi possível encontrar este registro.");
      return;
    }

    config.form.reset();
    resetFormValidation(config.form);
    if (type === "task") refreshTaskAssigneeOptions(record.assignedTo || "");
    Object.entries(record).forEach(([name, value]) => {
      const field = config.form.elements.namedItem(name);
      if (field && "value" in field) field.value = value ?? "";
    });
    editingRecord = { type, id };
    setDialogMode(type, true);
    config.dialog.showModal();
    window.setTimeout(
      () => config.form.querySelector("input, select, textarea")?.focus(),
      0,
    );
  }

  function saveRecord(type, values) {
    const config = editorConfig[type];
    if (!config) return null;
    if (editingRecord?.type === type) {
      const index = state[config.collection].findIndex(
        (item) => item.id === editingRecord.id,
      );
      if (index < 0) {
        showToast("O registro não existe mais. Atualize a página e tente novamente.");
        return null;
      }
      state[config.collection][index] = {
        ...state[config.collection][index],
        ...values,
      };
      return "updated";
    }
    state[config.collection].push({ id: createId(config.prefix), ...values });
    return "created";
  }

  function closeDialogs() {
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    editingRecord = null;
    Object.keys(editorConfig).forEach((type) => setDialogMode(type, false));
  }

  async function saveTransactionToSupabase(values) {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId || financeStorageMode !== "supabase") {
      showToast("O Financeiro não está conectado. Tente novamente em instantes.");
      return null;
    }

    const columns = "id, transaction_type, occurred_on, description, category, amount";
    const databaseValues = transactionToDatabase(values);
    const isEditing = editingRecord?.type === "transaction";
    let result;
    try {
      result = isEditing
        ? await client
            .from("transactions")
            .update(databaseValues)
            .eq("id", editingRecord.id)
            .eq("farm_id", activeAccount.farmId)
            .select(columns)
            .single()
        : await client
            .from("transactions")
            .insert({ ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar o lançamento financeiro.", error);
      showToast("Não foi possível acessar o Supabase. Nenhuma alteração foi aplicada.");
      return null;
    }

    if (result.error || !result.data) {
      console.error("Falha ao salvar o lançamento financeiro.", result.error);
      showToast("Não foi possível salvar no Supabase. Nenhuma alteração foi aplicada.");
      return null;
    }

    const saved = transactionFromDatabase(result.data);
    if (isEditing) {
      const index = state.transactions.findIndex((item) => item.id === saved.id);
      if (index >= 0) state.transactions[index] = saved;
      else state.transactions.push(saved);
      return "updated";
    }
    state.transactions.push(saved);
    return "created";
  }

  async function handleTransactionSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    const result = await saveTransactionToSupabase({
      type: data.get("type"),
      date: data.get("date"),
      description: String(data.get("description")).trim(),
      category: data.get("category"),
      amount: Number(data.get("amount")),
    });
    submit.disabled = false;
    if (!result) return;
    renderAll();
    closeDialogs();
    showView("financeiro");
    showToast(
      result === "updated"
        ? "Lançamento atualizado e indicadores recalculados."
        : "Lançamento salvo e indicadores atualizados.",
    );
  }

  async function saveTaskToSupabase(values) {
    const client = window.ruralSupabase;
    if (
      !client ||
      !activeAccount?.farmId ||
      activeAccount.role !== "owner" ||
      taskStorageMode !== "supabase"
    ) {
      showToast("A Agenda não está conectada ou sua conta não pode alterar tarefas.");
      return null;
    }

    let currentUser;
    let membership;
    try {
      const userResult = await client.auth.getUser();
      currentUser = userResult.data?.user;
      if (userResult.error || !currentUser) {
        showToast("Sua sessão expirou. Entre novamente para salvar a tarefa.");
        return null;
      }
      if (currentUser.id !== activeAccount.userId) {
        showToast("A conta conectada mudou. Atualizando o painel com as permissões corretas.");
        window.setTimeout(() => window.location.reload(), 900);
        return null;
      }

      const membershipResult = await client
        .from("farm_members")
        .select("role, status")
        .eq("farm_id", activeAccount.farmId)
        .eq("user_id", currentUser.id)
        .maybeSingle();
      membership = membershipResult.data;
      if (membershipResult.error) {
        console.error("Falha ao conferir a permissão para salvar a tarefa.", membershipResult.error);
        showToast("Não foi possível conferir sua permissão. Tente novamente.");
        return null;
      }
    } catch (error) {
      console.error("Falha de conexão ao conferir a sessão.", error);
      showToast("Não foi possível conferir sua sessão. Tente novamente.");
      return null;
    }

    if (!membership || membership.status !== "active" || membership.role !== "owner") {
      showToast("Somente o dono da fazenda pode criar ou editar tarefas.");
      window.setTimeout(() => window.location.reload(), 900);
      return null;
    }

    const columns = "id, title, due_date, category, priority, responsible_name, assigned_to, completed, completed_at";
    const isEditing = editingRecord?.type === "task";
    let result;
    try {
      result = isEditing
        ? await client
            .from("tasks")
            .update({ ...taskToDatabase(values), updated_at: new Date().toISOString() })
            .eq("id", editingRecord.id)
            .eq("farm_id", activeAccount.farmId)
            .select(columns)
            .single()
        : await client
            .from("tasks")
            .insert({
              ...taskToDatabase(values),
              farm_id: activeAccount.farmId,
              completed: false,
              completed_at: null,
            })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar a tarefa.", error);
      showToast("Não foi possível acessar o Supabase. A tarefa foi mantida como estava.");
      return null;
    }

    if (result.error || !result.data) {
      console.error("Falha ao salvar a tarefa.", result.error);
      const permissionDenied =
        result.error?.code === "42501" ||
        /row-level security|permission denied/i.test(result.error?.message || "");
      showToast(
        permissionDenied
          ? "Sua conta não tem permissão para salvar tarefas. Entre com a conta do dono."
          : "Não foi possível salvar a tarefa no Supabase. Tente novamente.",
      );
      if (permissionDenied) window.setTimeout(() => window.location.reload(), 900);
      return null;
    }

    const saved = taskFromDatabase(result.data);
    if (isEditing) {
      const index = state.tasks.findIndex((task) => task.id === saved.id);
      if (index >= 0) state.tasks[index] = saved;
      else state.tasks.push(saved);
      return "updated";
    }
    state.tasks.push(saved);
    return "created";
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    const assignee = elements.taskAssignee.selectedOptions[0];
    submit.disabled = true;
    const result = await saveTaskToSupabase({
      title: String(data.get("title")).trim(),
      date: data.get("date"),
      category: data.get("category"),
      priority: data.get("priority"),
      assignedTo: String(data.get("assignedTo") || ""),
      responsible: assignee?.dataset.fullName || "Toda a equipe",
    });
    submit.disabled = false;
    if (!result) return;
    renderAll();
    closeDialogs();
    showView("agenda");
    showToast(result === "updated" ? "Tarefa atualizada." : "Tarefa adicionada à agenda.");
  }

  async function saveCropToSupabase(values) {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId || cropStorageMode !== "supabase" || !canManageCrops()) {
      showToast("Sua conta não pode alterar plantações neste momento.");
      return null;
    }
    const columns = "id, name, area_hectares, planting_date, planned_harvest_date, harvested_on, harvested_quantity, production_cost, status";
    const isEditing = editingRecord?.type === "crop";
    const existing = isEditing
      ? state.crops.find((crop) => crop.id === editingRecord.id)
      : null;
    const databaseValues = cropToDatabase({ ...values, harvestedOn: existing?.harvestedOn || "" });
    let result;
    try {
      result = isEditing
        ? await client
            .from("crops")
            .update({ ...databaseValues, updated_at: new Date().toISOString() })
            .eq("id", editingRecord.id)
            .eq("farm_id", activeAccount.farmId)
            .select(columns)
            .single()
        : await client
            .from("crops")
            .insert({ ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar a plantação.", error);
      showToast("Não foi possível acessar o Supabase. A plantação não foi alterada.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar a plantação.", result.error);
      showToast(
        result.error?.code === "42501"
          ? "Seu cargo não permite alterar plantações."
          : "Não foi possível salvar a plantação no Supabase.",
      );
      return null;
    }
    const saved = cropFromDatabase(result.data);
    if (isEditing) {
      const index = state.crops.findIndex((crop) => crop.id === saved.id);
      if (index >= 0) state.crops[index] = saved;
      else state.crops.push(saved);
      return "updated";
    }
    state.crops.push(saved);
    return "created";
  }

  async function saveAnimalToSupabase(values) {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId || animalStorageMode !== "supabase" || !canManageAnimals()) {
      showToast("Sua conta não pode alterar animais neste momento.");
      return null;
    }
    const columns = "id, identifier, species, breed, birth_date, weight_kg, applied_vaccines, next_vaccination, health_notes";
    const databaseValues = animalToDatabase(values);
    const isEditing = editingRecord?.type === "animal";
    let result;
    try {
      result = isEditing
        ? await client
            .from("animals")
            .update({ ...databaseValues, updated_at: new Date().toISOString() })
            .eq("id", editingRecord.id)
            .eq("farm_id", activeAccount.farmId)
            .select(columns)
            .single()
        : await client
            .from("animals")
            .insert({ ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar o animal.", error);
      showToast("Não foi possível acessar o Supabase. O animal não foi alterado.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar o animal.", result.error);
      const message =
        result.error?.code === "23505"
          ? "Já existe um animal com esse número ou nome na fazenda."
          : result.error?.code === "42501"
            ? "Seu cargo não permite alterar animais."
            : "Não foi possível salvar o animal no Supabase.";
      showToast(message);
      return null;
    }
    const saved = animalFromDatabase(result.data);
    if (isEditing) {
      const index = state.animals.findIndex((animal) => animal.id === saved.id);
      if (index >= 0) state.animals[index] = saved;
      else state.animals.push(saved);
      return "updated";
    }
    state.animals.push(saved);
    return "created";
  }

  async function handleCropSubmit(event) {
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
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    const result = await saveCropToSupabase({
      name: String(data.get("name")).trim(),
      area: Number(data.get("area")),
      plantingDate,
      harvestDate,
      cost: Number(data.get("cost")),
      status: data.get("status"),
      harvested: Number(data.get("harvested") || 0),
    });
    submit.disabled = false;
    if (!result) return;
    renderAll();
    closeDialogs();
    showView("plantacoes");
    showToast(
      result === "updated"
        ? "Plantação atualizada com sucesso."
        : "Plantação cadastrada com sucesso.",
    );
  }

  async function handleAnimalSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    const result = await saveAnimalToSupabase({
      name: String(data.get("name")).trim(),
      species: String(data.get("species")).trim(),
      breed: String(data.get("breed")).trim(),
      birthDate: data.get("birthDate"),
      weight: Number(data.get("weight")),
      vaccines: String(data.get("vaccines")).trim(),
      nextVaccine: data.get("nextVaccine"),
      health: String(data.get("health")).trim(),
    });
    submit.disabled = false;
    if (!result) return;
    renderAll();
    closeDialogs();
    showView("animais");
    showToast(
      result === "updated" ? "Animal atualizado com sucesso." : "Animal cadastrado com sucesso.",
    );
  }

  function setAnimalHealthStatus(stateName, message) {
    elements.animalHealthStatus.dataset.state = stateName;
    elements.animalHealthStatus.textContent = message;
  }

  function refreshAnimalHealthContext() {
    const animal = state.animals.find((item) => item.id === animalHealthAnimalId);
    if (!animal) return;
    elements.animalHealthName.textContent = animal.name;
    const details = [animal.species, animal.breed].filter(Boolean).join(" · ");
    const weight = Number(animal.weight || 0).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    });
    elements.animalHealthSummary.textContent = `${details || "Animal cadastrado"} · Peso atual: ${weight} kg`;
  }

  function updateAnimalHealthFields() {
    const form = elements.animalHealthForm;
    const type = form.elements.recordType.value;
    const showWeight = type === "peso";
    const showNextDue = type === "vacina";
    elements.animalHealthWeightField.hidden = !showWeight;
    elements.animalHealthNextDueField.hidden = !showNextDue;
    form.elements.weightKg.required = showWeight;
    form.elements.nextDueDate.required = showNextDue;
    form.elements.weightKg.setCustomValidity("");
    form.elements.nextDueDate.setCustomValidity("");
  }

  function resetAnimalHealthForm() {
    const form = elements.animalHealthForm;
    form.reset();
    resetFormValidation(form);
    form.elements.recordType.value = "saude";
    form.elements.occurredOn.value = isoDate(new Date());
    animalHealthEditingId = null;
    elements.animalHealthFormTitle.textContent = "Adicionar registro";
    elements.animalHealthCancel.hidden = true;
    form.querySelector('button[type="submit"]').textContent = "Salvar no prontuário";
    updateAnimalHealthFields();
  }

  function renderAnimalHealthHistory() {
    const records = [...animalHealthRecords].sort(
      (left, right) =>
        String(right.occurredOn).localeCompare(String(left.occurredOn)) ||
        String(right.updatedAt || right.createdAt).localeCompare(
          String(left.updatedAt || left.createdAt),
        ),
    );
    elements.animalHealthTableBody.replaceChildren(
      ...records.map((record) => {
        const row = document.createElement("tr");
        const date = document.createElement("td");
        date.textContent = formatDate(record.occurredOn);
        const type = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `animal-health-badge animal-health-${record.type}`;
        badge.textContent = ANIMAL_HEALTH_TYPE_LABELS[record.type] || record.type;
        type.append(badge);
        const description = document.createElement("td");
        description.className = "animal-health-description";
        description.textContent = record.description;
        const details = document.createElement("td");
        const detailItems = [];
        if (record.weightKg !== null) {
          detailItems.push(`${record.weightKg.toLocaleString("pt-BR")} kg`);
        }
        if (record.nextDueDate) {
          detailItems.push(`Próxima: ${formatDate(record.nextDueDate)}`);
        }
        details.textContent = detailItems.join(" · ") || "—";
        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "record-actions";
        if (canManageAnimals()) {
          const edit = document.createElement("button");
          edit.className = "row-edit";
          edit.type = "button";
          edit.dataset.editAnimalHealth = record.id;
          edit.textContent = "Editar";
          edit.setAttribute("aria-label", `Editar ${ANIMAL_HEALTH_TYPE_LABELS[record.type]}`);
          actions.append(edit);
        }
        if (activeAccount?.role === "owner") {
          actions.append(
            createDeleteButton("animal-health", record.id, record.description),
          );
        }
        actionsCell.append(actions);
        row.append(date, type, description, details, actionsCell);
        return row;
      }),
    );
    const empty = !animalHealthLoading && records.length === 0;
    elements.animalHealthEmpty.hidden = !empty;
    elements.animalHealthTableBody.closest("table").hidden = animalHealthLoading || empty;
  }

  async function loadAnimalHealthHistory() {
    const client = window.ruralSupabase;
    const animalId = animalHealthAnimalId;
    if (!client || !animalId) return;
    animalHealthLoading = true;
    animalHealthRecords = [];
    setAnimalHealthStatus("loading", "Carregando...");
    renderAnimalHealthHistory();
    let result;
    try {
      result = await client
        .from("animal_health_records")
        .select("id, animal_id, record_type, occurred_on, description, weight_kg, next_due_date, created_at, updated_at")
        .eq("animal_id", animalId)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });
    } catch (error) {
      console.error("Falha de conexão ao carregar o prontuário do animal.", error);
      result = { data: null, error };
    }
    if (animalHealthAnimalId !== animalId) return;
    animalHealthLoading = false;
    if (result.error) {
      console.error("Falha ao carregar o prontuário do animal.", result.error);
      setAnimalHealthStatus("error", "Histórico indisponível");
      renderAnimalHealthHistory();
      showToast("Não foi possível carregar o histórico de saúde.");
      return;
    }
    animalHealthRecords = (result.data || []).map(animalHealthFromDatabase);
    setAnimalHealthStatus(
      "ready",
      `${animalHealthRecords.length} ${animalHealthRecords.length === 1 ? "registro" : "registros"}`,
    );
    renderAnimalHealthHistory();
  }

  async function openAnimalHealth(animalId) {
    if (animalStorageMode !== "supabase") {
      showToast("Aguarde os animais terminarem de sincronizar.");
      return;
    }
    const animal = state.animals.find((item) => item.id === animalId);
    if (!animal) {
      showToast("Animal não encontrado.");
      return;
    }
    animalHealthAnimalId = animalId;
    animalHealthRecords = [];
    elements.animalHealthEditor.hidden = !canManageAnimals();
    resetAnimalHealthForm();
    refreshAnimalHealthContext();
    elements.animalHealthDialog.showModal();
    await loadAnimalHealthHistory();
  }

  function editAnimalHealthRecord(recordId) {
    if (!canManageAnimals()) {
      showToast("Seu cargo permite apenas consultar o prontuário.");
      return;
    }
    const record = animalHealthRecords.find((item) => item.id === recordId);
    if (!record) return;
    const form = elements.animalHealthForm;
    animalHealthEditingId = record.id;
    form.elements.recordType.value = record.type;
    form.elements.occurredOn.value = record.occurredOn;
    form.elements.description.value = record.description;
    form.elements.weightKg.value = record.weightKg ?? "";
    form.elements.nextDueDate.value = record.nextDueDate || "";
    elements.animalHealthFormTitle.textContent = "Editar registro";
    elements.animalHealthCancel.hidden = false;
    form.querySelector('button[type="submit"]').textContent = "Salvar alterações";
    updateAnimalHealthFields();
    elements.animalHealthEditor.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => form.elements.description.focus(), 0);
  }

  async function handleAnimalHealthSubmit(event) {
    event.preventDefault();
    if (!animalHealthAnimalId || !canManageAnimals()) {
      showToast("Seu cargo não permite alterar o prontuário.");
      return;
    }
    updateAnimalHealthFields();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const recordType = String(data.get("recordType"));
    const occurredOn = String(data.get("occurredOn"));
    const nextDueDate = recordType === "vacina" ? String(data.get("nextDueDate")) : "";
    if (nextDueDate && nextDueDate < occurredOn) {
      form.elements.nextDueDate.setCustomValidity(
        "A próxima vacinação deve ser posterior à data do registro.",
      );
      form.elements.nextDueDate.reportValidity();
      return;
    }
    form.elements.nextDueDate.setCustomValidity("");
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    let result;
    try {
      result = await window.ruralSupabase.rpc("save_animal_health_record", {
        p_record_id: animalHealthEditingId,
        p_animal_id: animalHealthAnimalId,
        p_record_type: recordType,
        p_occurred_on: occurredOn,
        p_description: String(data.get("description")).trim(),
        p_weight_kg: recordType === "peso" ? Number(data.get("weightKg")) : null,
        p_next_due_date: nextDueDate || null,
      });
    } catch (error) {
      console.error("Falha de conexão ao salvar o prontuário do animal.", error);
      result = { data: null, error };
    }
    submit.disabled = false;
    const savedRow = result.data?.[0];
    if (result.error || !savedRow) {
      console.error("Falha ao salvar o prontuário do animal.", result.error);
      showToast(result.error?.message || "Não foi possível salvar no prontuário.");
      return;
    }
    const savedRecord = animalHealthFromRpc(savedRow);
    const index = animalHealthRecords.findIndex((item) => item.id === savedRecord.id);
    if (index >= 0) animalHealthRecords[index] = savedRecord;
    else animalHealthRecords.push(savedRecord);
    updateAnimalFromHealthSnapshot(savedRow);
    refreshAnimalHealthContext();
    resetAnimalHealthForm();
    setAnimalHealthStatus(
      "ready",
      `${animalHealthRecords.length} ${animalHealthRecords.length === 1 ? "registro" : "registros"}`,
    );
    renderAnimalHealthHistory();
    showToast(index >= 0 ? "Registro de saúde atualizado." : "Registro salvo no prontuário.");
  }

  async function saveStockToSupabase(values) {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId || stockStorageMode !== "supabase" || !canManageStock()) {
      showToast("Sua conta não pode alterar o estoque neste momento.");
      return null;
    }
    const columns = "id, name, category, quantity, unit, minimum_quantity, storage_location, created_at, updated_at";
    const databaseValues = stockToDatabase(values);
    const isEditing = editingRecord?.type === "stock";
    let result;
    try {
      result = isEditing
        ? await client
            .from("inventory_items")
            .update({ ...databaseValues, updated_at: new Date().toISOString() })
            .eq("id", editingRecord.id)
            .eq("farm_id", activeAccount.farmId)
            .select(columns)
            .single()
        : await client
            .from("inventory_items")
            .insert({ ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar o item do estoque.", error);
      showToast("Não foi possível acessar o Supabase. O estoque não foi alterado.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar o item do estoque.", result.error);
      const message =
        result.error?.code === "23505"
          ? "Já existe um item com esse nome na fazenda."
          : result.error?.code === "42501"
            ? "Seu cargo não permite editar o cadastro do estoque."
            : "Não foi possível salvar o item no Supabase.";
      showToast(message);
      return null;
    }
    const saved = stockFromDatabase(result.data);
    if (isEditing) {
      const index = state.inventory.findIndex((item) => item.id === saved.id);
      if (index >= 0) state.inventory[index] = saved;
      else state.inventory.push(saved);
      return "updated";
    }
    state.inventory.push(saved);
    return "created";
  }

  async function handleStockSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    const result = await saveStockToSupabase({
      name: String(data.get("name")).trim(),
      category: data.get("category"),
      quantity: Number(data.get("quantity")),
      unit: data.get("unit"),
      minimum: Number(data.get("minimum")),
      location: String(data.get("location")).trim(),
      updatedAt: isoDate(new Date()),
    });
    submit.disabled = false;
    if (!result) return;
    renderAll();
    closeDialogs();
    showView("estoque");
    showToast(result === "updated" ? "Item do estoque atualizado." : "Item adicionado ao estoque.");
  }

  async function saveMachineToSupabase(values) {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId || machineStorageMode !== "supabase" || !canManageMachines()) {
      showToast("Sua conta não pode alterar máquinas neste momento.");
      return null;
    }
    const columns = "id, name, machine_type, brand, model, manufacture_year, work_hours, fuel_consumption_liters, last_maintenance, next_maintenance, repair_cost, status, created_at, updated_at";
    const databaseValues = machineToDatabase(values);
    const isEditing = editingRecord?.type === "machine";
    let result;
    try {
      result = isEditing
        ? await client
            .from("machines")
            .update({ ...databaseValues, updated_at: new Date().toISOString() })
            .eq("id", editingRecord.id)
            .eq("farm_id", activeAccount.farmId)
            .select(columns)
            .single()
        : await client
            .from("machines")
            .insert({ ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar a máquina.", error);
      showToast("Não foi possível acessar o Supabase. A máquina não foi alterada.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar a máquina.", result.error);
      const message =
        result.error?.code === "23505"
          ? "Já existe uma máquina com esse nome na fazenda."
          : result.error?.code === "42501"
            ? "Seu cargo não permite editar máquinas."
            : "Não foi possível salvar a máquina no Supabase.";
      showToast(message);
      return null;
    }
    const saved = machineFromDatabase({ ...result.data, machine_records: [] });
    if (isEditing) {
      const index = state.machines.findIndex((machine) => machine.id === saved.id);
      if (index >= 0) saved.history = state.machines[index].history || [];
      if (index >= 0) state.machines[index] = saved;
      else state.machines.push(saved);
      return "updated";
    }
    state.machines.push(saved);
    return "created";
  }

  async function handleMachineSubmit(event) {
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
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    const result = await saveMachineToSupabase({
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
    });
    submit.disabled = false;
    if (!result) return;
    renderAll();
    closeDialogs();
    showView("maquinas");
    showToast(
      result === "updated"
        ? "Máquina ou equipamento atualizado com sucesso."
        : "Máquina ou equipamento cadastrado com sucesso.",
    );
  }

  function openStockMovement(id) {
    if (stockStorageMode !== "supabase" || !activeAccount?.farmId) {
      showToast("Aguarde o estoque terminar de sincronizar.");
      return;
    }
    const item = state.inventory.find((stockItem) => stockItem.id === id);
    if (!item) return;
    stockMovementItemId = id;
    elements.stockMovementForm.reset();
    elements.stockMovementName.textContent = item.name;
    elements.stockMovementBalance.textContent = "Saldo atual: " + formatStockAmount(item);
    elements.stockMovementDialog.showModal();
    window.setTimeout(() => elements.stockMovementForm.querySelector("select, input")?.focus(), 0);
  }

  async function handleStockMovement(event) {
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

    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    let result;
    try {
      result = await window.ruralSupabase.rpc("record_inventory_movement", {
        p_item_id: item.id,
        p_movement_type: type,
        p_quantity: amount,
        p_occurred_on: isoDate(new Date()),
        p_notes: null,
      });
    } catch (error) {
      console.error("Falha de conexão ao movimentar o estoque.", error);
      showToast("Não foi possível acessar o Supabase. O saldo não foi alterado.");
      submit.disabled = false;
      return;
    }
    submit.disabled = false;
    const saved = result.data?.[0];
    if (result.error || !saved) {
      console.error("Falha ao movimentar o estoque.", result.error);
      showToast(
        result.error?.code === "22023"
          ? result.error.message
          : "Não foi possível registrar a movimentação no Supabase.",
      );
      return;
    }

    item.quantity = Number(saved.new_quantity || 0);
    item.updatedAt = String(saved.item_updated_at || "").slice(0, 10);
    renderAll();
    closeDialogs();
    showView("estoque");
    showToast(type === "entrada" ? "Entrada registrada no estoque." : "Saída registrada no estoque.");
    stockMovementItemId = null;
  }

  function openMachineActivity(id) {
    if (machineStorageMode !== "supabase" || !activeAccount?.farmId) {
      showToast("Aguarde as máquinas terminarem de sincronizar.");
      return;
    }
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

  async function handleMachineActivity(event) {
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
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    let result;
    try {
      result = await window.ruralSupabase.rpc("record_machine_activity", {
        p_machine_id: machine.id,
        p_activity_type: activityType,
        p_occurred_on: activityDate,
        p_added_hours: addedHours,
        p_fuel_liters: addedFuel,
        p_cost: addedCost,
        p_next_maintenance: nextMaintenance || null,
        p_status_after: MACHINE_STATUS_TO_DATABASE[data.get("status")] || "disponivel",
        p_notes: String(data.get("note") || "").trim() || null,
      });
    } catch (error) {
      console.error("Falha de conexão ao registrar a atividade da máquina.", error);
      showToast("Não foi possível acessar o Supabase. A máquina não foi alterada.");
      submit.disabled = false;
      return;
    }
    submit.disabled = false;
    const saved = result.data?.[0];
    if (result.error || !saved) {
      console.error("Falha ao registrar a atividade da máquina.", result.error);
      showToast(
        result.error?.code === "22023"
          ? result.error.message
          : "Não foi possível salvar a atualização da máquina no Supabase.",
      );
      return;
    }

    machine.hours = Number(saved.machine_work_hours || 0);
    machine.fuelConsumption = Number(saved.machine_fuel_liters || 0);
    machine.repairCost = Number(saved.machine_repair_cost || 0);
    machine.lastMaintenance = saved.machine_last_maintenance || "";
    machine.nextMaintenance = saved.machine_next_maintenance || "";
    machine.status = MACHINE_STATUS_FROM_DATABASE[saved.machine_status] || "Disponível";
    machine.updatedAt = String(saved.machine_updated_at || "").slice(0, 10);
    machine.history.unshift({
      id: saved.record_id,
      type: activityType,
      date: activityDate,
      hours: addedHours,
      fuel: addedFuel,
      cost: addedCost,
      note: String(data.get("note") || "").trim(),
    });
    machine.history = machine.history.slice(0, 20);

    renderAll();
    closeDialogs();
    showView("maquinas");
    showToast(activityType === "manutencao" ? "Manutenção registrada e alertas atualizados." : "Uso do equipamento atualizado.");
    machineActivityItemId = null;
  }

  async function toggleTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    if (taskStorageMode !== "supabase" || !activeAccount?.farmId) {
      showToast("A Agenda ainda não está conectada. Tente novamente em instantes.");
      return;
    }
    if (!canCurrentUserToggleTask(task)) {
      showToast("Somente o responsável ou o dono pode alterar esta tarefa.");
      return;
    }
    const nextCompleted = !task.completed;
    let result;
    try {
      result = await window.ruralSupabase.rpc("set_task_completion", {
        p_task_id: task.id,
        p_completed: nextCompleted,
      });
    } catch (error) {
      console.error("Falha de conexão ao atualizar a tarefa.", error);
      showToast("Não foi possível acessar o Supabase. A tarefa não foi alterada.");
      return;
    }
    const saved = result.data?.[0];
    if (result.error || !saved) {
      console.error("Falha ao atualizar a tarefa.", result.error);
      showToast(result.error?.message || "Não foi possível atualizar a tarefa.");
      return;
    }
    task.completed = Boolean(saved.task_completed);
    task.completedAt = saved.task_completed_at;
    renderAll();
    showToast(task.completed ? "Tarefa marcada como concluída." : "Tarefa reaberta.");
  }

  function requestDelete(type, id) {
    pendingDelete = { type, id };
    elements.deleteDialog.showModal();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === "animal-health") {
      if (
        animalStorageMode !== "supabase" ||
        !activeAccount?.farmId ||
        activeAccount.role !== "owner"
      ) {
        showToast("Somente o dono pode excluir registros do prontuário.");
        return;
      }
      elements.confirmDelete.disabled = true;
      const deletingId = pendingDelete.id;
      let result;
      try {
        result = await window.ruralSupabase.rpc("delete_animal_health_record", {
          p_record_id: deletingId,
        });
      } catch (error) {
        console.error("Falha de conexão ao excluir o registro de saúde.", error);
        result = { data: null, error };
      }
      elements.confirmDelete.disabled = false;
      const deletedRow = result.data?.[0];
      if (result.error || !deletedRow) {
        console.error("Falha ao excluir o registro de saúde.", result.error);
        showToast(result.error?.message || "Não foi possível excluir o registro de saúde.");
        return;
      }
      animalHealthRecords = animalHealthRecords.filter((item) => item.id !== deletingId);
      updateAnimalFromHealthSnapshot(deletedRow);
      refreshAnimalHealthContext();
      resetAnimalHealthForm();
      setAnimalHealthStatus(
        "ready",
        `${animalHealthRecords.length} ${animalHealthRecords.length === 1 ? "registro" : "registros"}`,
      );
      renderAnimalHealthHistory();
      pendingDelete = null;
      elements.deleteDialog.close();
      showToast("Registro excluído e resumo do animal atualizado.");
      return;
    }
    if (pendingDelete.type === "transaction") {
      if (financeStorageMode !== "supabase" || !activeAccount?.farmId) {
        showToast("O Financeiro não está conectado. Tente novamente em instantes.");
        return;
      }
      elements.confirmDelete.disabled = true;
      const deletingId = pendingDelete.id;
      let deleteResult;
      try {
        deleteResult = await window.ruralSupabase
          .from("transactions")
          .delete()
          .eq("id", deletingId)
          .eq("farm_id", activeAccount.farmId)
          .select("id")
          .maybeSingle();
      } catch (error) {
        console.error("Falha de conexão ao excluir o lançamento financeiro.", error);
        showToast("Não foi possível acessar o Supabase. O registro foi mantido.");
        elements.confirmDelete.disabled = false;
        return;
      }
      elements.confirmDelete.disabled = false;
      const { data, error } = deleteResult;
      if (error || !data) {
        console.error("Falha ao excluir o lançamento financeiro.", error);
        showToast("Não foi possível excluir do Supabase. O registro foi mantido.");
        return;
      }
      state.transactions = state.transactions.filter((item) => item.id !== deletingId);
      renderAll();
      showToast("Lançamento excluído e indicadores atualizados.");
      pendingDelete = null;
      elements.deleteDialog.close();
      return;
    }
    if (pendingDelete.type === "task") {
      if (
        taskStorageMode !== "supabase" ||
        !activeAccount?.farmId ||
        activeAccount.role !== "owner"
      ) {
        showToast("Somente o dono pode excluir tarefas da Agenda compartilhada.");
        return;
      }
      elements.confirmDelete.disabled = true;
      const deletingId = pendingDelete.id;
      let deleteResult;
      try {
        deleteResult = await window.ruralSupabase
          .from("tasks")
          .delete()
          .eq("id", deletingId)
          .eq("farm_id", activeAccount.farmId)
          .select("id")
          .maybeSingle();
      } catch (error) {
        console.error("Falha de conexão ao excluir a tarefa.", error);
        showToast("Não foi possível acessar o Supabase. A tarefa foi mantida.");
        elements.confirmDelete.disabled = false;
        return;
      }
      elements.confirmDelete.disabled = false;
      if (deleteResult.error || !deleteResult.data) {
        console.error("Falha ao excluir a tarefa.", deleteResult.error);
        showToast("Não foi possível excluir a tarefa do Supabase.");
        return;
      }
      state.tasks = state.tasks.filter((task) => task.id !== deletingId);
      renderAll();
      showToast("Tarefa excluída da agenda compartilhada.");
      pendingDelete = null;
      elements.deleteDialog.close();
      return;
    }
    if (["crop", "animal"].includes(pendingDelete.type)) {
      const isCrop = pendingDelete.type === "crop";
      const storageReady = isCrop
        ? cropStorageMode === "supabase"
        : animalStorageMode === "supabase";
      if (!storageReady || !activeAccount?.farmId || activeAccount.role !== "owner") {
        showToast("Somente o dono pode excluir registros compartilhados da propriedade.");
        return;
      }
      elements.confirmDelete.disabled = true;
      const deletingId = pendingDelete.id;
      let deleteResult;
      try {
        deleteResult = await window.ruralSupabase
          .from(isCrop ? "crops" : "animals")
          .delete()
          .eq("id", deletingId)
          .eq("farm_id", activeAccount.farmId)
          .select("id")
          .maybeSingle();
      } catch (error) {
        console.error("Falha de conexão ao excluir o registro compartilhado.", error);
        showToast("Não foi possível acessar o Supabase. O registro foi mantido.");
        elements.confirmDelete.disabled = false;
        return;
      }
      elements.confirmDelete.disabled = false;
      if (deleteResult.error || !deleteResult.data) {
        console.error("Falha ao excluir o registro compartilhado.", deleteResult.error);
        showToast("Não foi possível excluir o registro do Supabase.");
        return;
      }
      const collection = isCrop ? "crops" : "animals";
      state[collection] = state[collection].filter((item) => item.id !== deletingId);
      renderAll();
      showToast(isCrop ? "Plantação excluída." : "Animal excluído.");
      pendingDelete = null;
      elements.deleteDialog.close();
      return;
    }
    if (["stock", "machine"].includes(pendingDelete.type)) {
      const isStock = pendingDelete.type === "stock";
      const storageReady = isStock
        ? stockStorageMode === "supabase"
        : machineStorageMode === "supabase";
      if (!storageReady || !activeAccount?.farmId || activeAccount.role !== "owner") {
        showToast("Somente o dono pode excluir estoque ou máquinas da fazenda.");
        return;
      }
      elements.confirmDelete.disabled = true;
      const deletingId = pendingDelete.id;
      let deleteResult;
      try {
        deleteResult = await window.ruralSupabase
          .from(isStock ? "inventory_items" : "machines")
          .delete()
          .eq("id", deletingId)
          .eq("farm_id", activeAccount.farmId)
          .select("id")
          .maybeSingle();
      } catch (error) {
        console.error("Falha de conexão ao excluir o registro operacional.", error);
        showToast("Não foi possível acessar o Supabase. O registro foi mantido.");
        elements.confirmDelete.disabled = false;
        return;
      }
      elements.confirmDelete.disabled = false;
      if (deleteResult.error || !deleteResult.data) {
        console.error("Falha ao excluir o registro operacional.", deleteResult.error);
        showToast("Não foi possível excluir o registro do Supabase.");
        return;
      }
      const collection = isStock ? "inventory" : "machines";
      state[collection] = state[collection].filter((item) => item.id !== deletingId);
      renderAll();
      showToast(isStock ? "Item do estoque excluído." : "Máquina excluída.");
      pendingDelete = null;
      elements.deleteDialog.close();
      return;
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
  elements.animalHealthForm.addEventListener("submit", handleAnimalHealthSubmit);
  elements.animalHealthForm.elements.recordType.addEventListener("change", updateAnimalHealthFields);
  elements.animalHealthCancel.addEventListener("click", resetAnimalHealthForm);
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
  elements.reportMonth.addEventListener("change", renderReports);
  elements.reportAllPeriod.addEventListener("click", () => {
    elements.reportMonth.value = "";
    renderReports();
  });
  elements.printReport.addEventListener("click", () => {
    renderReports();
    window.print();
  });
  elements.weatherSearchForm.addEventListener("submit", handleWeatherSearch);
  elements.weatherRefresh.addEventListener("click", loadWeather);
  elements.teamInviteForm?.addEventListener("submit", createTeamInvite);
  elements.teamRefresh?.addEventListener("click", loadTeamFromSupabase);
  elements.teamCopyLatest?.addEventListener("click", () => copyInviteCode(latestInviteCode));
  elements.messageRefresh?.addEventListener("click", loadContactMessages);
  elements.messageStatusFilter?.addEventListener("change", renderContactMessages);
  elements.notificationButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    setNotificationPanel(elements.notificationPanel.hidden);
  });
  elements.notificationMarkAll?.addEventListener("click", markAllNotificationsRead);

  elements.resetDemo.addEventListener("click", () => {
    if (!window.confirm("Restaurar todos os dados de demonstração?")) return;
    const syncedTransactions = state.transactions;
    const syncedTasks = state.tasks;
    const syncedCrops = state.crops;
    const syncedAnimals = state.animals;
    const syncedStock = state.inventory;
    const syncedMachines = state.machines;
    const restoredState = seedState();
    localTransactionBackup = restoredState.transactions.map((item) => ({ ...item }));
    localTaskBackup = restoredState.tasks.map((item) => ({ ...item }));
    localCropBackup = restoredState.crops.map((item) => ({ ...item }));
    localAnimalBackup = restoredState.animals.map((item) => ({ ...item }));
    localStockBackup = restoredState.inventory.map((item) => ({ ...item }));
    localMachineBackup = restoredState.machines.map((item) => ({
      ...item,
      history: Array.isArray(item.history) ? item.history.map((record) => ({ ...record })) : [],
    }));
    if (financeStorageMode !== "local") restoredState.transactions = syncedTransactions;
    if (taskStorageMode !== "local") restoredState.tasks = syncedTasks;
    if (cropStorageMode !== "local") restoredState.crops = syncedCrops;
    if (animalStorageMode !== "local") restoredState.animals = syncedAnimals;
    if (stockStorageMode !== "local") restoredState.inventory = syncedStock;
    if (machineStorageMode !== "local") restoredState.machines = syncedMachines;
    state = restoredState;
    weatherData = null;
    saveState();
    renderAll();
    elements.weatherSearchInput.value = weatherLocationName();
    loadWeather();
    showToast("Dados de demonstração restaurados.");
  });

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) showView(viewButton.dataset.view);

    const goButton = event.target.closest("[data-go-view]");
    if (goButton) showView(goButton.dataset.goView);

    const notificationButton = event.target.closest("[data-open-notification]");
    if (notificationButton) {
      openNotification(
        notificationButton.dataset.openNotification,
        notificationButton.dataset.taskId,
      );
    }

    const openButton = event.target.closest("[data-open-dialog]");
    if (openButton) openDialog(openButton.dataset.openDialog);

    const editButton = event.target.closest("[data-edit-type]");
    if (editButton) {
      openEditDialog(editButton.dataset.editType, editButton.dataset.editId);
    }

    const animalHealthButton = event.target.closest("[data-animal-health]");
    if (animalHealthButton) openAnimalHealth(animalHealthButton.dataset.animalHealth);

    const editAnimalHealthButton = event.target.closest("[data-edit-animal-health]");
    if (editAnimalHealthButton) {
      editAnimalHealthRecord(editAnimalHealthButton.dataset.editAnimalHealth);
    }

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

    const copyInviteButton = event.target.closest("[data-copy-invite]");
    if (copyInviteButton) copyInviteCode(copyInviteButton.dataset.copyInvite);

    const statusButton = event.target.closest("[data-team-status]");
    if (statusButton) {
      updateTeamMember(statusButton.dataset.teamStatus, {
        status: statusButton.dataset.nextStatus,
      });
    }

    const revokeInviteButton = event.target.closest("[data-revoke-invite]");
    if (revokeInviteButton) revokeTeamInvite(revokeInviteButton.dataset.revokeInvite);

    const filterButton = event.target.closest("[data-task-filter]");
    if (filterButton) {
      taskFilter = filterButton.dataset.taskFilter;
      document.querySelectorAll("[data-task-filter]").forEach((button) => {
        button.classList.toggle("active", button === filterButton);
      });
      renderAgenda();
    }
  });

  document.addEventListener("change", (event) => {
    const roleSelect = event.target.closest("[data-team-role]");
    if (roleSelect) updateTeamMember(roleSelect.dataset.teamRole, { role: roleSelect.value });

    const messageStatus = event.target.closest("[data-message-status]");
    if (messageStatus) {
      updateContactMessageStatus(messageStatus.dataset.messageStatus, messageStatus.value);
    }
  });

  document.querySelectorAll(".app-dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (dialog === elements.animalHealthDialog) {
        animalHealthAnimalId = null;
        animalHealthRecords = [];
        animalHealthEditingId = null;
        animalHealthLoading = false;
        resetAnimalHealthForm();
      }
      const type = Object.keys(editorConfig).find(
        (editorType) => editorConfig[editorType].dialog === dialog,
      );
      if (type && editingRecord?.type === type) {
        editingRecord = null;
        setDialogMode(type, false);
      }
    });
  });

  window.addEventListener("hashchange", () => {
    showView(window.location.hash.slice(1), false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) toggleMenu(false);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".notification-center")) setNotificationPanel(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setNotificationPanel(false);
  });

  window.addEventListener("beforeunload", () => {
    if (notificationsChannel) window.ruralSupabase?.removeChannel(notificationsChannel);
  });

  window.addEventListener("rural:account-ready", (event) => {
    connectAccount(event.detail).catch(() => {
      setFinanceStatus("error", "Sincronização indisponível");
      showToast("Não foi possível iniciar a sincronização financeira.");
    });
  });

  elements.todayLabel.textContent = longDate.format(new Date());
  elements.weatherSearchInput.value = weatherLocationName();
  renderAll();
  showView(window.location.hash.slice(1), false);
  loadWeather();
  if (window.ruralAccount) {
    connectAccount(window.ruralAccount).catch(() => {
      setFinanceStatus("error", "Sincronização indisponível");
      showToast("Não foi possível iniciar a sincronização financeira.");
    });
  }
})();
