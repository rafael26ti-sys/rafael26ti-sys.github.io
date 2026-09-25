Warning: truncated output (original token count: 75891)
Total output lines: 7611

(() => {
  "use strict";

  const STORAGE_KEY = "controle-rural-simples.profissional.v1";
  const VIEWS = ["dashboard", "financeiro", "agenda", "plantacoes", "animais", "leite", "estoque", "maquinas", "equipe", "historico", "mensagens", "relatorios", "clima"];
  const TEAM_ROLE_LABELS = {
    owner: "Dono da fazenda",
    gerente: "Gerente",
    vaqueiro: "Vaqueiro",
    caseiro: "Caseiro",
  };
  const TASK_STATUS_LABELS = {
    aberta: "Aberta",
    em_andamento: "Em andamento",
    concluida: "Concluída",
  };
  const TASK_UPDATE_LABELS = {
    comentario: "Atualização",
    iniciada: "Serviço iniciado",
    concluida: "Serviço concluído",
    reaberta: "Ordem reaberta",
  };
  const MILK_SHIFT_LABELS = {
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
  };
  const CATTLE_CATEGORY_LABELS = {
    bezerro: "Bezerro",
    novilha: "Novilha",
    vaca: "Vaca",
    boi: "Boi",
    touro: "Touro",
  };
  const ANIMAL_STATUS_LABELS = {
    active: "Ativo",
    sold: "Vendido",
    deceased: "Morto",
  };
  const HISTORY_PAGE_SIZE = 30;
  const HISTORY_MODULES = {
    propriedade: { label: "Propriedade", icon: "⌂" },
    financeiro: { label: "Financeiro", icon: "R$" },
    agenda: { label: "Ordens de serviço", icon: "□" },
    animais: { label: "Animais", icon: "◇" },
    saude_animal: { label: "Saúde animal", icon: "+" },
    producao_leite: { label: "Produção de leite", icon: "◒" },
    plantacoes: { label: "Plantações", icon: "♧" },
    estoque: { label: "Estoque", icon: "▤" },
    maquinas: { label: "Máquinas", icon: "⚙" },
    equipe: { label: "Equipe", icon: "◎" },
  };
  const HISTORY_ACTIONS = {
    create: { label: "Criou", className: "create" },
    update: { label: "Editou", className: "update" },
    delete: { label: "Excluiu", className: "delete" },
  };
  const HISTORY_FIELD_LABELS = {
    name: "nome",
    city: "cidade",
    state: "estado",
    country: "país",
    area_hectares: "área",
    weather_latitude: "latitude do clima",
    weather_longitude: "longitude do clima",
    transaction_type: "tipo",
    occurred_on: "data",
    description: "descrição",
    category: "categoria",
    amount: "valor",
    notes: "observações",
    title: "título",
    due_date: "prazo",
    priority: "prioridade",
    responsible_name: "responsável",
    assigned_to: "pessoa responsável",
    completed: "conclusão",
    started_at: "início do serviço",
    completed_by: "responsável pela conclusão",
    identifier: "identificação",
    species: "espécie",
    breed: "raça",
    birth_date: "nascimento",
    weight_kg: "peso",
    applied_vaccines: "vacinas aplicadas",
    next_vaccination: "próxima vacinação",
    health_notes: "observações de saúde",
    cattle_category: "categoria do gado",
    inactive_reason: "motivo da inatividade",
    inactive_on: "data da inatividade",
    animal_id: "vaca",
    production_date: "data da produção",
    shift: "turno",
    liters: "litros produzidos",
    discarded_liters: "litros descartados",
    active: "situação",
    record_type: "tipo de registro",
    next_due_date: "próxima data",
    planting_date: "plantio",
    planned_harvest_date: "previsão da colheita",
    harvested_on: "data da colheita",
    harvested_quantity: "quantidade colhida",
    harvested_unit: "unidade da colheita",
    production_cost: "custo de produção",
    status: "situação",
    quantity: "quantidade",
    unit: "unidade",
    minimum_quantity: "estoque mínimo",
    storage_location: "local de armazenamento",
    movement_type: "tipo de movimentação",
    machine_type: "tipo de equipamento",
    brand: "marca",
    model: "modelo",
    manufacture_year: "ano de fabricação",
    work_hours: "horas trabalhadas",
    fuel_consumption_liters: "combustível consumido",
    last_maintenance: "última manutenção",
    next_maintenance: "próxima manutenção",
    repair_cost: "gastos com consertos",
    activity_type: "tipo de atividade",
    added_hours: "horas adicionadas",
    fuel_liters: "combustível",
    cost: "custo",
    status_after: "situação após a atividade",
    role: "cargo",
    invited_email: "e-mail do convite",
    expires_at: "validade",
    used_at: "utilização do convite",
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
          category: "boi",
          breed: "Girolando",
          birthDate: "2023-04-12",
          weight: 438,
          vaccines: "Febre aftosa, brucelose",
          nextVaccine: addDays(3),
          health: "Animal saudável. Última pesagem dentro do esperado.",
          status: "active",
          statusDate: "",
        },
        {
          id: "seed-animal-2",
          name: "Estrela",
          species: "Bovino",
          category: "vaca",
          breed: "Holandesa",
          birthDate: "2022-09-03",
          weight: 512,
          vaccines: "Febre aftosa, IBR",
          nextVaccine: addDays(18),
          health: "Em lactação. Acompanhamento veterinário regular.",
          status: "active",
          statusDate: "",
        },
        {
          id: "seed-animal-3",
          name: "Brinco 031",
          species: "Bovino",
          category: "novilha",
          breed: "Nelore",
          birthDate: "2024-01-20",
          weight: 286,
          vaccines: "Brucelose",
          nextVaccine: addDays(42),
          health: "Sem ocorrências registradas.",
          status: "active",
          statusDate: "",
        },
        {
          id: "seed-animal-4",
          name: "Lua",
          species: "Equino",
          category: "",
          breed: "Mangalarga",
          birthDate: "2021-06-14",
          weight: 398,
          vaccines: "Influenza equina, tétano",
          nextVaccine: addDays(75),
          health: "Casco revisado recentemente.",
          status: "active",
          statusDate: "",
        },
      ],
      milkProduction: [
        {
          id: "seed-milk-1",
          animalId: "seed-animal-2",
          animalName: "Estrela",
          date: isoDate(new Date()),
          shift: "manha",
          liters: 14.5,
          discardedLiters: 0,
          notes: "Ordenha realizada normalmente.",
          createdBy: "",
        },
        {
          id: "seed-milk-2",
          animalId: "seed-animal-2",
          animalName: "Estrela",
          date: isoDate(new Date()),
          shift: "tarde",
          liters: 11.8,
          discardedLiters: 0.5,
          notes: "Descarte separado durante a ordenha.",
          createdBy: "",
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
      if (!Array.isArray(parsed.milkProduction)) parsed.milkProduction = [];
      parsed.animals.forEach((animal) => {
        if (!animal.status) animal.status = "active";
        if (!animal.statusDate) animal.statusDate = "";
      });
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
        milkProduction:
          milkStorageMode === "local" ? state.milkProduction : localMilkBackup,
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
    notificationDeviceSettings: document.querySelector(".notification-device-settings"),
    pushStatus: document.querySelector("#push-status"),
    pushEnableButton: document.querySelector("#push-enable-button"),
    pwaInstallButton: document.querySelector("#pwa-install-button"),
    storageStatusSidebar: document.querySelector("#storage-status-sidebar"),
    storageStatusCopy: document.querySelector("#storage-status-copy"),
    offlineBanner: document.querySelector("#offline-banner"),
    offlineStatusIcon: document.querySelector("#offline-status-icon"),
    offlinePendingCount: document.querySelector("#offline-pending-count"),
    offlineSyncButton: document.querySelector("#offline-sync-button"),
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
    taskDetailsDialog: document.querySelector("#task-details-dialog"),
    taskDetailsCode: document.querySelector("#task-details-code"),
    taskDetailsTitle: document.querySelector("#task-details-title"),
    taskDetailsStatus: document.querySelector("#task-details-status"),
    taskDetailsResponsible: document.querySelector("#task-details-responsible"),
    taskDetailsDate: document.querySelector("#task-details-date"),
    taskDetailsCategory: document.querySelector("#task-details-category"),
    taskDetailsPriority: document.querySelector("#task-details-priority"),
    taskDetailsInstructions: document.querySelector("#task-details-instructions"),
    taskStatusActions: document.querySelector("#task-status-actions"),
    taskUpdateForm: document.querySelector("#task-update-form"),
    taskUpdateOnlineNote: document.querySelector("#task-update-online-note"),
    taskDetailsSync: document.querySelector("#task-details-sync"),
    taskUpdatesList: document.querySelector("#task-updates-list"),
    taskUpdatesEmpty: document.querySelector("#task-updates-empty"),
    cropSummary: document.querySelector("#crop-summary"),
    cropSyncStatus: document.querySelector("#crop-sync-status"),
    cropList: document.querySelector("#crop-list"),
    cropEmpty: document.querySelector("#crop-empty"),
    animalSummary: document.querySelector("#animal-summary"),
    animalSyncStatus: document.querySelector("#animal-sync-status"),
    animalSearch: document.querySelector("#animal-search"),
    animalCategoryFilter: document.querySelector("#animal-category-filter"),
    animalStatusFilter: document.querySelector("#animal-status-filter"),
    animalTableBody: document.querySelector("#animal-table-body"),
    animalEmpty: document.querySelector("#animal-empty"),
    metricMilk: document.querySelector("#metric-milk"),
    milkSyncStatus: document.querySelector("#milk-sync-status"),
    milkDateFilter: document.querySelector("#milk-date-filter"),
    milkSummary: document.querySelector("#milk-summary"),
    milkCount: document.querySelector("#milk-count"),
    milkTableBody: document.querySelector("#milk-table-body"),
    milkEmpty: document.querySelector("#milk-empty"),
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
    historySyncStatus: document.querySelector("#history-sync-status"),
    historyRefresh: document.querySelector("#history-refresh"),
    historyModuleFilter: document.querySelector("#history-module-filter"),
    historyActionFilter: document.querySelector("#history-action-filter"),
    historyCount: document.querySelector("#history-count"),
    historyList: document.querySelector("#history-list"),
    historyEmpty: document.querySelector("#history-empty"),
    historyLoadMoreWrap: document.querySelector("#history-load-more-wrap"),
    historyLoadMore: document.querySelector("#history-load-more"),
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
    animalStatusDateField: document.querySelector("#animal-status-date-field"),
    milkDialog: document.querySelector("#milk-dialog"),
    milkForm: document.querySelector("#milk-form"),
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
    agenda: "Ordens de serviço",
    plantacoes: "Plantações",
    animais: "Animais",
    leite: "Produção de leite",
    estoque: "Estoque",
    maquinas: "Máquinas e equipamentos",
    equipe: "Equipe",
    historico: "Histórico da propriedade",
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
      newTitle: "Nova ordem de serviço",
      editTitle: "Editar ordem de serviço",
      newSubmit: "Salvar ordem",
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
    milk: {
      collection: "milkProduction",
      prefix: "milk",
      dialog: elements.milkDialog,
      form: elements.milkForm,
      newTitle: "Nova produção de leite",
      editTitle: "Editar produção de leite",
      newSubmit: "Salvar produção",
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
  let localMilkBackup = state.milkProduction.map((item) => ({ ...item }));
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
  let milkStorageMode = "waiting";
  let stockStorageMode = "waiting";
  let machineStorageMode = "waiting";
  let offlineSyncing = false;
  let accountConnecting = false;
  let offlineSnapshotLoaded = false;
  let taskFilter = "todas";
  let editingRecord = null;
  let activeTaskDetailsId = null;
  let taskUpdates = [];
  let taskDetailsLoading = false;
  let animalHealthAnimalId = null;
  let animalHealthRecords = [];
  let animalHealthEditingId = null;
  let animalHealthLoading = false;
  let stockMovementItemId = null;
  let machineActivityItemId = null;
  let weatherData = null;
  let weatherDataSavedAt = null;
  let weatherFetchController = null;
  let pendingDelete = null;
  let toastTimer = null;
  let teamMembers = [];
  let teamInvites = [];
  let activityHistory = [];
  let activityHistoryCursor = null;
  let activityHistoryHasMore = false;
  let activityHistoryLoading = false;
  let activityHistoryDeleting = false;
  let contactAdmin = false;
  let contactMessages = [];
  let latestInviteCode = "";
  let notifications = [];
  let notificationsChannel = null;
  let pushBusy = false;
  let pendingPushNavigation = (() => {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get("task") || "";
    const notificationId = params.get("notification") || "";
    return taskId ? { taskId, notificationId } : null;
  })();

  if (!elements.financeMonth.value) {
    elements.financeMonth.value = monthKey(isoDate(new Date()));
  }
  if (!elements.reportMonth.value) {
    elements.reportMonth.value = monthKey(isoDate(new Date()));
  }
  if (!elements.milkDateFilter.value) {
    elements.milkDateFilter.value = isoDate(new Date());
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 3200);
  }

  function storageReady(mode) {
    return mode === "supabase" || mode === "offline";
  }

  function operationCount() {
    return activeAccount ? window.ruralOffline?.getQueue?.(activeAccount).length || 0 : 0;
  }

  function persistOfflineSnapshot() {
    if (!activeAccount?.farmId) return;
    const snapshotState = {
      ...state,
      transactions: activeAccount.role === "owner" ? state.transactions : [],
      offlineWeatherData: weatherData,
      offlineWeatherSavedAt: weatherDataSavedAt,
    };
    window.ruralOffline?.saveSnapshot?.(
      activeAccount,
      snapshotState,
      notifications,
      ["owner", "gerente"].includes(activeAccount.role) ? teamMembers : [],
    );
  }

  function restoreOfflineSnapshot() {
    if (!activeAccount?.farmId) return false;
    const snapshot = window.ruralOffline?.getSnapshot?.(activeAccount);
    if (!snapshot || !validState(snapshot.state)) return false;
    state = snapshot.state;
    state.animals.forEach((animal) => {
      if (!animal.status) animal.status = "active";
      if (!animal.statusDate) animal.statusDate = "";
    });
    if (!Array.isArray(state.milkProduction)) state.milkProduction = [];
    if (!Array.isArray(state.inventory)) state.inventory = [];
    if (!Array.isArray(state.machines)) state.machines = [];
    state.machines.forEach((machine) => {
      if (!Array.isArray(machine.history)) machine.history = [];
    });
    if (activeAccount.role !== "owner") state.transactions = [];
    weatherData = state.offlineWeatherData || null;
    weatherDataSavedAt = state.offlineWeatherSavedAt || null;
    notifications = Array.isArray(snapshot.notifications) ? snapshot.notifications : [];
    teamMembers = Array.isArray(snapshot.teamMembers) ? snapshot.teamMembers : [];
    offlineSnapshotLoaded = true;
    renderNotifications();
    renderAll();
    if (weatherData) renderWeather();
    return true;
  }

  function isConnectionFailure(error) {
    return (
      !navigator.onLine ||
      /fetch|network|offline|timeout|timed out|failed to fetch|load failed/i.test(
        `${error?.message || ""} ${error?.details || ""}`,
      )
    );
  }

  function keepRecordAfterConnectionFailure(entity, values, recordId, isEditing) {
    const saved = saveOfflineRecord(entity, values, { recordId, isEditing });
    if (!saved) return null;
    setOfflineModules();
    window.setTimeout(() => {
      if (navigator.onLine && activeAccount && !accountConnecting) {
        synchronizeOfflineChanges({ quiet: true });
      }
    }, 1800);
    return saved;
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
    persistOfflineSnapshot();
  }

  function receiveNotification(row, announce = false) {
    if (row.farm_id !== activeAccount?.farmId) return;
    const incoming = notificationFromDatabase(row);
    const existingIndex = notifications.findIndex((item) => item.id === incoming.id);
    if (existingIndex >= 0) notifications[existingIndex] = incoming;
    else notifications.unshift(incoming);
    notifications = notifications
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
      .slice(0, 30);
    renderNotifications();
    persistOfflineSnapshot();
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

  function isIosDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isStandaloneApp() {
    return Boolean(
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone,
    );
  }

  function setPushStatus(state, message) {
    if (elements.notificationDeviceSettings) {
      elements.notificationDeviceSettings.dataset.state = state;
    }
    if (elements.pushStatus) elements.pushStatus.textContent = message;
  }

  function updateInstallButton() {
    if (!elements.pwaInstallButton) return;
    const canPrompt = Boolean(window.ruralPwa?.canInstall?.());
    const needsIosInstructions = isIosDevice() && !isStandaloneApp();
    elements.pwaInstallButton.hidden = isStandaloneApp() || (!canPrompt && !needsIosInstructions);
    elements.pwaInstallButton.textContent = needsIosInstructions
      ? "Como instalar"
      : "Instalar aplicativo";
  }

  function base64UrlToUint8Array(value) {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const normalized = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const binary = window.atob(normalized);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  async function syncPushSubscription(subscription) {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId || !subscription) return false;
    const serialized = subscription.toJSON();
    if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys?.auth) return false;
    const { error } = await client.functions.invoke("send-task-push", {
      body: {
        action: "register",
        farm_id: activeAccount.farmId,
        subscription: serialized,
        user_agent: navigator.userAgent,
      },
    });
    if (error) console.error("Falha ao sincronizar as notificações do aparelho.", error);
    return !error;
  }

  async function refreshPushControls(syncExisting = true) {
    updateInstallButton();
    if (!elements.pushEnableButton) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      elements.pushEnableButton.disabled = true;
      setPushStatus(
        "blocked",
        isIosDevice() && !isStandaloneApp()
          ? "No iPhone, instale o aplicativo pela opção Compartilhar → Adicionar à Tela de Início."
          : "Este navegador não oferece notificações para aplicativos da web.",
      );
      return;
    }
    if (!activeAccount?.farmId) {
      elements.pushEnableButton.disabled = true;
      setPushStatus("waiting", "Aguardando a conexão com sua propriedade...");
      return;
    }
    if (Notification.permission === "denied") {
      elements.pushEnableButton.disabled = true;
      setPushStatus("blocked", "As notificações foram bloqueadas nas configurações deste navegador.");
      return;
    }

    try {
      const registration = await window.ruralPwa?.registration;
      if (!registration?.pushManager) {
        elements.pushEnableButton.disabled = true;
        setPushStatus("error", "Não foi possível preparar as notificações neste aparelho.");
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      elements.pushEnableButton.disabled = pushBusy;
      elements.pushEnableButton.dataset.active = subscription ? "true" : "false";
      elements.pushEnableButton.textContent = subscription
        ? "Desativar notificações"
        : "Ativar notificações";
      if (!subscription) {
        setPushStatus("ready", "Ative para receber novas ordens mesmo com o sistema fechado.");
        return;
      }

      if (syncExisting) {
        const synchronized = await syncPushSubscription(subscription);
        if (!synchronized) {
          setPushStatus("error", "O navegador está autorizado, mas a sincronização precisa ser refeita.");
          return;
        }
      }
      setPushStatus("active", "Notificações ativadas neste aparelho.");
    } catch (error) {
      console.error("Falha ao verificar as notificações do aparelho.", error);
      elements.pushEnableButton.disabled = false;
      setPushStatus("error", "Não foi possível verificar as notificações neste aparelho.");
    }
  }

  async function togglePushNotifications() {
    if (pushBusy || !elements.pushEnableButton) return;
    const client = window.ruralSupabase;
    const registration = await window.ruralPwa?.registration;
    if (!client || !registration?.pushManager || !activeAccount?.farmId) {
      showToast("As notificações ainda não estão disponíveis neste aparelho.");
      return;
    }

    pushBusy = true;
    elements.pushEnableButton.disabled = true;
    setPushStatus("waiting", "Atualizando a autorização deste aparelho...");
    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const { error } = await client.functions.invoke("send-task-push", {
          body: { action: "unregister", endpoint: existing.endpoint },
        });
        if (error) throw error;
        await existing.unsubscribe();
        showToast("Notificações desativadas neste aparelho.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus(
          "blocked",
          permission === "denied"
            ? "Você bloqueou as notificações. Para ativar, altere a permissão do site no navegador."
            : "A autorização de notificações não foi concluída.",
        );
        return;
      }

      const publicKeyResult = await client.functions.invoke("send-task-push", {
        body: { action: "public-key" },
      });
      if (publicKeyResult.error || !publicKeyResult.data?.publicKey) {
        throw publicKeyResult.error || new Error("Chave pública de notificação indisponível.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(publicKeyResult.data.publicKey),
      });
      const synchronized = await syncPushSubscription(subscription);
      if (!synchronized) {
        await subscription.unsubscribe();
        throw new Error("A assinatura não pôde ser salva.");
      }
      showToast("Notificações ativadas. Este aparelho receberá novas atividades.");
    } catch (error) {
      console.error("Falha ao alterar as notificações do aparelho.", error);
      setPushStatus("error", "Não foi possível ativar as notificações. Tente novamente.");
      showToast("Não foi possível alterar as notificações deste aparelho.");
    } finally {
      pushBusy = false;
      await refreshPushControls(false);
    }
  }

  async function installPwa() {
    if (isIosDevice() && !isStandaloneApp()) {
      showToast("No iPhone: toque em Compartilhar e depois em Adicionar à Tela de Início.");
      return;
    }
    const choice = await window.ruralPwa?.install?.();
    if (choice?.outcome === "accepted") showToast("Aplicativo instalado neste aparelho.");
    updateInstallButton();
  }

  async function handlePendingPushNavigation() {
    if (!pendingPushNavigation || !activeAccount) return;
    const target = pendingPushNavigation;
    pendingPushNavigation = null;
    const params = new URLSearchParams(window.location.search);
    params.delete("task");
    params.delete("notification");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}#agenda`,
    );
    await openNotification(target.notificationId, target.taskId);
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
      .eq("farm_id", activeAccount.farmId)
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
      .eq("farm_id", activeAccount.farmId)
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
      button.disabled = !storageReady(mode);
    });
  }

  function setTaskStatus(mode, message) {
    taskStorageMode = mode;
    if (elements.taskSyncStatus) {
      elements.taskSyncStatus.dataset.state = mode === "supabase" ? "ready" : mode;
      elements.taskSyncStatus.textContent = message;
    }
    document.querySelectorAll('[data-open-dialog="task"]').forEach((button) => {
      button.disabled = !storageReady(mode) || activeAccount?.role !== "owner";
    });
  }

  function canManageCrops() {
    return Boolean(activeAccount && ["owner", "caseiro"].includes(activeAccount.role));
  }

  function canManageAnimals() {
    return Boolean(activeAccount && ["owner", "vaqueiro"].includes(activeAccount.role));
  }

  function canManageMilk() {
    return Boolean(
      activeAccount && ["owner", "vaqueiro", "caseiro"].includes(activeAccount.role),
    );
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
      button.disabled = !storageReady(mode);
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
      button.disabled = !storageReady(mode);
    });
  }

  function setMilkStatus(mode, message) {
    milkStorageMode = mode;
    if (elements.milkSyncStatus) {
      elements.milkSyncStatus.dataset.state = mode === "supabase" ? "ready" : mode;
      elements.milkSyncStatus.textContent = message;
    }
    document.querySelectorAll('[data-open-dialog="milk"]').forEach((button) => {
      button.hidden = !canManageMilk();
      button.disabled = !storageReady(mode);
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
      button.disabled = !storageReady(mode);
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
      button.disabled = !storageReady(mode);
    });
  }

  function setOfflineModules() {
    if (activeAccount?.role === "owner") setFinanceStatus("offline", "Disponível sem internet");
    setTaskStatus("offline", "Ordens disponíveis sem internet");
    setCropStatus("offline", "Dados salvos neste aparelho");
    setAnimalStatus("offline", "Dados salvos neste aparelho");
    setMilkStatus("offline", "Produção salva neste aparelho");
    setStockStatus("offline", "Dados salvos neste aparelho");
    setMachineStatus("offline", "Dados salvos neste aparelho");
    updateStorageSummary();
  }

  function updateStorageSummary() {
    if (!activeAccount) return;
    const pending = operationCount();
    const offline =
      !navigator.onLine ||
      [financeStorageMode, taskStorageMode, cropStorageMode, animalStorageMode, milkStorageMode, stockStorageMode, machineStorageMode].some(
        (mode) => mode === "offline",
      );
    const financeReady = financeStorageMode === "supabase";
    const tasksReady = taskStorageMode === "supabase";
    const cropsReady = cropStorageMode === "supabase";
    const animalsReady = animalStorageMode === "supabase";
    const milkReady = milkStorageMode === "supabase";
    const stockReady = stockStorageMode === "supabase";
    const machinesReady = machineStorageMode === "supabase";
    let sidebar = "Conectando os dados da propriedade...";
    let banner = "<strong>Acesso protegido pelo Supabase.</strong> Sincronizando os dados da propriedade.";

    if (offlineSyncing) {
      sidebar = "Enviando as alterações pendentes...";
      banner = "<strong>Sincronizando com o Supabase.</…45891 tokens truncated…ustomValidity("");
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
    persistOfflineSnapshot();
    closeDialogs();
    showView("plantacoes");
    showToast(
      cropStorageMode === "offline"
        ? "Plantação salva neste aparelho. Será enviada quando a internet voltar."
        : result === "updated"
        ? "Plantação atualizada com sucesso."
        : "Plantação cadastrada com sucesso.",
    );
  }

  async function handleAnimalSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const categoryInput = form.elements.category;
    const statusDateInput = form.elements.statusDate;
    categoryInput.setCustomValidity("");
    statusDateInput.setCustomValidity("");
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const species = String(data.get("species")).trim();
    const category = String(data.get("category") || "");
    const status = String(data.get("status") || "active");
    const statusDate = String(data.get("statusDate") || "");
    if (isCattleSpecies(species) && !category) {
      categoryInput.setCustomValidity("Selecione a categoria deste gado.");
      categoryInput.reportValidity();
      return;
    }
    if (status !== "active" && !statusDate) {
      statusDateInput.setCustomValidity("Informe a data da venda ou morte.");
      statusDateInput.reportValidity();
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    const result = await saveAnimalToSupabase({
      name: String(data.get("name")).trim(),
      species,
      category: isCattleSpecies(species) ? category : "",
      breed: String(data.get("breed")).trim(),
      birthDate: data.get("birthDate"),
      weight: Number(data.get("weight")),
      vaccines: String(data.get("vaccines")).trim(),
      nextVaccine: data.get("nextVaccine"),
      health: String(data.get("health")).trim(),
      status,
      statusDate: status === "active" ? "" : statusDate,
    });
    submit.disabled = false;
    if (!result) return;
    renderAll();
    persistOfflineSnapshot();
    closeDialogs();
    showView("animais");
    showToast(
      animalStorageMode === "offline"
        ? "Animal salvo neste aparelho. Será enviado quando a internet voltar."
        : result === "updated"
          ? "Animal atualizado com sucesso."
          : "Animal cadastrado com sucesso.",
    );
  }

  async function handleMilkSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const discardedInput = form.elements.discardedLiters;
    discardedInput.setCustomValidity("");
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const liters = Number(data.get("liters"));
    const discardedLiters = Number(data.get("discardedLiters") || 0);
    if (discardedLiters > liters) {
      discardedInput.setCustomValidity("O descarte não pode ser maior que a produção.");
      discardedInput.reportValidity();
      return;
    }
    const animalId = String(data.get("animalId") || "");
    const animal = state.animals.find((item) => item.id === animalId);
    if (!animal) {
      showToast("Selecione uma vaca cadastrada nesta propriedade.");
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    const recordDate = String(data.get("date"));
    const result = await saveMilkToSupabase({
      animalId,
      animalName: animal.name,
      date: recordDate,
      shift: String(data.get("shift")),
      liters,
      discardedLiters,
      notes: String(data.get("notes") || "").trim(),
    });
    submit.disabled = false;
    if (!result) return;
    elements.milkDateFilter.value = recordDate;
    renderAll();
    persistOfflineSnapshot();
    closeDialogs();
    showView("leite");
    showToast(
      milkStorageMode === "offline"
        ? "Produção salva neste aparelho. Será enviada quando a internet voltar."
        : result === "updated"
          ? "Produção de leite atualizada."
          : "Produção de leite registrada com sucesso.",
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
    if (
      activeAccount?.farmId &&
      canManageStock() &&
      (!navigator.onLine || stockStorageMode === "offline")
    ) {
      return saveOfflineRecord("stock", values);
    }
    if (!client || !activeAccount?.farmId || stockStorageMode !== "supabase" || !canManageStock()) {
      showToast("Sua conta não pode alterar o estoque neste momento.");
      return null;
    }
    const columns = "id, name, category, quantity, unit, minimum_quantity, storage_location, created_at, updated_at";
    const databaseValues = stockToDatabase(values);
    const isEditing = editingRecord?.type === "stock";
    const recordId = isEditing
      ? editingRecord.id
      : window.ruralOffline?.createOperationId?.();
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
            .insert({ id: recordId, ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar o item do estoque.", error);
      if (isConnectionFailure(error)) {
        return keepRecordAfterConnectionFailure("stock", values, recordId, isEditing);
      }
      showToast("Não foi possível acessar o Supabase. O estoque não foi alterado.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar o item do estoque.", result.error);
      if (isConnectionFailure(result.error)) {
        return keepRecordAfterConnectionFailure("stock", values, recordId, isEditing);
      }
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
    persistOfflineSnapshot();
    closeDialogs();
    showView("estoque");
    showToast(
      stockStorageMode === "offline"
        ? "Item salvo neste aparelho. Será enviado quando a internet voltar."
        : result === "updated"
          ? "Item do estoque atualizado."
          : "Item adicionado ao estoque.",
    );
  }

  async function saveMachineToSupabase(values) {
    const client = window.ruralSupabase;
    if (
      activeAccount?.farmId &&
      canManageMachines() &&
      (!navigator.onLine || machineStorageMode === "offline")
    ) {
      return saveOfflineRecord("machine", values);
    }
    if (!client || !activeAccount?.farmId || machineStorageMode !== "supabase" || !canManageMachines()) {
      showToast("Sua conta não pode alterar máquinas neste momento.");
      return null;
    }
    const columns = "id, name, machine_type, brand, model, manufacture_year, work_hours, fuel_consumption_liters, last_maintenance, next_maintenance, repair_cost, status, created_at, updated_at";
    const databaseValues = machineToDatabase(values);
    const isEditing = editingRecord?.type === "machine";
    const recordId = isEditing
      ? editingRecord.id
      : window.ruralOffline?.createOperationId?.();
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
            .insert({ id: recordId, ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar a máquina.", error);
      if (isConnectionFailure(error)) {
        return keepRecordAfterConnectionFailure("machine", values, recordId, isEditing);
      }
      showToast("Não foi possível acessar o Supabase. A máquina não foi alterada.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar a máquina.", result.error);
      if (isConnectionFailure(result.error)) {
        return keepRecordAfterConnectionFailure("machine", values, recordId, isEditing);
      }
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
    persistOfflineSnapshot();
    closeDialogs();
    showView("maquinas");
    showToast(
      machineStorageMode === "offline"
        ? "Máquina salva neste aparelho. Será enviada quando a internet voltar."
        : result === "updated"
        ? "Máquina ou equipamento atualizado com sucesso."
        : "Máquina ou equipamento cadastrado com sucesso.",
    );
  }

  function openStockMovement(id) {
    if (!storageReady(stockStorageMode) || !activeAccount?.farmId) {
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

    if (!navigator.onLine || stockStorageMode === "offline") {
      const operation = window.ruralOffline?.enqueue?.(activeAccount, {
        entity: "stock",
        action: "movement",
        recordId: item.id,
        values: {
          movement_type: type,
          quantity: amount,
          occurred_on: isoDate(new Date()),
          notes: null,
        },
      });
      if (!operation) {
        showToast("Não foi possível guardar esta movimentação no aparelho.");
        return;
      }
      item.quantity = Number(item.quantity) + (type === "entrada" ? amount : -amount);
      item.updatedAt = isoDate(new Date());
      persistOfflineSnapshot();
      updateStorageSummary();
      renderAll();
      closeDialogs();
      showView("estoque");
      showToast("Movimentação salva neste aparelho. Será enviada quando a internet voltar.");
      stockMovementItemId = null;
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
    persistOfflineSnapshot();
    renderAll();
    closeDialogs();
    showView("estoque");
    showToast(type === "entrada" ? "Entrada registrada no estoque." : "Saída registrada no estoque.");
    stockMovementItemId = null;
  }

  function openMachineActivity(id) {
    if (!storageReady(machineStorageMode) || !activeAccount?.farmId) {
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

    if (!navigator.onLine || machineStorageMode === "offline") {
      const operation = window.ruralOffline?.enqueue?.(activeAccount, {
        entity: "machine",
        action: "activity",
        recordId: machine.id,
        values: {
          activity_type: activityType,
          occurred_on: activityDate,
          added_hours: addedHours,
          fuel_liters: addedFuel,
          cost: addedCost,
          next_maintenance: nextMaintenance || null,
          status_after: MACHINE_STATUS_TO_DATABASE[data.get("status")] || "disponivel",
          notes: String(data.get("note") || "").trim() || null,
        },
      });
      if (!operation) {
        showToast("Não foi possível guardar esta atividade no aparelho.");
        return;
      }
      machine.hours = Number(machine.hours || 0) + addedHours;
      machine.fuelConsumption = Number(machine.fuelConsumption || 0) + addedFuel;
      machine.repairCost = Number(machine.repairCost || 0) + addedCost;
      if (activityType === "manutencao") machine.lastMaintenance = activityDate;
      if (nextMaintenance) machine.nextMaintenance = nextMaintenance;
      machine.status = data.get("status");
      machine.updatedAt = isoDate(new Date());
      machine.history.unshift({
        id: operation.id,
        type: activityType,
        date: activityDate,
        hours: addedHours,
        fuel: addedFuel,
        cost: addedCost,
        note: String(data.get("note") || "").trim(),
      });
      machine.history = machine.history.slice(0, 20);
      persistOfflineSnapshot();
      updateStorageSummary();
      renderAll();
      closeDialogs();
      showView("maquinas");
      showToast("Atividade salva neste aparelho. Será enviada quando a internet voltar.");
      machineActivityItemId = null;
      return;
    }
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

    persistOfflineSnapshot();
    renderAll();
    closeDialogs();
    showView("maquinas");
    showToast(activityType === "manutencao" ? "Manutenção registrada e alertas atualizados." : "Uso do equipamento atualizado.");
    machineActivityItemId = null;
  }

  async function toggleTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    if (!storageReady(taskStorageMode) || !activeAccount?.farmId) {
      showToast("As ordens ainda não estão conectadas. Tente novamente em instantes.");
      return;
    }
    if (!canCurrentUserToggleTask(task)) {
      showToast("Somente o responsável ou o dono pode alterar esta ordem.");
      return;
    }
    const nextCompleted = !task.completed;
    if (!navigator.onLine || taskStorageMode === "offline") {
      task.completed = nextCompleted;
      task.completedAt = nextCompleted ? new Date().toISOString() : null;
      task.status = nextCompleted ? "concluida" : "aberta";
      task.startedAt = nextCompleted ? task.startedAt || task.completedAt : null;
      task.completedBy = nextCompleted ? activeAccount.userId : null;
      window.ruralOffline?.enqueue?.(activeAccount, {
        entity: "task",
        action: "completion",
        recordId: task.id,
        values: { completed: nextCompleted },
      });
      persistOfflineSnapshot();
      updateStorageSummary();
      renderAll();
      showToast(
        nextCompleted
          ? "Conclusão salva neste aparelho. Será enviada quando a internet voltar."
          : "Reabertura salva neste aparelho. Será enviada quando a internet voltar.",
      );
      return;
    }
    let result;
    try {
      result = await window.ruralSupabase.rpc("set_task_completion", {
        p_task_id: task.id,
        p_completed: nextCompleted,
      });
    } catch (error) {
      console.error("Falha de conexão ao atualizar a ordem.", error);
      showToast("Não foi possível acessar o Supabase. A ordem não foi alterada.");
      return;
    }
    const saved = result.data?.[0];
    if (result.error || !saved) {
      console.error("Falha ao atualizar a ordem.", result.error);
      showToast(result.error?.message || "Não foi possível atualizar a ordem.");
      return;
    }
    task.completed = Boolean(saved.task_completed);
    task.completedAt = saved.task_completed_at;
    task.status = task.completed ? "concluida" : "aberta";
    task.startedAt = task.completed ? task.startedAt || task.completedAt : null;
    task.completedBy = task.completed ? activeAccount.userId : null;
    persistOfflineSnapshot();
    renderAll();
    showToast(task.completed ? "Tarefa marcada como concluída." : "Tarefa reaberta.");
  }

  function requestDelete(type, id) {
    pendingDelete = { type, id };
    elements.deleteDialog.showModal();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const offlineDeleteModes = {
      transaction: financeStorageMode,
      task: taskStorageMode,
      crop: cropStorageMode,
      animal: animalStorageMode,
      milk: milkStorageMode,
      stock: stockStorageMode,
      machine: machineStorageMode,
    };
    const offlineDeleteMode = offlineDeleteModes[pendingDelete.type];
    if (
      offlineDeleteMode &&
      (!navigator.onLine || offlineDeleteMode === "offline")
    ) {
      if (activeAccount?.role !== "owner") {
        showToast("Somente o dono pode excluir registros da propriedade.");
        return;
      }
      const deletingType = pendingDelete.type;
      if (deleteOfflineRecord(deletingType, pendingDelete.id)) {
        renderAll();
        elements.deleteDialog.close();
        pendingDelete = null;
        showToast("Exclusão salva neste aparelho. Será enviada quando a internet voltar.");
      }
      return;
    }
    if (pendingDelete.type === "animal-health") {
      if (!navigator.onLine) {
        showToast("O prontuário pode ser consultado offline, mas esta exclusão precisa de internet.");
        return;
      }
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
      persistOfflineSnapshot();
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
        showToast("Somente o dono pode excluir ordens de serviço.");
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
        console.error("Falha de conexão ao excluir a ordem.", error);
        showToast("Não foi possível acessar o Supabase. A ordem foi mantida.");
        elements.confirmDelete.disabled = false;
        return;
      }
      elements.confirmDelete.disabled = false;
      if (deleteResult.error || !deleteResult.data) {
        console.error("Falha ao excluir a ordem.", deleteResult.error);
        showToast("Não foi possível excluir a ordem do Supabase.");
        return;
      }
      state.tasks = state.tasks.filter((task) => task.id !== deletingId);
      persistOfflineSnapshot();
      renderAll();
      showToast("Tarefa excluída da agenda compartilhada.");
      pendingDelete = null;
      elements.deleteDialog.close();
      return;
    }
    if (pendingDelete.type === "milk") {
      if (
        milkStorageMode !== "supabase" ||
        !activeAccount?.farmId ||
        activeAccount.role !== "owner"
      ) {
        showToast("Somente o dono pode excluir registros de produção de leite.");
        return;
      }
      elements.confirmDelete.disabled = true;
      const deletingId = pendingDelete.id;
      let deleteResult;
      try {
        deleteResult = await window.ruralSupabase
          .from("milk_production_records")
          .delete()
          .eq("id", deletingId)
          .eq("farm_id", activeAccount.farmId)
          .select("id")
          .maybeSingle();
      } catch (error) {
        console.error("Falha de conexão ao excluir a produção de leite.", error);
        showToast("Não foi possível acessar o Supabase. O registro foi mantido.");
        elements.confirmDelete.disabled = false;
        return;
      }
      elements.confirmDelete.disabled = false;
      if (deleteResult.error || !deleteResult.data) {
        console.error("Falha ao excluir a produção de leite.", deleteResult.error);
        showToast("Não foi possível excluir a produção de leite do Supabase.");
        return;
      }
      state.milkProduction = state.milkProduction.filter(
        (record) => record.id !== deletingId,
      );
      persistOfflineSnapshot();
      renderAll();
      showToast("Registro de produção de leite excluído.");
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
      persistOfflineSnapshot();
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
      persistOfflineSnapshot();
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
  elements.taskUpdateForm?.addEventListener("submit", handleTaskUpdateSubmit);
  elements.cropForm.addEventListener("submit", handleCropSubmit);
  elements.animalForm.addEventListener("submit", handleAnimalSubmit);
  elements.milkForm.addEventListener("submit", handleMilkSubmit);
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
  elements.animalCategoryFilter.addEventListener("change", renderAnimals);
  elements.animalStatusFilter.addEventListener("change", renderAnimals);
  elements.animalForm.elements.status.addEventListener("change", updateAnimalStatusFields);
  elements.milkDateFilter.addEventListener("change", renderMilk);
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
  elements.historyRefresh?.addEventListener("click", () => loadActivityHistory());
  elements.historyList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-delete]");
    if (button && elements.historyList.contains(button)) {
      deleteHistoryEntry(button.dataset.historyDelete);
    }
  });
  elements.historyModuleFilter?.addEventListener("change", () => loadActivityHistory());
  elements.historyActionFilter?.addEventListener("change", () => loadActivityHistory());
  elements.historyLoadMore?.addEventListener("click", () => {
    loadActivityHistory({ append: true });
  });
  elements.messageRefresh?.addEventListener("click", loadContactMessages);
  elements.messageStatusFilter?.addEventListener("change", renderContactMessages);
  elements.notificationButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    setNotificationPanel(elements.notificationPanel.hidden);
  });
  elements.notificationMarkAll?.addEventListener("click", markAllNotificationsRead);
  elements.pushEnableButton?.addEventListener("click", togglePushNotifications);
  elements.pwaInstallButton?.addEventListener("click", installPwa);
  elements.offlineSyncButton?.addEventListener("click", async () => {
    const synchronized = await synchronizeOfflineChanges();
    if (synchronized && navigator.onLine && activeAccount && !accountConnecting) {
      await connectAccount({ ...activeAccount, offlineAccess: false });
    }
  });

  elements.resetDemo.addEventListener("click", () => {
    if (!window.confirm("Restaurar todos os dados de demonstração?")) return;
    const syncedTransactions = state.transactions;
    const syncedTasks = state.tasks;
    const syncedCrops = state.crops;
    const syncedAnimals = state.animals;
    const syncedMilkProduction = state.milkProduction;
    const syncedStock = state.inventory;
    const syncedMachines = state.machines;
    const restoredState = seedState();
    localTransactionBackup = restoredState.transactions.map((item) => ({ ...item }));
    localTaskBackup = restoredState.tasks.map((item) => ({ ...item }));
    localCropBackup = restoredState.crops.map((item) => ({ ...item }));
    localAnimalBackup = restoredState.animals.map((item) => ({ ...item }));
    localMilkBackup = restoredState.milkProduction.map((item) => ({ ...item }));
    localStockBackup = restoredState.inventory.map((item) => ({ ...item }));
    localMachineBackup = restoredState.machines.map((item) => ({
      ...item,
      history: Array.isArray(item.history) ? item.history.map((record) => ({ ...record })) : [],
    }));
    if (financeStorageMode !== "local") restoredState.transactions = syncedTransactions;
    if (taskStorageMode !== "local") restoredState.tasks = syncedTasks;
    if (cropStorageMode !== "local") restoredState.crops = syncedCrops;
    if (animalStorageMode !== "local") restoredState.animals = syncedAnimals;
    if (milkStorageMode !== "local") restoredState.milkProduction = syncedMilkProduction;
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

    const taskDetailsButton = event.target.closest("[data-task-details]");
    if (taskDetailsButton) openTaskDetails(taskDetailsButton.dataset.taskDetails);

    const taskStatusButton = event.target.closest("[data-task-status]");
    if (taskStatusButton) updateTaskStatus(taskStatusButton.dataset.taskStatus);

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
      if (dialog === elements.taskDetailsDialog) {
        activeTaskDetailsId = null;
        taskUpdates = [];
        taskDetailsLoading = false;
        elements.taskUpdateForm?.reset();
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

  window.addEventListener("offline", () => {
    persistOfflineSnapshot();
    setOfflineModules();
    showToast("Sem internet. O trabalho continuará salvo neste aparelho.");
    refreshTaskDetails();
  });

  window.addEventListener("online", () => {
    if (!activeAccount) return;
    showToast("Internet disponível. Sincronizando as alterações pendentes...");
    refreshTaskDetails();
    window.setTimeout(() => {
      if (accountConnecting) return;
      connectAccount({ ...activeAccount, offlineAccess: false }).catch((error) => {
        accountConnecting = false;
        console.error("Não foi possível retomar a sincronização.", error);
        setOfflineModules();
      });
    }, 400);
  });

  window.addEventListener("rural:pwa-installable", updateInstallButton);
  window.addEventListener("rural:pwa-installed", updateInstallButton);
  window.addEventListener("rural:pwa-error", () => {
    setPushStatus("error", "Não foi possível preparar o aplicativo neste navegador.");
  });
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type !== "OPEN_TASK" || !event.data.taskId) return;
    pendingPushNavigation = {
      taskId: String(event.data.taskId),
      notificationId: String(event.data.notificationId || ""),
    };
    if (activeAccount) handlePendingPushNavigation();
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
      accountConnecting = false;
      setFinanceStatus("error", "Sincronização indisponível");
      showToast("Não foi possível iniciar a sincronização financeira.");
    });
  });
  window.addEventListener("rural:farm-location-updated", (event) => {
    if (!activeAccount || event.detail?.farmId !== activeAccount.farmId) return;
    activeAccount.locationLatitude = event.detail.latitude;
    activeAccount.locationLongitude = event.detail.longitude;
    useFarmWeatherLocation(activeAccount, true);
    saveState();
    persistOfflineSnapshot();
  });

  elements.todayLabel.textContent = longDate.format(new Date());
  elements.weatherSearchInput.value = weatherLocationName();
  updateInstallButton();
  renderAll();
  showView(window.location.hash.slice(1), false);
  if (window.ruralAccount) {
    connectAccount(window.ruralAccount).catch(() => {
      accountConnecting = false;
      setFinanceStatus("error", "Sincronização indisponível");
      showToast("Não foi possível iniciar a sincronização financeira.");
    });
  }
})();
