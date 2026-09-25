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
      banner = "<strong>Sincronizando com o Supabase.</strong> Mantenha o aplicativo aberto por alguns instantes.";
    } else if (offline) {
      sidebar = pending
        ? `${pending} ${pending === 1 ? "alteração pendente" : "alterações pendentes"} neste aparelho.`
        : "Modo offline ativo; dados disponíveis neste aparelho.";
      banner = pending
        ? `<strong>Sem internet.</strong> Você pode continuar trabalhando; ${pending} ${pending === 1 ? "alteração será enviada" : "alterações serão enviadas"} quando o sinal voltar.`
        : "<strong>Sem internet.</strong> Os últimos dados sincronizados continuam disponíveis neste aparelho.";
    } else if (pending) {
      sidebar = `${pending} ${pending === 1 ? "alteração aguardando envio" : "alterações aguardando envio"}.`;
      banner = `<strong>Conexão disponível.</strong> Existem ${pending} ${pending === 1 ? "alteração pendente" : "alterações pendentes"} para sincronizar.`;
    }

    if (!offlineSyncing && !offline && !pending &&
      activeAccount.role === "owner" &&
      financeReady &&
      tasksReady &&
      cropsReady &&
      animalsReady &&
      milkReady &&
      stockReady &&
      machinesReady
    ) {
      sidebar = "Sincronizado e pronto para uso offline.";
      banner = "<strong>Dados da fazenda sincronizados com segurança.</strong> Este aparelho já pode ser usado no campo mesmo sem internet.";
    } else if (!offlineSyncing && !offline && !pending && activeAccount.role === "owner" && financeReady) {
      sidebar = "Financeiro no Supabase; conectando as Ordens de Serviço.";
      banner = "<strong>Financeiro sincronizado com o Supabase.</strong> As Ordens de Serviço estão sendo conectadas.";
    } else if (!offlineSyncing && !offline && !pending && tasksReady && cropsReady && animalsReady && milkReady && stockReady && machinesReady) {
      sidebar = "Sincronizado e pronto para uso offline.";
      banner = "<strong>Dados da propriedade sincronizados.</strong> Este aparelho já pode ser usado sem internet, respeitando as permissões do seu cargo.";
    }

    if (elements.storageStatusSidebar) elements.storageStatusSidebar.textContent = sidebar;
    if (elements.storageStatusCopy) elements.storageStatusCopy.innerHTML = banner;
    if (elements.offlineBanner) {
      elements.offlineBanner.dataset.state = offlineSyncing
        ? "syncing"
        : offline
          ? "offline"
          : pending
            ? "pending"
            : "online";
    }
    if (elements.offlineStatusIcon) {
      elements.offlineStatusIcon.textContent = offlineSyncing ? "↻" : offline ? "⌁" : pending ? "↑" : "✓";
    }
    if (elements.offlinePendingCount) {
      elements.offlinePendingCount.hidden = pending === 0;
      elements.offlinePendingCount.textContent = `${pending} ${pending === 1 ? "pendente" : "pendentes"}`;
    }
    if (elements.offlineSyncButton) {
      elements.offlineSyncButton.hidden = pending === 0 || offlineSyncing;
      elements.offlineSyncButton.disabled = !navigator.onLine || offlineSyncing;
    }
  }

  function taskFromDatabase(row) {
    const status = row.status || (row.completed ? "concluida" : "aberta");
    return {
      id: row.id,
      title: row.title,
      date: row.due_date,
      category: row.category,
      priority: row.priority,
      responsible: row.responsible_name || "Toda a equipe",
      assignedTo: row.assigned_to || "",
      instructions: row.notes || "",
      status,
      completed: status === "concluida" || Boolean(row.completed),
      startedAt: row.started_at || null,
      completedAt: row.completed_at,
      completedBy: row.completed_by || null,
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
      notes: task.instructions || null,
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
      category: row.cattle_category || "",
      breed: row.breed || "",
      birthDate: row.birth_date || "",
      weight: Number(row.weight_kg || 0),
      vaccines: row.applied_vaccines || "",
      nextVaccine: row.next_vaccination || "",
      health: row.health_notes || "",
      status: row.active === false ? row.inactive_reason || "sold" : "active",
      statusDate: row.inactive_on || "",
    };
  }

  function animalToDatabase(animal) {
    const status = animal.status || "active";
    const active = status === "active";
    return {
      identifier: animal.name,
      species: animal.species,
      cattle_category: animal.category || null,
      breed: animal.breed || null,
      birth_date: animal.birthDate || null,
      weight_kg: animal.weight || null,
      applied_vaccines: animal.vaccines || null,
      next_vaccination: animal.nextVaccine || null,
      health_notes: animal.health || null,
      active,
      inactive_reason: active ? null : status,
      inactive_on: active ? null : animal.statusDate || null,
    };
  }

  const ANIMAL_DATABASE_COLUMNS =
    "id, identifier, species, cattle_category, breed, birth_date, weight_kg, applied_vaccines, next_vaccination, health_notes, active, inactive_reason, inactive_on";

  function isCattleSpecies(species) {
    const value = normalize(species);
    return value.includes("bovin") || value.includes("gado") || value.includes("vaca");
  }

  function cattleCategoryLabel(category, species = "") {
    return CATTLE_CATEGORY_LABELS[category] ||
      (isCattleSpecies(species) ? "Não informada" : "Não se aplica");
  }

  function animalStatusLabel(status) {
    return ANIMAL_STATUS_LABELS[status] || "Ativo";
  }

  function milkFromDatabase(row) {
    const relatedAnimal = Array.isArray(row.animals) ? row.animals[0] : row.animals;
    const localAnimal = state.animals.find((animal) => animal.id === row.animal_id);
    return {
      id: row.id,
      animalId: row.animal_id,
      animalName: relatedAnimal?.identifier || localAnimal?.name || "Vaca não encontrada",
      date: row.production_date,
      shift: row.shift,
      liters: Number(row.liters || 0),
      discardedLiters: Number(row.discarded_liters || 0),
      notes: row.notes || "",
      createdBy: row.created_by || "",
      createdAt: row.created_at || "",
    };
  }

  function milkToDatabase(record) {
    return {
      animal_id: record.animalId,
      production_date: record.date,
      shift: record.shift,
      liters: record.liters,
      discarded_liters: record.discardedLiters || 0,
      notes: record.notes || null,
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

  const OFFLINE_ENTITY_CONFIG = {
    transaction: {
      collection: "transactions",
      table: "transactions",
      columns: "id, transaction_type, occurred_on, description, category, amount",
      toDatabase: transactionToDatabase,
      fromDatabase: transactionFromDatabase,
    },
    task: {
      collection: "tasks",
      table: "tasks",
      columns: "id, title, due_date, category, priority, responsible_name, assigned_to, notes, status, completed, started_at, completed_at, completed_by",
      toDatabase: taskToDatabase,
      fromDatabase: taskFromDatabase,
    },
    crop: {
      collection: "crops",
      table: "crops",
      columns: "id, name, area_hectares, planting_date, planned_harvest_date, harvested_on, harvested_quantity, production_cost, status",
      toDatabase: cropToDatabase,
      fromDatabase: cropFromDatabase,
    },
    animal: {
      collection: "animals",
      table: "animals",
      columns: ANIMAL_DATABASE_COLUMNS,
      toDatabase: animalToDatabase,
      fromDatabase: animalFromDatabase,
    },
    milk: {
      collection: "milkProduction",
      table: "milk_production_records",
      columns: "id, animal_id, production_date, shift, liters, discarded_liters, notes, created_by, created_at, updated_at, animals(identifier)",
      toDatabase: milkToDatabase,
      fromDatabase: milkFromDatabase,
    },
    stock: {
      collection: "inventory",
      table: "inventory_items",
      columns: "id, name, category, quantity, unit, minimum_quantity, storage_location, created_at, updated_at",
      toDatabase: stockToDatabase,
      fromDatabase: stockFromDatabase,
    },
    machine: {
      collection: "machines",
      table: "machines",
      columns: "id, name, machine_type, brand, model, manufacture_year, work_hours, fuel_consumption_liters, last_maintenance, next_maintenance, repair_cost, status, created_at, updated_at",
      toDatabase: machineToDatabase,
      fromDatabase: (row) => machineFromDatabase({ ...row, machine_records: [] }),
    },
  };

  function saveOfflineRecord(entity, values, options = {}) {
    const config = OFFLINE_ENTITY_CONFIG[entity];
    if (!config || !activeAccount) return null;
    const isEditing =
      typeof options.isEditing === "boolean"
        ? options.isEditing
        : editingRecord?.type === entity;
    let recordId = options.recordId || "";

    if (isEditing) {
      recordId ||= editingRecord?.id || "";
      const index = state[config.collection].findIndex((item) => item.id === recordId);
      if (index < 0) return null;
      state[config.collection][index] = { ...state[config.collection][index], ...values };
    } else {
      recordId ||= window.ruralOffline?.createOperationId?.();
      if (!recordId) return null;
      const record = { id: recordId, ...values };
      if (entity === "task") {
        record.completed = false;
        record.completedAt = null;
        record.status = "aberta";
        record.startedAt = null;
        record.completedBy = null;
      }
      if (entity === "machine") record.history = [];
      state[config.collection].push(record);
    }

    const savedRecord = state[config.collection].find((item) => item.id === recordId);
    window.ruralOffline?.enqueue?.(activeAccount, {
      entity,
      action: isEditing ? "update" : "create",
      recordId,
      values: savedRecord,
    });
    persistOfflineSnapshot();
    updateStorageSummary();
    return isEditing ? "updated" : "created";
  }

  function deleteOfflineRecord(entity, recordId) {
    const config = OFFLINE_ENTITY_CONFIG[entity];
    if (!config || !activeAccount?.farmId) return false;
    state[config.collection] = state[config.collection].filter((item) => item.id !== recordId);
    window.ruralOffline?.enqueue?.(activeAccount, {
      entity,
      action: "delete",
      recordId,
    });
    persistOfflineSnapshot();
    updateStorageSummary();
    return true;
  }

  function replaceSyncedRecord(entity, row) {
    const config = OFFLINE_ENTITY_CONFIG[entity];
    if (!config || !row) return;
    const record = config.fromDatabase(row);
    const index = state[config.collection].findIndex((item) => item.id === record.id);
    if (entity === "machine" && index >= 0) {
      record.history = state[config.collection][index].history || [];
    }
    if (index >= 0) state[config.collection][index] = record;
    else state[config.collection].push(record);
  }

  async function syncOfflineCrud(operation) {
    const client = window.ruralSupabase;
    const config = OFFLINE_ENTITY_CONFIG[operation.entity];
    if (!client || !config) throw new Error("Operação offline não reconhecida.");

    if (operation.action === "delete") {
      const result = await client
        .from(config.table)
        .delete()
        .eq("id", operation.recordId)
        .eq("farm_id", activeAccount.farmId)
        .select("id")
        .maybeSingle();
      if (result.error) throw result.error;
      return;
    }

    const databaseValues = config.toDatabase(operation.values);
    if (operation.entity === "task" && operation.action === "create") {
      databaseValues.completed = Boolean(operation.values.completed);
      databaseValues.completed_at = operation.values.completedAt || null;
    }
    let result;
    if (operation.action === "create") {
      result = await client
        .from(config.table)
        .insert({
          id: operation.recordId,
          ...databaseValues,
          farm_id: activeAccount.farmId,
        })
        .select(config.columns)
        .single();
      if (result.error?.code === "23505") {
        result = await client
          .from(config.table)
          .select(config.columns)
          .eq("id", operation.recordId)
          .eq("farm_id", activeAccount.farmId)
          .single();
      }
    } else {
      result = await client
        .from(config.table)
        .update({ ...databaseValues, updated_at: new Date().toISOString() })
        .eq("id", operation.recordId)
        .eq("farm_id", activeAccount.farmId)
        .select(config.columns)
        .single();
    }
    if (result.error || !result.data) throw result.error || new Error("Registro não encontrado.");
    replaceSyncedRecord(operation.entity, result.data);
  }

  async function syncOfflineAction(operation) {
    const { data, error } = await window.ruralSupabase.rpc("apply_offline_action", {
      p_operation_id: operation.id,
      p_farm_id: activeAccount.farmId,
      p_action:
        operation.action === "completion"
          ? "task_completion"
          : operation.action === "movement"
            ? "inventory_movement"
            : "machine_activity",
      p_record_id: operation.recordId,
      p_payload: operation.values,
    });
    if (error || !data) throw error || new Error("A atualização não retornou resultado.");

    if (operation.action === "completion") {
      const task = state.tasks.find((item) => item.id === operation.recordId);
      if (task) {
        task.completed = Boolean(data.task_completed);
        task.completedAt = data.task_completed_at || null;
        task.status = task.completed ? "concluida" : "aberta";
        task.startedAt = task.completed ? task.startedAt || task.completedAt : null;
        task.completedBy = task.completed ? activeAccount?.userId || null : null;
      }
    } else if (operation.action === "movement") {
      const item = state.inventory.find((record) => record.id === operation.recordId);
      if (item) {
        item.quantity = Number(data.new_quantity || 0);
        item.updatedAt = String(data.item_updated_at || "").slice(0, 10);
      }
    } else if (operation.action === "activity") {
      const machine = state.machines.find((record) => record.id === operation.recordId);
      if (machine) {
        machine.hours = Number(data.machine_work_hours || 0);
        machine.fuelConsumption = Number(data.machine_fuel_liters || 0);
        machine.repairCost = Number(data.machine_repair_cost || 0);
        machine.lastMaintenance = data.machine_last_maintenance || "";
        machine.nextMaintenance = data.machine_next_maintenance || "";
        machine.status = MACHINE_STATUS_FROM_DATABASE[data.machine_status] || "Disponível";
        machine.updatedAt = String(data.machine_updated_at || "").slice(0, 10);
        const history = machine.history.find((record) => record.id === operation.id);
        if (history) history.id = data.record_id;
      }
    }
  }

  async function synchronizeOfflineChanges({ quiet = false } = {}) {
    if (offlineSyncing || !activeAccount || !navigator.onLine) {
      updateStorageSummary();
      return false;
    }
    const queue = window.ruralOffline?.getQueue?.(activeAccount) || [];
    if (!queue.length) return true;
    offlineSyncing = true;
    updateStorageSummary();
    let synchronized = 0;
    try {
      const userResult = await window.ruralSupabase.auth.getUser();
      if (userResult.error || userResult.data?.user?.id !== activeAccount.userId) {
        throw userResult.error || new Error("A sessão mudou neste aparelho.");
      }
      for (const operation of queue) {
        if (!navigator.onLine) break;
        if (["create", "update", "delete"].includes(operation.action)) {
          await syncOfflineCrud(operation);
        } else {
          await syncOfflineAction(operation);
        }
        window.ruralOffline.removeOperation(activeAccount, operation.id);
        synchronized += 1;
        persistOfflineSnapshot();
      }
    } catch (error) {
      console.error("Falha ao sincronizar as alterações offline.", error);
      if (!quiet) {
        showToast(
          navigator.onLine
            ? "Uma alteração não pôde ser sincronizada. Ela continua salva neste aparelho."
            : "A conexão caiu. As alterações continuam salvas neste aparelho.",
        );
      }
    } finally {
      offlineSyncing = false;
      renderAll();
      persistOfflineSnapshot();
      updateStorageSummary();
    }
    if (synchronized && !operationCount() && !quiet) {
      showToast(`${synchronized} ${synchronized === 1 ? "alteração sincronizada" : "alterações sincronizadas"} com o Supabase.`);
    }
    return operationCount() === 0;
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
    let { data, error } = await client
      .from("crops")
      .select("id, name, area_hectares, planting_date, planned_harvest_date, harvested_on, harvested_quantity, production_cost, status")
      .eq("farm_id", activeAccount.farmId)
      .order("planned_harvest_date", { ascending: true });
    if (error) {
      console.error("Falha ao carregar as plantações.", error);
      setCropStatus(
        offlineSnapshotLoaded ? "offline" : "error",
        offlineSnapshotLoaded ? "Últimos dados salvos" : "Plantações indisponíveis",
      );
      showToast(
        offlineSnapshotLoaded
          ? "Sem conexão com o Supabase. Exibindo as plantações salvas neste aparelho."
          : "Não foi possível carregar as plantações do Supabase.",
      );
      updateStorageSummary();
      return;
    }

    const rows = data || [];
    const localRecords = activeAccount.legacyFarmId === activeAccount.farmId
      ? localCropBackup.filter((record) => !isDemoRecord(record)) : [];
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
    persistOfflineSnapshot();
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
    let { data, error } = await client
      .from("animals")
      .select(ANIMAL_DATABASE_COLUMNS)
      .eq("farm_id", activeAccount.farmId)
      .order("identifier", { ascending: true });
    if (error) {
      console.error("Falha ao carregar os animais.", error);
      setAnimalStatus(
        offlineSnapshotLoaded ? "offline" : "error",
        offlineSnapshotLoaded ? "Últimos dados salvos" : "Animais indisponíveis",
      );
      showToast(
        offlineSnapshotLoaded
          ? "Sem conexão com o Supabase. Exibindo os animais salvos neste aparelho."
          : "Não foi possível carregar os animais do Supabase.",
      );
      updateStorageSummary();
      return;
    }

    const rows = data || [];
    const localRecords = activeAccount.legacyFarmId === activeAccount.farmId
      ? localAnimalBackup.filter((record) => !isDemoRecord(record)) : [];
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
        .select(ANIMAL_DATABASE_COLUMNS);
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
    persistOfflineSnapshot();
    updateStorageSummary();
    renderAll();
  }

  async function loadMilkFromSupabase() {
    const client = window.ruralSupabase;
    if (!client || !activeAccount?.farmId) {
      setMilkStatus("error", "Falha na conexão");
      return;
    }
    setMilkStatus("loading", "Sincronizando produção...");
    let result;
    try {
      result = await client
        .from("milk_production_records")
        .select("id, animal_id, production_date, shift, liters, discarded_liters, notes, created_by, created_at, updated_at, animals(identifier)")
        .eq("farm_id", activeAccount.farmId)
        .order("production_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
    } catch (error) {
      result = { data: null, error };
    }
    if (result.error) {
      console.error("Falha ao carregar a produção de leite.", result.error);
      setMilkStatus(
        offlineSnapshotLoaded ? "offline" : "error",
        offlineSnapshotLoaded ? "Últimos dados salvos" : "Produção indisponível",
      );
      showToast(
        offlineSnapshotLoaded
          ? "Sem conexão com o Supabase. Exibindo a produção salva neste aparelho."
          : "Não foi possível carregar a produção de leite do Supabase.",
      );
      updateStorageSummary();
      return;
    }

    state.milkProduction = (result.data || []).map(milkFromDatabase);
    setMilkStatus("supabase", "Salvo no Supabase");
    saveState();
    persistOfflineSnapshot();
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
    let { data, error } = await client
      .from("inventory_items")
      .select("id, name, category, quantity, unit, minimum_quantity, storage_location, created_at, updated_at")
      .eq("farm_id", activeAccount.farmId)
      .order("name", { ascending: true });
    if (error) {
      console.error("Falha ao carregar o estoque.", error);
      setStockStatus(
        offlineSnapshotLoaded ? "offline" : "error",
        offlineSnapshotLoaded ? "Últimos dados salvos" : "Estoque indisponível",
      );
      showToast(
        offlineSnapshotLoaded
          ? "Sem conexão com o Supabase. Exibindo o estoque salvo neste aparelho."
          : "Não foi possível carregar o estoque do Supabase.",
      );
      updateStorageSummary();
      return;
    }

    const rows = data || [];
    const localRecords = activeAccount.legacyFarmId === activeAccount.farmId
      ? localStockBackup.filter((record) => !isDemoRecord(record)) : [];
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
    persistOfflineSnapshot();
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
    let { data, error } = await client
      .from("machines")
      .select("id, name, machine_type, brand, model, manufacture_year, work_hours, fuel_consumption_liters, last_maintenance, next_maintenance, repair_cost, status, created_at, updated_at, machine_records(id, activity_type, occurred_on, added_hours, fuel_liters, cost, next_maintenance, status_after, notes, created_at)")
      .eq("farm_id", activeAccount.farmId)
      .order("name", { ascending: true });
    if (error) {
      console.error("Falha ao carregar as máquinas.", error);
      setMachineStatus(
        offlineSnapshotLoaded ? "offline" : "error",
        offlineSnapshotLoaded ? "Últimos dados salvos" : "Máquinas indisponíveis",
      );
      showToast(
        offlineSnapshotLoaded
          ? "Sem conexão com o Supabase. Exibindo as máquinas salvas neste aparelho."
          : "Não foi possível carregar as máquinas do Supabase.",
      );
      updateStorageSummary();
      return;
    }

    const rows = data || [];
    const localRecords = activeAccount.legacyFarmId === activeAccount.farmId
      ? localMachineBackup.filter((record) => !isDemoRecord(record)) : [];
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
    persistOfflineSnapshot();
    updateStorageSummary();
    renderAll();
  }

  function canCurrentUserToggleTask(task) {
    return Boolean(
      activeAccount &&
        (activeAccount.role === "owner" || !task.assignedTo || task.assignedTo === activeAccount.userId),
    );
  }

  function taskStatusOf(task) {
    return task?.status || (task?.completed ? "concluida" : "aberta");
  }

  function taskShortCode(task) {
    return `OS-${String(task?.id || "").replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "NOVA"}`;
  }

  function taskMemberName(userId) {
    if (!userId) return "Sistema";
    if (userId === activeAccount?.userId) return activeAccount.fullName || "Você";
    return teamMembers.find((member) => member.userId === userId)?.fullName || "Membro da equipe";
  }

  function setTaskDetailsSync(stateName, message) {
    if (!elements.taskDetailsSync) return;
    elements.taskDetailsSync.dataset.state = stateName;
    elements.taskDetailsSync.textContent = message;
  }

  function refreshTaskDetails() {
    const task = state.tasks.find((item) => item.id === activeTaskDetailsId);
    if (!task || !elements.taskDetailsDialog) return;
    const status = taskStatusOf(task);
    const priority = { alta: "Alta", media: "Média", baixa: "Baixa" }[task.priority] || task.priority;
    elements.taskDetailsCode.textContent = taskShortCode(task);
    elements.taskDetailsTitle.textContent = task.title;
    elements.taskDetailsStatus.textContent = TASK_STATUS_LABELS[status] || status;
    elements.taskDetailsStatus.dataset.status = status;
    elements.taskDetailsResponsible.textContent = task.responsible || "Toda a equipe";
    elements.taskDetailsDate.textContent = formatDate(task.date);
    elements.taskDetailsCategory.textContent = task.category;
    elements.taskDetailsPriority.textContent = priority;
    elements.taskDetailsInstructions.textContent = task.instructions || "Nenhuma instrução adicional.";

    const online = navigator.onLine && taskStorageMode === "supabase";
    const canUpdate = canCurrentUserToggleTask(task);
    const start = elements.taskStatusActions?.querySelector('[data-task-status="em_andamento"]');
    const complete = elements.taskStatusActions?.querySelector('[data-task-status="concluida"]');
    const reopen = elements.taskStatusActions?.querySelector('[data-task-status="aberta"]');
    if (start) {
      start.hidden = status !== "aberta";
      start.disabled = !canUpdate || !online || taskDetailsLoading;
    }
    if (complete) {
      complete.hidden = status === "concluida";
      complete.disabled = !canUpdate || !online || taskDetailsLoading;
    }
    if (reopen) {
      reopen.hidden = status !== "concluida" || activeAccount?.role !== "owner";
      reopen.disabled = !online || taskDetailsLoading;
    }

    if (elements.taskUpdateForm) {
      elements.taskUpdateForm.querySelectorAll("textarea, input, button").forEach((field) => {
        field.disabled = !online || !canUpdate || taskDetailsLoading;
      });
    }
    if (elements.taskUpdateOnlineNote) {
      elements.taskUpdateOnlineNote.hidden = online;
    }
  }

  function renderTaskUpdates() {
    if (!elements.taskUpdatesList || !elements.taskUpdatesEmpty) return;
    elements.taskUpdatesList.replaceChildren(
      ...taskUpdates.map((update) => {
        const item = document.createElement("article");
        item.className = `work-order-update work-order-update-${update.type}`;
        const marker = document.createElement("span");
        marker.className = "work-order-update-marker";
        marker.textContent = update.type === "concluida" ? "✓" : update.type === "reaberta" ? "↺" : "•";
        const content = document.createElement("div");
        const heading = document.createElement("div");
        heading.className = "work-order-update-heading";
        const title = document.createElement("strong");
        title.textContent = TASK_UPDATE_LABELS[update.type] || "Atualização";
        const time = document.createElement("small");
        time.textContent = `${taskMemberName(update.authorId)} · ${teamDateTime(update.createdAt)}`;
        heading.append(title, time);
        content.append(heading);
        if (update.message) {
          const message = document.createElement("p");
          message.textContent = update.message;
          content.append(message);
        }
        if (update.photoUrl) {
          const link = document.createElement("a");
          link.className = "work-order-photo";
          link.href = update.photoUrl;
          link.target = "_blank";
          link.rel = "noopener";
          const photo = document.createElement("img");
          photo.src = update.photoUrl;
          photo.alt = `Comprovação enviada por ${taskMemberName(update.authorId)}`;
          photo.loading = "lazy";
          link.append(photo);
          content.append(link);
        }
        item.append(marker, content);
        return item;
      }),
    );
    elements.taskUpdatesEmpty.hidden = taskUpdates.length > 0;
  }

  async function loadTaskUpdates(taskId) {
    taskUpdates = [];
    renderTaskUpdates();
    if (!navigator.onLine || !window.ruralSupabase || !activeAccount?.farmId) {
      setTaskDetailsSync("offline", "Disponível quando houver internet");
      return;
    }
    setTaskDetailsSync("loading", "Carregando histórico...");
    const { data, error } = await window.ruralSupabase
      .from("task_updates")
      .select("id, update_type, message, photo_path, author_id, created_at")
      .eq("task_id", taskId)
      .eq("farm_id", activeAccount.farmId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Falha ao carregar as atualizações da ordem.", error);
      setTaskDetailsSync("error", "Histórico indisponível");
      return;
    }
    taskUpdates = await Promise.all(
      (data || []).map(async (row) => {
        let photoUrl = "";
        if (row.photo_path) {
          const signed = await window.ruralSupabase.storage
            .from("task-evidence")
            .createSignedUrl(row.photo_path, 60 * 60);
          if (!signed.error) photoUrl = signed.data?.signedUrl || "";
        }
        return {
          id: row.id,
          type: row.update_type,
          message: row.message || "",
          photoPath: row.photo_path || "",
          photoUrl,
          authorId: row.author_id,
          createdAt: row.created_at,
        };
      }),
    );
    renderTaskUpdates();
    setTaskDetailsSync("ready", `${taskUpdates.length} ${taskUpdates.length === 1 ? "atualização" : "atualizações"}`);
  }

  async function openTaskDetails(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task || !elements.taskDetailsDialog) {
      showToast("Não foi possível encontrar esta ordem de serviço.");
      return;
    }
    activeTaskDetailsId = taskId;
    elements.taskUpdateForm?.reset();
    refreshTaskDetails();
    elements.taskDetailsDialog.showModal();
    await loadTaskUpdates(taskId);
  }

  function validateTaskPhoto(file) {
    if (!file || !file.size) return "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return "Envie uma foto JPG, PNG ou WebP.";
    }
    if (file.size > 5 * 1024 * 1024) return "A foto deve ter no máximo 5 MB.";
    return "";
  }

  async function uploadTaskPhoto(file, taskId) {
    if (!file?.size) return "";
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    const fileId = window.ruralOffline?.createOperationId?.() || `${Date.now()}`;
    const path = `${activeAccount.farmId}/${taskId}/${activeAccount.userId}/${fileId}.${extension}`;
    const { error } = await window.ruralSupabase.storage
      .from("task-evidence")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return path;
  }

  async function removeTaskPhoto(path) {
    if (!path || !window.ruralSupabase) return;
    const { error } = await window.ruralSupabase.storage.from("task-evidence").remove([path]);
    if (error) console.error("Não foi possível remover a foto que falhou.", error);
  }

  async function handleTaskUpdateSubmit(event) {
    event.preventDefault();
    const task = state.tasks.find((item) => item.id === activeTaskDetailsId);
    if (!task || !canCurrentUserToggleTask(task) || !navigator.onLine) {
      showToast("Esta atualização precisa de internet e acesso à ordem.");
      return;
    }
    const form = event.currentTarget;
    const message = String(form.elements.message.value || "").trim();
    const file = form.elements.photo.files?.[0];
    const photoError = validateTaskPhoto(file);
    form.elements.photo.setCustomValidity(photoError);
    if (photoError) {
      form.elements.photo.reportValidity();
      return;
    }
    form.elements.message.setCustomValidity(message || file ? "" : "Escreva um comentário ou selecione uma foto.");
    if (!form.reportValidity()) return;

    taskDetailsLoading = true;
    refreshTaskDetails();
    let photoPath = "";
    try {
      photoPath = await uploadTaskPhoto(file, task.id);
      const { error } = await window.ruralSupabase.from("task_updates").insert({
        task_id: task.id,
        farm_id: activeAccount.farmId,
        author_id: activeAccount.userId,
        update_type: "comentario",
        message: message || null,
        photo_path: photoPath || null,
      });
      if (error) throw error;
      form.reset();
      await loadTaskUpdates(task.id);
      showToast("Atualização adicionada à ordem de serviço.");
    } catch (error) {
      console.error("Falha ao adicionar atualização à ordem.", error);
      await removeTaskPhoto(photoPath);
      showToast(error?.code === "42501" ? "Seu cargo não permite atualizar esta ordem." : "Não foi possível enviar a atualização.");
    } finally {
      taskDetailsLoading = false;
      refreshTaskDetails();
    }
  }

  async function updateTaskStatus(status) {
    const task = state.tasks.find((item) => item.id === activeTaskDetailsId);
    if (!task || !canCurrentUserToggleTask(task) || !navigator.onLine) {
      showToast("A alteração de andamento precisa de internet e acesso à ordem.");
      return;
    }
    const form = elements.taskUpdateForm;
    const message = String(form?.elements.message.value || "").trim();
    const file = form?.elements.photo.files?.[0];
    const photoError = validateTaskPhoto(file);
    if (form?.elements.photo) form.elements.photo.setCustomValidity(photoError);
    if (photoError) {
      form.elements.photo.reportValidity();
      return;
    }

    taskDetailsLoading = true;
    refreshTaskDetails();
    let photoPath = "";
    try {
      photoPath = await uploadTaskPhoto(file, task.id);
      const result = await window.ruralSupabase.rpc("set_task_status", {
        p_task_id: task.id,
        p_status: status,
        p_message: message || null,
        p_photo_path: photoPath || null,
      });
      const saved = result.data?.[0];
      if (result.error || !saved) throw result.error || new Error("A ordem não foi atualizada.");
      task.status = saved.task_status;
      task.completed = Boolean(saved.task_completed);
      task.startedAt = saved.task_started_at || null;
      task.completedAt = saved.task_completed_at || null;
      task.completedBy = saved.task_completed_by || null;
      form?.reset();
      persistOfflineSnapshot();
      renderAll();
      refreshTaskDetails();
      await loadTaskUpdates(task.id);
      showToast(
        status === "concluida"
          ? "Ordem de serviço concluída."
          : status === "em_andamento"
            ? "Serviço marcado como em andamento."
            : "Ordem de serviço reaberta.",
      );
    } catch (error) {
      console.error("Falha ao atualizar a situação da ordem.", error);
      await removeTaskPhoto(photoPath);
      showToast(error?.message || "Não foi possível atualizar a ordem de serviço.");
    } finally {
      taskDetailsLoading = false;
      refreshTaskDetails();
    }
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
    const { data, error } = await client
      .from("tasks")
      .select("id, title, due_date, category, priority, responsible_name, assigned_to, notes, status, completed, started_at, completed_at, completed_by")
      .eq("farm_id", activeAccount.farmId)
      .order("due_date", { ascending: true });
    if (error) {
      console.error("Falha ao carregar as ordens de serviço.", error);
      setTaskStatus(
        offlineSnapshotLoaded ? "offline" : "error",
        offlineSnapshotLoaded ? "Últimas ordens salvas" : "Ordens indisponíveis",
      );
      showToast(
        offlineSnapshotLoaded
          ? "Sem conexão com o Supabase. Exibindo as ordens salvas neste aparelho."
          : "Não foi possível carregar as ordens do Supabase.",
      );
      updateStorageSummary();
      return;
    }
    state.tasks = (data || []).map(taskFromDatabase);
    setTaskStatus("supabase", "Ordens compartilhadas");
    persistOfflineSnapshot();
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

      if (member.role === "owner" || activeAccount?.role !== "owner") {
        appendTeamCell(row, createTeamBadge(TEAM_ROLE_LABELS[member.role] || member.role, member.role));
      } else {
        const roleSelect = document.createElement("select");
        roleSelect.className = "team-role-select";
        roleSelect.dataset.teamRole = member.userId;
        [["gerente", "Gerente"], ["vaqueiro", "Vaqueiro"], ["caseiro", "Caseiro"]].forEach(([value, label]) => {
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
      if (member.role !== "owner" && activeAccount?.role === "owner") {
        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = member.status === "active" ? "team-action team-action-danger" : "team-action";
        toggleButton.dataset.teamStatus = member.userId;
        toggleButton.dataset.nextStatus = member.status === "active" ? "inactive" : "active";
        toggleButton.textContent = member.status === "active" ? "Desativar" : "Ativar";
        actions.append(toggleButton);
      } else if (member.role === "owner") {
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
    if (!client || !activeAccount?.farmId || !["owner", "gerente"].includes(activeAccount.role)) return;
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

  function activityFromDatabase(row) {
    return {
      id: String(row.id),
      actorName: row.actor_name || "Sistema",
      actorRole: row.actor_role || "",
      module: row.module,
      action: row.action,
      recordLabel: row.record_label || "Registro",
      changedFields: Array.isArray(row.changed_fields) ? row.changed_fields : [],
      occurredAt: row.occurred_at,
    };
  }

  function setHistoryStatus(stateName, message) {
    if (!elements.historySyncStatus) return;
    elements.historySyncStatus.dataset.state = stateName;
    elements.historySyncStatus.textContent = message;
  }

  function historyFieldLabel(field) {
    return HISTORY_FIELD_LABELS[field] || String(field).replaceAll("_", " ");
  }

  function naturalList(values) {
    if (values.length < 2) return values[0] || "";
    return `${values.slice(0, -1).join(", ")} e ${values.at(-1)}`;
  }

  function updateHistoryControls() {
    const busy = activityHistoryLoading || activityHistoryDeleting;
    [elements.historyRefresh, elements.historyLoadMore,
      elements.historyModuleFilter, elements.historyActionFilter].forEach((control) => {
      if (control) control.disabled = busy;
    });
    elements.historyList?.querySelectorAll("[data-history-delete]").forEach((button) => {
      button.disabled = busy || activeAccount?.role !== "owner";
    });
  }

  async function deleteHistoryEntry(id) {
    const client = window.ruralSupabase;
    const account = activeAccount;
    if (!client || !account?.farmId || account.role !== "owner" ||
        activityHistoryLoading || activityHistoryDeleting) return;
    if (!navigator.onLine || account.offlineAccess) {
      showToast("Conecte-se à internet para apagar uma atividade do histórico.");
      return;
    }
    const activity = activityHistory.find((item) => item.id === id);
    if (!activity) return;
    const actionLabel = HISTORY_ACTIONS[activity.action]?.label || "Atividade";
    const date = new Date(activity.occurredAt);
    const dateLabel = Number.isNaN(date.getTime()) ? "" : reportDateTime.format(date);
    if (!window.confirm(
      `Apagar esta atividade do histórico?\n\n${actionLabel}: ${activity.recordLabel}\n${dateLabel}\n\n` +
      "Somente esta anotação será apagada. Os animais, a produção e os demais cadastros continuarão salvos. " +
      "Não será possível desfazer esta exclusão.",
    )) return;

    activityHistoryDeleting = true;
    updateHistoryControls();
    setHistoryStatus("loading", "Apagando atividade...");
    const sameAccount = () => activeAccount?.farmId === account.farmId &&
      activeAccount?.userId === account.userId && activeAccount?.role === "owner";
    try {
      const { data, error } = await client.from("activity_log")
        .delete()
        .eq("farm_id", account.farmId)
        .eq("id", activity.id)
        .select("id");
      if (!sameAccount()) return;
      if (error) throw error;
      if (!data?.some((row) => String(row.id) === activity.id)) {
        setHistoryStatus("error", "Exclusão não confirmada");
        showToast("A atividade não foi apagada. Atualize o histórico e verifique seu acesso.");
        return;
      }
      activityHistory = activityHistory.filter((item) => item.id !== activity.id);
      // Keep the pagination cursor: it still identifies the last fetched page,
      // including when that page's final entry was just deleted.
      setHistoryStatus("ready", "Atividade apagada");
      renderActivityHistory();
      showToast("Atividade apagada do histórico. Os cadastros originais foram mantidos.");
    } catch (error) {
      if (!sameAccount()) return;
      console.error("Falha ao apagar atividade do histórico.", error);
      setHistoryStatus("error", "Não foi possível confirmar a exclusão");
      showToast("Não foi possível confirmar a exclusão. Atualize o histórico antes de tentar novamente.");
    } finally {
      activityHistoryDeleting = false;
      updateHistoryControls();
    }
  }

  function renderActivityHistory() {
    if (!elements.historyList) return;
    const items = activityHistory.map((activity) => {
      const action = HISTORY_ACTIONS[activity.action] || {
        label: "Alterou",
        className: "update",
      };
      const module = HISTORY_MODULES[activity.module] || {
        label: "Sistema",
        icon: "•",
      };

      const item = document.createElement("li");
      item.className = `history-item history-item-${action.className}`;

      const icon = document.createElement("span");
      icon.className = "history-item-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = module.icon;

      const content = document.createElement("div");
      content.className = "history-item-content";

      const heading = document.createElement("div");
      heading.className = "history-item-heading";
      const actionBadge = document.createElement("span");
      actionBadge.className = `history-action history-action-${action.className}`;
      actionBadge.textContent = action.label;
      const moduleBadge = document.createElement("span");
      moduleBadge.className = "history-module";
      moduleBadge.textContent = module.label;
      heading.append(actionBadge, moduleBadge);

      const title = document.createElement("strong");
      title.className = "history-item-title";
      title.textContent = activity.recordLabel;

      const actor = document.createElement("p");
      const role = TEAM_ROLE_LABELS[activity.actorRole];
      actor.textContent = role
        ? `${activity.actorName} · ${role}`
        : activity.actorName;

      content.append(heading, title, actor);

      if (activity.action === "update" && activity.changedFields.length) {
        const changes = document.createElement("small");
        changes.className = "history-item-changes";
        changes.textContent = `Alterou: ${naturalList(activity.changedFields.map(historyFieldLabel))}.`;
        content.append(changes);
      }

      const time = document.createElement("time");
      time.className = "history-item-time";
      time.dateTime = activity.occurredAt || "";
      const date = new Date(activity.occurredAt);
      time.textContent = Number.isNaN(date.getTime())
        ? "Data indisponível"
        : reportDateTime.format(date);

      const actions = document.createElement("div");
      actions.className = "history-item-actions";
      actions.append(time);
      if (activeAccount?.role === "owner") {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "button button-secondary history-delete-button";
        remove.dataset.historyDelete = activity.id;
        remove.textContent = "×";
        remove.setAttribute("title", "Apagar do histórico");
        remove.setAttribute("aria-label", `Apagar atividade: ${activity.recordLabel}`);
        actions.append(remove);
      }
      item.append(icon, content, actions);
      return item;
    });

    elements.historyList.replaceChildren(...items);
    const empty = activityHistory.length === 0;
    elements.historyList.hidden = empty;
    elements.historyEmpty.hidden = !empty;
    elements.historyLoadMoreWrap.hidden = !activityHistoryHasMore;
    elements.historyCount.textContent = `${activityHistory.length}${activityHistoryHasMore ? "+" : ""} ${activityHistory.length === 1 ? "atividade" : "atividades"}`;
    updateHistoryControls();
  }

  async function loadActivityHistory({ append = false } = {}) {
    const client = window.ruralSupabase;
    if (
      !client ||
      !activeAccount?.farmId ||
      activeAccount.role !== "owner" ||
      activityHistoryLoading || activityHistoryDeleting
    ) return;

    activityHistoryLoading = true;
    updateHistoryControls();
    setHistoryStatus("loading", append ? "Carregando mais..." : "Consultando histórico...");
    if (elements.historyRefresh) elements.historyRefresh.disabled = true;
    if (elements.historyLoadMore) {
      elements.historyLoadMore.disabled = true;
      elements.historyLoadMore.textContent = append ? "Carregando..." : "Carregar atividades anteriores";
    }
    if (elements.historyModuleFilter) elements.historyModuleFilter.disabled = true;
    if (elements.historyActionFilter) elements.historyActionFilter.disabled = true;

    let query = client
      .from("activity_log")
      .select("id, actor_name, actor_role, module, action, record_label, changed_fields, occurred_at")
      .eq("farm_id", activeAccount.farmId)
      .order("id", { ascending: false })
      .limit(HISTORY_PAGE_SIZE + 1);

    const moduleFilter = elements.historyModuleFilter?.value || "todos";
    const actionFilter = elements.historyActionFilter?.value || "todos";
    if (moduleFilter !== "todos") query = query.eq("module", moduleFilter);
    if (actionFilter !== "todos") query = query.eq("action", actionFilter);
    if (append && activityHistoryCursor) query = query.lt("id", activityHistoryCursor);

    let result;
    try {
      result = await query;
    } catch (error) {
      result = { data: null, error };
    }

    activityHistoryLoading = false;
    updateHistoryControls();
    if (elements.historyRefresh) elements.historyRefresh.disabled = false;
    if (elements.historyLoadMore) {
      elements.historyLoadMore.disabled = false;
      elements.historyLoadMore.textContent = "Carregar atividades anteriores";
    }
    if (elements.historyModuleFilter) elements.historyModuleFilter.disabled = false;
    if (elements.historyActionFilter) elements.historyActionFilter.disabled = false;

    if (result.error) {
      console.error("Falha ao carregar o histórico da propriedade.", result.error);
      setHistoryStatus("error", "Histórico indisponível");
      showToast("Não foi possível carregar o histórico da propriedade.");
      return;
    }

    const rows = result.data || [];
    activityHistoryHasMore = rows.length > HISTORY_PAGE_SIZE;
    const page = rows.slice(0, HISTORY_PAGE_SIZE).map(activityFromDatabase);
    activityHistory = append ? [...activityHistory, ...page] : page;
    activityHistoryCursor = activityHistory.at(-1)?.id || null;
    setHistoryStatus("ready", "Protegido pelo Supabase");
    renderActivityHistory();
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
    if (!["owner", "gerente"].includes(activeAccount?.role) || !navigator.onLine || activeAccount.offlineAccess) return;
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    submitButton.disabled = true;
    submitButton.textContent = "Gerando convite...";
    const { data, error } = await window.ruralSupabase.rpc("create_farm_invite_for_farm", {
      p_farm_id: activeAccount.farmId,
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
    if (!["owner", "gerente"].includes(activeAccount?.role) || !navigator.onLine || activeAccount.offlineAccess) return;
    if (activeAccount.role === "gerente" && !teamInvites.some((invite) => invite.id === inviteId)) return;
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
    const { data, error } = await client
      .from("transactions")
      .select("id, transaction_type, occurred_on, description, category, amount")
      .eq("farm_id", activeAccount.farmId)
      .order("occurred_on", { ascending: false });

    if (error) {
      console.error("Falha ao carregar os lançamentos financeiros.", error);
      setFinanceStatus(
        offlineSnapshotLoaded ? "offline" : "error",
        offlineSnapshotLoaded ? "Últimos dados salvos" : "Sincronização indisponível",
      );
      showToast(
        offlineSnapshotLoaded
          ? "Sem conexão com o Supabase. Exibindo os lançamentos salvos neste aparelho."
          : "Não foi possível carregar os lançamentos do Supabase.",
      );
      return;
    }

    state.transactions = (data || []).map(transactionFromDatabase);
    setFinanceStatus("supabase", "Salvo no Supabase");
    persistOfflineSnapshot();
    updateStorageSummary();
    renderAll();
  }

  async function connectAccount(account) {
    if (!account?.farmId || accountConnecting) return;
    accountConnecting = true;
    activeAccount = account;
    offlineSnapshotLoaded = false;
    const snapshotRestored = restoreOfflineSnapshot();
    useFarmWeatherLocation(account);
    if (!snapshotRestored) {
      state = {
        ...state,
        transactions: [],
        tasks: [],
        crops: [],
        animals: [],
        milkProduction: [],
        inventory: [],
        machines: [],
      };
      renderAll();
    }
    const isOwner = account.role === "owner";
    const canInviteTeam = isOwner || account.role === "gerente";
    document.querySelectorAll("[data-owner-only]").forEach((element) => {
      element.hidden = !isOwner;
    });
    document.querySelectorAll("[data-team-manager-only]").forEach((element) => {
      element.hidden = !canInviteTeam;
    });
    document.querySelectorAll("[data-owner-only-option]").forEach((option) => {
      option.hidden = !isOwner;
      option.disabled = !isOwner;
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

    if (!navigator.onLine || account.offlineAccess) {
      if (!offlineSnapshotLoaded) {
        showToast("Conecte este aparelho à internet uma vez para preparar o modo offline.");
      }
      setOfflineModules();
      renderAll();
      accountConnecting = false;
      return;
    }

    const offlineQueueSynchronized = await synchronizeOfflineChanges({ quiet: true });
    if (!offlineQueueSynchronized && operationCount()) {
      setOfflineModules();
      accountConnecting = false;
      return;
    }

    if (!isOwner) {
      state.transactions = [];
      setFinanceStatus("restricted", "Acesso exclusivo do dono");
      renderAll();
      contactAdmin = false;
      contactMessages = [];
      activityHistory = [];
      activityHistoryCursor = null;
      activityHistoryHasMore = false;
      renderActivityHistory();
      if (["#financeiro", "#historico", "#mensagens", ...(canInviteTeam ? [] : ["#equipe"])].includes(window.location.hash)) {
        showView("dashboard");
      }
      await Promise.all([
        loadTasksFromSupabase(),
        loadCropsFromSupabase(),
        loadAnimalsFromSupabase(),
        loadMilkFromSupabase(),
        loadStockFromSupabase(),
        loadMachinesFromSupabase(),
        ...(canInviteTeam ? [loadTeamFromSupabase()] : []),
        initializeNotifications(),
      ]);
      await refreshPushControls();
      await handlePendingPushNavigation();
      persistOfflineSnapshot();
      updateStorageSummary();
      accountConnecting = false;
      return;
    }

    await Promise.all([
      loadFinanceFromSupabase(),
      loadTeamFromSupabase(),
      loadTasksFromSupabase(),
      loadCropsFromSupabase(),
      loadAnimalsFromSupabase(),
      loadMilkFromSupabase(),
      loadStockFromSupabase(),
      loadMachinesFromSupabase(),
      initializeContactMessages(),
      initializeNotifications(),
    ]);
    await refreshPushControls();
    await handlePendingPushNavigation();
    if (window.location.hash === "#historico") {
      await loadActivityHistory();
    }
    persistOfflineSnapshot();
    updateStorageSummary();
    accountConnecting = false;
  }

  window.addEventListener("rural:before-farm-switch", (event) => {
    if (accountConnecting || offlineSyncing || activityHistoryDeleting || window.ruralPendingWrites?.()) {
      event.preventDefault();
      event.detail.reason = "Aguarde o carregamento ou salvamento terminar antes de trocar de fazenda.";
    } else if (operationCount()) {
      event.preventDefault();
      event.detail.reason = "Sincronize as alterações pendentes desta fazenda antes de trocar.";
    }
  });

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
    const ownerRestricted = activeAccount && activeAccount.role !== "owner" &&
      (["financeiro", "historico"].includes(requestedView) ||
        (requestedView === "equipe" && activeAccount.role !== "gerente"));
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
    if (view === "historico" && activeAccount?.role === "owner") {
      loadActivityHistory();
    }
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
    return [location?.name, location?.admin1].filter(Boolean).join(", ") || "Localização não cadastrada";
  }

  function useFarmWeatherLocation(account, clearMissing = false) {
    const latitude = Number(account.locationLatitude);
    const longitude = Number(account.locationLongitude);
    const saved = account.locationLatitude != null && account.locationLongitude != null
      && Number.isFinite(latitude) && Number.isFinite(longitude);
    let next = state.weatherLocation;
    if (saved) {
      next = { name: account.farmName, admin1: "", country: "Brasil", latitude, longitude };
    } else if (clearMissing || state.weatherLocationFarmId !== account.farmId) {
      next = { name: "Localização não cadastrada", admin1: "", country: "", latitude: null, longitude: null };
    }
    const changed = state.weatherLocationFarmId !== account.farmId
      || next?.latitude !== state.weatherLocation?.latitude
      || next?.longitude !== state.weatherLocation?.longitude;
    state.weatherLocation = next;
    state.weatherLocationFarmId = account.farmId;
    if (changed || clearMissing) {
      weatherFetchController?.abort();
      weatherData = null;
      weatherDataSavedAt = null;
      elements.weatherCurrent.replaceChildren();
      elements.weatherForecast.replaceChildren();
      elements.weatherAlerts.replaceChildren();
      elements.navClimateCount.textContent = "0";
      elements.metricWeatherTemperature.textContent = "—";
      elements.metricWeatherSummary.textContent = "Aguardando previsão da fazenda";
      renderDashboardAlerts();
    }
    elements.weatherLocationLabel.textContent = weatherLocationName();
    elements.weatherUpdatedAt.textContent = "Aguardando atualização";
    elements.weatherSearchInput.value = saved || next?.latitude == null ? "" : weatherLocationName();
    loadWeather();
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
    elements.metricAnimals.textContent = String(
      state.animals.filter((animal) => animal.status === "active").length,
    );
    const today = isoDate(new Date());
    const milkToday = state.milkProduction
      .filter((record) => record.date === today)
      .reduce((total, record) => total + Number(record.liters || 0), 0);
    elements.metricMilk.textContent = `${milkToday.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} L`;
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
      item.textContent = "Nenhuma ordem pendente.";
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
      .filter((animal) => animal.status === "active")
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
    const open = state.tasks.filter((task) => taskStatusOf(task) === "aberta").length;
    const inProgress = state.tasks.filter((task) => taskStatusOf(task) === "em_andamento").length;
    const completed = state.tasks.filter((task) => taskStatusOf(task) === "concluida").length;
    const urgent = state.tasks.filter(
      (task) => taskStatusOf(task) !== "concluida" && task.priority === "alta",
    ).length;
    elements.agendaStats.replaceChildren(
      createStat("Ordens abertas", open),
      createStat("Em andamento", inProgress),
      createStat("Alta prioridade", urgent),
      createStat("Concluídas", completed),
    );

    const filtered = state.tasks
      .filter((task) => {
        const status = taskStatusOf(task);
        if (taskFilter === "abertas") return status === "aberta";
        if (taskFilter === "em_andamento") return status === "em_andamento";
        if (taskFilter === "concluidas") return status === "concluida";
        return true;
      })
      .sort((a, b) => {
        const order = { em_andamento: 0, aberta: 1, concluida: 2 };
        return order[taskStatusOf(a)] - order[taskStatusOf(b)] || a.date.localeCompare(b.date);
      });

    elements.agendaList.replaceChildren(
      ...filtered.map((task) => {
        const item = document.createElement("article");
        const status = taskStatusOf(task);
        item.className = `agenda-item agenda-item-${status}${status === "concluida" ? " completed" : ""}`;
        item.dataset.taskId = task.id;
        const toggle = document.createElement("button");
        toggle.className = "agenda-toggle";
        toggle.type = "button";
        toggle.dataset.toggleTask = task.id;
        toggle.setAttribute(
          "aria-label",
          status === "concluida" ? `Reabrir ${task.title}` : `Concluir ${task.title}`,
        );
        toggle.textContent = status === "concluida" ? "✓" : status === "em_andamento" ? "•" : "";
        const canToggle = canCurrentUserToggleTask(task);
        toggle.disabled = !canToggle;
        if (!canToggle) {
          toggle.title = "Somente o responsável ou o dono pode alterar esta ordem";
          toggle.setAttribute("aria-label", `${task.title}: somente o responsável pode alterar`);
        }
        const copy = document.createElement("div");
        const title = document.createElement("strong");
        title.className = "agenda-item-title";
        title.textContent = task.title;
        const info = document.createElement("small");
        info.textContent = `${taskShortCode(task)} · ${task.category} · Responsável: ${task.responsible}`;
        const instructions = document.createElement("p");
        instructions.className = "agenda-item-instructions";
        instructions.textContent = task.instructions || "Sem instruções adicionais.";
        copy.append(title, info, instructions);
        const badges = document.createElement("div");
        badges.className = "work-order-badges";
        const statusBadge = document.createElement("span");
        statusBadge.className = `work-order-status work-order-status-${status}`;
        statusBadge.textContent = TASK_STATUS_LABELS[status] || status;
        const priority = document.createElement("span");
        priority.className = `priority-badge priority-${task.priority}`;
        priority.textContent =
          { alta: "Alta", media: "Média", baixa: "Baixa" }[task.priority] || task.priority;
        badges.append(statusBadge, priority);
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
        const details = document.createElement("button");
        details.className = "row-edit";
        details.type = "button";
        details.dataset.taskDetails = task.id;
        details.textContent = "Detalhes";
        details.setAttribute("aria-label", `Abrir detalhes de ${task.title}`);
        actions.append(details);
        if (activeAccount?.role === "owner") {
          actions.append(...createRecordActions("task", task.id, task.title).childNodes);
        }
        item.append(toggle, copy, badges, date, actions);
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
    const activeAnimals = state.animals.filter((animal) => animal.status === "active");
    const inactiveAnimals = state.animals.filter((animal) => animal.status !== "active");
    const averageWeight = activeAnimals.length
      ? activeAnimals.reduce((total, animal) => total + Number(animal.weight || 0), 0) /
        activeAnimals.length
      : 0;
    const vaccinesDue = activeAnimals.filter((animal) => {
      const days = daysUntil(animal.nextVaccine);
      return days >= 0 && days <= 30;
    }).length;
    elements.animalSummary.replaceChildren(
      createAnimalStat("Animais ativos", activeAnimals.length),
      createAnimalStat("Vendidos ou mortos", inactiveAnimals.length),
      createAnimalStat("Peso médio", `${averageWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`),
      createAnimalStat("Vacinas em 30 dias", vaccinesDue),
    );

    const term = normalize(elements.animalSearch.value);
    const selectedCategory = elements.animalCategoryFilter.value;
    const selectedStatus = elements.animalStatusFilter.value;
    const animals = state.animals
      .filter((animal) =>
        [animal.name, animal.species, animal.breed, cattleCategoryLabel(animal.category, animal.species)].some((value) =>
          normalize(value).includes(term),
        ),
      )
      .filter((animal) =>
        selectedCategory === "todas"
          ? true
          : selectedCategory === "sem_categoria"
            ? isCattleSpecies(animal.species) && !animal.category
            : animal.category === selectedCategory,
      )
      .filter((animal) => selectedStatus === "all" || animal.status === selectedStatus)
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
        const category = document.createElement("td");
        const categoryBadge = document.createElement("span");
        categoryBadge.className = `cattle-category${animal.category ? "" : " cattle-category-empty"}`;
        categoryBadge.textContent = cattleCategoryLabel(animal.category, animal.species);
        category.append(categoryBadge);
        const status = document.createElement("td");
        const statusBadge = document.createElement("span");
        statusBadge.className = `animal-status animal-status-${animal.status}`;
        statusBadge.textContent = animalStatusLabel(animal.status);
        status.append(statusBadge);
        if (animal.status !== "active" && animal.statusDate) {
          const statusDate = document.createElement("small");
          statusDate.textContent = formatDate(animal.statusDate);
          status.append(statusDate);
        }
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
        row.append(identity, species, category, status, birth, weight, vaccine, actions);
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

  function formatLiters(value) {
    return `${Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} L`;
  }

  function canEditMilkRecord(record) {
    return Boolean(
      canManageMilk() &&
        (activeAccount?.role === "owner" || record.createdBy === activeAccount?.userId),
    );
  }

  function createMilkActions(record) {
    const actions = document.createElement("div");
    actions.className = "record-actions";
    if (canEditMilkRecord(record)) {
      actions.append(createEditButton("milk", record.id, `produção de ${record.animalName}`));
    }
    if (activeAccount?.role === "owner") {
      actions.append(createDeleteButton("milk", record.id, `produção de ${record.animalName}`));
    }
    return actions;
  }

  function renderMilk() {
    const selectedDate = elements.milkDateFilter.value || isoDate(new Date());
    const records = state.milkProduction
      .filter((record) => record.date === selectedDate)
      .sort((left, right) => {
        const shiftOrder = { manha: 0, tarde: 1, noite: 2 };
        return (
          (shiftOrder[left.shift] ?? 9) - (shiftOrder[right.shift] ?? 9) ||
          left.animalName.localeCompare(right.animalName, "pt-BR")
        );
      });
    const produced = records.reduce((total, record) => total + Number(record.liters || 0), 0);
    const discarded = records.reduce(
      (total, record) => total + Number(record.discardedLiters || 0),
      0,
    );
    const animalCount = new Set(records.map((record) => record.animalId)).size;
    const average = animalCount ? produced / animalCount : 0;

    elements.milkSummary.replaceChildren(
      createAnimalStat("Produção do dia", formatLiters(produced)),
      createAnimalStat("Leite aproveitado", formatLiters(produced - discarded)),
      createAnimalStat("Leite descartado", formatLiters(discarded)),
      createAnimalStat("Média por vaca", formatLiters(average)),
    );
    elements.milkCount.textContent = `${records.length} ${records.length === 1 ? "registro" : "registros"}`;
    elements.milkTableBody.replaceChildren(
      ...records.map((record) => {
        const row = document.createElement("tr");
        const animal = document.createElement("td");
        const animalName = document.createElement("strong");
        animalName.textContent = record.animalName;
        animal.append(animalName);
        const shift = document.createElement("td");
        const shiftBadge = document.createElement("span");
        shiftBadge.className = `milk-shift milk-shift-${record.shift}`;
        shiftBadge.textContent = MILK_SHIFT_LABELS[record.shift] || record.shift;
        shift.append(shiftBadge);
        const liters = document.createElement("td");
        liters.textContent = formatLiters(record.liters);
        const discardedCell = document.createElement("td");
        discardedCell.textContent = formatLiters(record.discardedLiters);
        const useful = document.createElement("td");
        useful.textContent = formatLiters(record.liters - record.discardedLiters);
        const notes = document.createElement("td");
        notes.className = "milk-notes";
        notes.textContent = record.notes || "Sem observações";
        const actions = document.createElement("td");
        actions.append(createMilkActions(record));
        row.append(animal, shift, liters, discardedCell, useful, notes, actions);
        return row;
      }),
    );
    const empty = records.length === 0;
    elements.milkEmpty.hidden = !empty;
    elements.milkTableBody.closest("table").hidden = empty;
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
        movement.disabled = !storageReady(stockStorageMode);
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
        update.disabled = !storageReady(machineStorageMode);
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
    const reportActiveAnimals = state.animals.filter((animal) => animal.status === "active");
    const vaccinesDue = reportActiveAnimals.filter((animal) => daysUntil(animal.nextVaccine) <= 30).length;
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
      createReportOperationStat("Animais ativos", reportActiveAnimals.length, vaccinesDue + " com vacinação próxima", vaccinesDue ? "warning" : "success"),
      createReportOperationStat("Itens em estoque", state.inventory.length, stockAttention + " precisam de reposição", stockAttention ? "warning" : "success"),
      createReportOperationStat("Máquinas e equipamentos", state.machines.length, machineAttention + " exigem manutenção", machineAttention ? "warning" : "success"),
      createReportOperationStat("Culturas no período", crops.length, crops.filter((crop) => crop.status === "Colhida").length + " colhidas", "neutral"),
    );

    elements.reportAnimalTableBody.replaceChildren(
      ...state.animals.map((animal) => {
        const row = document.createElement("tr");
        appendReportCell(
          row,
          animal.name,
          [animal.species, animal.breed, animal.category ? cattleCategoryLabel(animal.category) : ""]
            .filter(Boolean)
            .join(" · "),
        );
        appendReportCell(
          row,
          animalStatusLabel(animal.status),
          animal.status !== "active" && animal.statusDate ? formatDate(animal.statusDate) : "",
        );
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
    const location = state.weatherLocation;
    if (location?.latitude == null || location?.longitude == null) {
      weatherFetchController?.abort();
      weatherFetchController = null;
      showWeatherStatus("Cadastre a localização em Minhas fazendas para ver o clima deste local, ou busque uma cidade abaixo.", "error");
      elements.weatherRefresh.disabled = false;
      return;
    }
    if (!navigator.onLine) {
      weatherFetchController?.abort();
      weatherFetchController = null;
      if (weatherData) {
        renderWeather();
        const savedAt = weatherDataSavedAt
          ? reportDateTime.format(new Date(weatherDataSavedAt))
          : "anteriormente";
        showWeatherStatus(`Sem internet: exibindo a última previsão salva em ${savedAt}.`);
      } else {
        showWeatherStatus(
          "O clima precisa de internet e ainda não há uma previsão salva neste aparelho.",
          "error",
        );
        elements.metricWeatherSummary.textContent = "Previsão disponível quando houver internet";
      }
      elements.weatherRefresh.disabled = false;
      return;
    }
    weatherFetchController?.abort();
    const controller = new AbortController();
    weatherFetchController = controller;
    showWeatherStatus("Atualizando a previsão do tempo...");
    elements.weatherRefresh.disabled = true;
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
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("weather-request");
      const forecast = await response.json();
      if (weatherFetchController !== controller) return;
      weatherData = forecast;
      weatherDataSavedAt = new Date().toISOString();
      renderWeather();
      persistOfflineSnapshot();
    } catch (error) {
      if (error.name === "AbortError" || weatherFetchController !== controller) return;
      showWeatherStatus(
        "Não foi possível atualizar o clima agora. Verifique sua internet e tente novamente.",
        "error",
      );
      elements.metricWeatherSummary.textContent = "Previsão temporariamente indisponível";
      elements.navClimateCount.textContent = "0";
    } finally {
      if (weatherFetchController === controller) elements.weatherRefresh.disabled = false;
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
      state.weatherLocationFarmId = activeAccount?.farmId || "";
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
    renderMilk();
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

  function milkAnimals() {
    return state.animals
      .filter(
        (animal) =>
          animal.status === "active" &&
          (animal.category === "vaca" ||
            (!animal.category && isCattleSpecies(animal.species))),
      )
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  }

  function refreshMilkAnimalOptions(selectedId = "") {
    const select = elements.milkForm?.elements.animalId;
    if (!select) return;
    const animals = milkAnimals();
    select.replaceChildren(
      ...animals.map((animal) => {
        const option = document.createElement("option");
        option.value = animal.id;
        option.textContent = `${animal.name}${animal.breed ? ` · ${animal.breed}` : ""}`;
        option.selected = animal.id === selectedId;
        return option;
      }),
    );
  }

  function updateAnimalStatusFields() {
    const status = elements.animalForm.elements.status.value || "active";
    const inactive = status !== "active";
    elements.animalStatusDateField.hidden = !inactive;
    elements.animalForm.elements.statusDate.required = inactive;
    elements.animalForm.elements.statusDate.max = isoDate(new Date());
    if (!inactive) elements.animalForm.elements.statusDate.value = "";
  }

  function openDialog(type) {
    const config = editorConfig[type];
    if (!config) return;
    if (type === "transaction" && !storageReady(financeStorageMode)) {
      showToast("Aguarde o Financeiro terminar de sincronizar.");
      return;
    }
    if (type === "task" && (!storageReady(taskStorageMode) || activeAccount?.role !== "owner")) {
      showToast("Somente o dono pode criar ordens de serviço.");
      return;
    }
    if (type === "crop" && (!storageReady(cropStorageMode) || !canManageCrops())) {
      showToast("Somente o dono ou o caseiro pode cadastrar plantações.");
      return;
    }
    if (type === "animal" && (!storageReady(animalStorageMode) || !canManageAnimals())) {
      showToast("Somente o dono ou o vaqueiro pode cadastrar animais.");
      return;
    }
    if (type === "milk" && (!storageReady(milkStorageMode) || !canManageMilk())) {
      showToast("Sua conta não pode registrar a produção de leite neste momento.");
      return;
    }
    if (type === "milk" && milkAnimals().length === 0) {
      showToast("Cadastre primeiro uma vaca como animal da espécie Bovino.");
      return;
    }
    if (type === "stock" && (!storageReady(stockStorageMode) || !canManageStock())) {
      showToast("Somente o dono ou o caseiro pode cadastrar itens do estoque.");
      return;
    }
    if (type === "machine" && (!storageReady(machineStorageMode) || !canManageMachines())) {
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
      form.elements.status.value = "active";
      updateAnimalStatusFields();
    }
    if (type === "milk") {
      refreshMilkAnimalOptions();
      form.elements.date.value = elements.milkDateFilter.value || isoDate(new Date());
      form.elements.date.max = isoDate(new Date());
      form.elements.shift.value = new Date().getHours() < 12 ? "manha" : new Date().getHours() < 18 ? "tarde" : "noite";
      form.elements.discardedLiters.value = "0";
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
    if (type === "transaction" && !storageReady(financeStorageMode)) {
      showToast("Aguarde o Financeiro terminar de sincronizar.");
      return;
    }
    if (type === "task" && (!storageReady(taskStorageMode) || activeAccount?.role !== "owner")) {
      showToast("Somente o dono pode editar ordens de serviço.");
      return;
    }
    if (type === "crop" && (!storageReady(cropStorageMode) || !canManageCrops())) {
      showToast("Somente o dono ou o caseiro pode editar plantações.");
      return;
    }
    if (type === "animal" && (!storageReady(animalStorageMode) || !canManageAnimals())) {
      showToast("Somente o dono ou o vaqueiro pode editar animais.");
      return;
    }
    if (type === "milk" && (!storageReady(milkStorageMode) || !canManageMilk())) {
      showToast("Sua conta não pode editar esta produção de leite.");
      return;
    }
    if (type === "stock" && (!storageReady(stockStorageMode) || !canManageStock())) {
      showToast("Somente o dono ou o caseiro pode editar o estoque.");
      return;
    }
    if (type === "machine" && (!storageReady(machineStorageMode) || !canManageMachines())) {
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
    if (type === "milk") {
      if (!canEditMilkRecord(record)) {
        showToast("Você só pode editar os registros criados pela sua conta.");
        return;
      }
      refreshMilkAnimalOptions(record.animalId);
      config.form.elements.date.max = isoDate(new Date());
    }
    Object.entries(record).forEach(([name, value]) => {
      const field = config.form.elements.namedItem(name);
      if (field && "value" in field) field.value = value ?? "";
    });
    if (type === "animal") updateAnimalStatusFields();
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
    if (
      activeAccount?.farmId &&
      activeAccount.role === "owner" &&
      (!navigator.onLine || financeStorageMode === "offline")
    ) {
      return saveOfflineRecord("transaction", values);
    }
    if (!client || !activeAccount?.farmId || financeStorageMode !== "supabase") {
      showToast("O Financeiro não está conectado. Tente novamente em instantes.");
      return null;
    }

    const columns = "id, transaction_type, occurred_on, description, category, amount";
    const databaseValues = transactionToDatabase(values);
    const isEditing = editingRecord?.type === "transaction";
    const recordId = isEditing
      ? editingRecord.id
      : window.ruralOffline?.createOperationId?.();
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
            .insert({ id: recordId, ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar o lançamento financeiro.", error);
      if (isConnectionFailure(error)) {
        return keepRecordAfterConnectionFailure("transaction", values, recordId, isEditing);
      }
      showToast("Não foi possível acessar o Supabase. Nenhuma alteração foi aplicada.");
      return null;
    }

    if (result.error || !result.data) {
      console.error("Falha ao salvar o lançamento financeiro.", result.error);
      if (isConnectionFailure(result.error)) {
        return keepRecordAfterConnectionFailure("transaction", values, recordId, isEditing);
      }
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
    persistOfflineSnapshot();
    closeDialogs();
    showView("financeiro");
    showToast(
      financeStorageMode === "offline"
        ? "Lançamento salvo neste aparelho. Será enviado quando a internet voltar."
        : result === "updated"
        ? "Lançamento atualizado e indicadores recalculados."
        : "Lançamento salvo e indicadores atualizados.",
    );
  }

  async function saveTaskToSupabase(values) {
    const client = window.ruralSupabase;
    if (
      activeAccount?.farmId &&
      activeAccount.role === "owner" &&
      (!navigator.onLine || taskStorageMode === "offline")
    ) {
      return saveOfflineRecord("task", values);
    }
    if (
      !client ||
      !activeAccount?.farmId ||
      activeAccount.role !== "owner" ||
      taskStorageMode !== "supabase"
    ) {
      showToast("As ordens não estão conectadas ou sua conta não pode alterá-las.");
      return null;
    }

    const isEditing = editingRecord?.type === "task";
    const recordId = isEditing
      ? editingRecord.id
      : window.ruralOffline?.createOperationId?.();
    let currentUser;
    let membership;
    try {
      const userResult = await client.auth.getUser();
      currentUser = userResult.data?.user;
      if (userResult.error || !currentUser) {
        if (isConnectionFailure(userResult.error)) {
          return keepRecordAfterConnectionFailure("task", values, recordId, isEditing);
        }
        showToast("Sua sessão expirou. Entre novamente para salvar a ordem.");
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
        console.error("Falha ao conferir a permissão para salvar a ordem.", membershipResult.error);
        if (isConnectionFailure(membershipResult.error)) {
          return keepRecordAfterConnectionFailure("task", values, recordId, isEditing);
        }
        showToast("Não foi possível conferir sua permissão. Tente novamente.");
        return null;
      }
    } catch (error) {
      console.error("Falha de conexão ao conferir a sessão.", error);
      if (isConnectionFailure(error)) {
        return keepRecordAfterConnectionFailure("task", values, recordId, isEditing);
      }
      showToast("Não foi possível conferir sua sessão. Tente novamente.");
      return null;
    }

    if (!membership || membership.status !== "active" || membership.role !== "owner") {
      showToast("Somente o dono da fazenda pode criar ou editar ordens de serviço.");
      window.setTimeout(() => window.location.reload(), 900);
      return null;
    }

    const columns = "id, title, due_date, category, priority, responsible_name, assigned_to, notes, status, completed, started_at, completed_at, completed_by";
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
              id: recordId,
              ...taskToDatabase(values),
              farm_id: activeAccount.farmId,
              completed: false,
              completed_at: null,
            })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar a ordem.", error);
      if (isConnectionFailure(error)) {
        return keepRecordAfterConnectionFailure("task", values, recordId, isEditing);
      }
      showToast("Não foi possível acessar o Supabase. A ordem foi mantida como estava.");
      return null;
    }

    if (result.error || !result.data) {
      console.error("Falha ao salvar a ordem.", result.error);
      if (isConnectionFailure(result.error)) {
        return keepRecordAfterConnectionFailure("task", values, recordId, isEditing);
      }
      const permissionDenied =
        result.error?.code === "42501" ||
        /row-level security|permission denied/i.test(result.error?.message || "");
      showToast(
        permissionDenied
          ? "Sua conta não tem permissão para salvar ordens. Entre com a conta do dono."
          : "Não foi possível salvar a ordem no Supabase. Tente novamente.",
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
      instructions: String(data.get("instructions") || "").trim(),
    });
    submit.disabled = false;
    if (!result) return;
    renderAll();
    persistOfflineSnapshot();
    closeDialogs();
    showView("agenda");
    showToast(
      taskStorageMode === "offline"
        ? "Tarefa salva neste aparelho. Será enviada quando a internet voltar."
        : result === "updated"
          ? "Tarefa atualizada."
          : "Ordem de serviço criada e enviada ao responsável.",
    );
  }

  async function saveCropToSupabase(values) {
    const client = window.ruralSupabase;
    if (
      activeAccount?.farmId &&
      canManageCrops() &&
      (!navigator.onLine || cropStorageMode === "offline")
    ) {
      return saveOfflineRecord("crop", values);
    }
    if (!client || !activeAccount?.farmId || cropStorageMode !== "supabase" || !canManageCrops()) {
      showToast("Sua conta não pode alterar plantações neste momento.");
      return null;
    }
    const columns = "id, name, area_hectares, planting_date, planned_harvest_date, harvested_on, harvested_quantity, production_cost, status";
    const isEditing = editingRecord?.type === "crop";
    const recordId = isEditing
      ? editingRecord.id
      : window.ruralOffline?.createOperationId?.();
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
            .insert({ id: recordId, ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar a plantação.", error);
      if (isConnectionFailure(error)) {
        return keepRecordAfterConnectionFailure("crop", values, recordId, isEditing);
      }
      showToast("Não foi possível acessar o Supabase. A plantação não foi alterada.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar a plantação.", result.error);
      if (isConnectionFailure(result.error)) {
        return keepRecordAfterConnectionFailure("crop", values, recordId, isEditing);
      }
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
    if (
      activeAccount?.farmId &&
      canManageAnimals() &&
      (!navigator.onLine || animalStorageMode === "offline")
    ) {
      return saveOfflineRecord("animal", values);
    }
    if (!client || !activeAccount?.farmId || animalStorageMode !== "supabase" || !canManageAnimals()) {
      showToast("Sua conta não pode alterar animais neste momento.");
      return null;
    }
    const columns = ANIMAL_DATABASE_COLUMNS;
    const databaseValues = animalToDatabase(values);
    const isEditing = editingRecord?.type === "animal";
    const recordId = isEditing
      ? editingRecord.id
      : window.ruralOffline?.createOperationId?.();
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
            .insert({ id: recordId, ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar o animal.", error);
      if (isConnectionFailure(error)) {
        return keepRecordAfterConnectionFailure("animal", values, recordId, isEditing);
      }
      showToast("Não foi possível acessar o Supabase. O animal não foi alterado.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar o animal.", result.error);
      if (isConnectionFailure(result.error)) {
        return keepRecordAfterConnectionFailure("animal", values, recordId, isEditing);
      }
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

  async function saveMilkToSupabase(values) {
    const client = window.ruralSupabase;
    const isEditing = editingRecord?.type === "milk";
    const existing = isEditing
      ? state.milkProduction.find((record) => record.id === editingRecord.id)
      : null;
    const valuesWithAuthor = {
      ...values,
      createdBy: existing?.createdBy || activeAccount?.userId || "",
    };
    if (
      activeAccount?.farmId &&
      canManageMilk() &&
      (!navigator.onLine || milkStorageMode === "offline")
    ) {
      return saveOfflineRecord("milk", valuesWithAuthor);
    }
    if (!client || !activeAccount?.farmId || milkStorageMode !== "supabase" || !canManageMilk()) {
      showToast("Sua conta não pode registrar a produção de leite neste momento.");
      return null;
    }
    if (isEditing && !canEditMilkRecord(existing)) {
      showToast("Você só pode editar os registros criados pela sua conta.");
      return null;
    }
    const columns = "id, animal_id, production_date, shift, liters, discarded_liters, notes, created_by, created_at, updated_at, animals(identifier)";
    const databaseValues = milkToDatabase(valuesWithAuthor);
    const recordId = isEditing
      ? editingRecord.id
      : window.ruralOffline?.createOperationId?.();
    let result;
    try {
      result = isEditing
        ? await client
            .from("milk_production_records")
            .update({ ...databaseValues, updated_at: new Date().toISOString() })
            .eq("id", editingRecord.id)
            .eq("farm_id", activeAccount.farmId)
            .select(columns)
            .single()
        : await client
            .from("milk_production_records")
            .insert({ id: recordId, ...databaseValues, farm_id: activeAccount.farmId })
            .select(columns)
            .single();
    } catch (error) {
      console.error("Falha de conexão ao salvar a produção de leite.", error);
      if (isConnectionFailure(error)) {
        return keepRecordAfterConnectionFailure("milk", valuesWithAuthor, recordId, isEditing);
      }
      showToast("Não foi possível acessar o Supabase. A produção não foi alterada.");
      return null;
    }
    if (result.error || !result.data) {
      console.error("Falha ao salvar a produção de leite.", result.error);
      if (isConnectionFailure(result.error)) {
        return keepRecordAfterConnectionFailure("milk", valuesWithAuthor, recordId, isEditing);
      }
      showToast(
        result.error?.code === "42501"
          ? "Sua conta não possui permissão para alterar este registro."
          : result.error?.code === "23514"
            ? "Confira os litros produzidos e descartados."
            : "Não foi possível salvar a produção de leite no Supabase.",
      );
      return null;
    }
    const saved = milkFromDatabase(result.data);
    if (isEditing) {
      const index = state.milkProduction.findIndex((record) => record.id === saved.id);
      if (index >= 0) state.milkProduction[index] = saved;
      else state.milkProduction.push(saved);
      return "updated";
    }
    state.milkProduction.push(saved);
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
