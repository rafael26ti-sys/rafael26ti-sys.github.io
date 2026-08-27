(() => {
  "use strict";

  const STORAGE_KEY = "controle-rural-simples.records.v1";

  const seedRecords = [
    {
      id: "demo-1",
      date: "2026-08-22",
      description: "Venda de café beneficiado",
      category: "Venda da safra",
      type: "receita",
      amount: 18400,
      status: "Confirmada",
    },
    {
      id: "demo-2",
      date: "2026-08-20",
      description: "Compra de fertilizante NPK",
      category: "Insumos",
      type: "despesa",
      amount: 6450,
      status: "Confirmada",
    },
    {
      id: "demo-3",
      date: "2026-08-18",
      description: "Adubação do Talhão Norte",
      category: "Manejo",
      type: "atividade",
      amount: null,
      status: "Pendente",
    },
    {
      id: "demo-4",
      date: "2026-08-15",
      description: "Manutenção do pulverizador",
      category: "Máquinas",
      type: "despesa",
      amount: 1280,
      status: "Confirmada",
    },
    {
      id: "demo-5",
      date: "2026-08-12",
      description: "Colheita do Talhão Sul",
      category: "Colheita",
      type: "atividade",
      amount: null,
      status: "Concluída",
    },
    {
      id: "demo-6",
      date: "2026-08-08",
      description: "Pagamento de mão de obra",
      category: "Mão de obra",
      type: "despesa",
      amount: 2250,
      status: "Confirmada",
    },
  ];

  const modules = {
    propriedades: {
      title: "Propriedades",
      symbol: "⌖",
      description:
        "Cadastre os dados da fazenda e mantenha cada área vinculada à conta correta.",
      features: [
        "Nome, localização e tamanho em hectares",
        "Tipo de produção e proprietário",
        "Base para talhões, safras e lançamentos",
      ],
    },
    talhoes: {
      title: "Talhões",
      symbol: "▦",
      description:
        "Organize a propriedade por áreas produtivas para acompanhar culturas, atividades e resultados.",
      features: [
        "Vínculo obrigatório com a propriedade",
        "Tamanho, situação e cultura atual",
        "Histórico de culturas por área",
      ],
    },
    culturas: {
      title: "Culturas",
      symbol: "♧",
      description:
        "Registre as culturas e variedades plantadas em cada talhão.",
      features: [
        "Variedade e área plantada",
        "Datas de plantio e colheita",
        "Produção e unidade de medida",
      ],
    },
    safras: {
      title: "Safras",
      symbol: "◒",
      description:
        "Acompanhe a safra do plantio ao resultado financeiro, conforme o fluxo principal do PRD.",
      features: [
        "Vínculo com propriedade, talhão e cultura",
        "Produção e produtividade por hectare",
        "Receitas, despesas e lucro calculado",
      ],
    },
    atividades: {
      title: "Atividades",
      symbol: "✓",
      description: "Planeje e registre os trabalhos realizados no campo.",
      features: [
        "Responsável, data e horário",
        "Status pendente, em andamento ou concluído",
        "Vínculo com propriedade e talhão",
      ],
    },
    estoque: {
      title: "Estoque",
      symbol: "□",
      description:
        "Controle insumos, produtos e quantidades disponíveis na propriedade.",
      features: [
        "Quantidade e unidade de medida",
        "Estoque mínimo e validade",
        "Alertas para itens que precisam de atenção",
      ],
    },
    financeiro: {
      title: "Financeiro",
      symbol: "R$",
      description:
        "Centralize receitas e despesas para saber o resultado real de cada período e safra.",
      features: [
        "Categorias, clientes e fornecedores",
        "Vínculo opcional com uma safra",
        "Cálculo automático de receita, despesa e lucro",
      ],
    },
    relatorios: {
      title: "Relatórios",
      symbol: "↗",
      description:
        "Transforme os registros da propriedade em indicadores simples para tomada de decisão.",
      features: [
        "Receitas e despesas por período",
        "Custos e resultado por safra",
        "Filtros por cultura, safra e categoria",
      ],
    },
  };

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const elements = {
    sidebar: document.querySelector("#sidebar"),
    sidebarBackdrop: document.querySelector("#sidebar-backdrop"),
    menuButton: document.querySelector("#menu-button"),
    dashboardView: document.querySelector("#dashboard-view"),
    moduleView: document.querySelector("#module-view"),
    moduleTitle: document.querySelector("#module-title"),
    moduleSymbol: document.querySelector("#module-symbol"),
    moduleDescription: document.querySelector("#module-description"),
    moduleFeatures: document.querySelector("#module-features"),
    moduleAction: document.querySelector("#module-action"),
    backDashboard: document.querySelector("#back-dashboard"),
    search: document.querySelector("#global-search"),
    recordsBody: document.querySelector("#records-body"),
    emptyState: document.querySelector("#empty-state"),
    resultsCount: document.querySelector("#results-count"),
    incomeTotal: document.querySelector("#income-total"),
    expenseTotal: document.querySelector("#expense-total"),
    profitTotal: document.querySelector("#profit-total"),
    pendingTotal: document.querySelector("#pending-total"),
    currentDate: document.querySelector("#current-date"),
    recordDialog: document.querySelector("#record-dialog"),
    recordForm: document.querySelector("#record-form"),
    recordDialogTitle: document.querySelector("#record-dialog-title"),
    recordType: document.querySelector("#record-type"),
    recordDate: document.querySelector("#record-date"),
    recordDescription: document.querySelector("#record-description"),
    recordCategory: document.querySelector("#record-category"),
    recordAmount: document.querySelector("#record-amount"),
    recordStatus: document.querySelector("#record-status"),
    amountField: document.querySelector("#amount-field"),
    deleteDialog: document.querySelector("#delete-dialog"),
    confirmDelete: document.querySelector("#confirm-delete"),
    toast: document.querySelector("#toast"),
  };

  let records = loadRecords();
  let pendingDeleteId = null;
  let activeModule = "dashboard";
  let toastTimer = null;

  function isValidRecord(record) {
    return Boolean(
      record &&
        typeof record.id === "string" &&
        typeof record.date === "string" &&
        typeof record.description === "string" &&
        typeof record.category === "string" &&
        ["receita", "despesa", "atividade"].includes(record.type) &&
        typeof record.status === "string" &&
        (record.amount === null || Number.isFinite(Number(record.amount))),
    );
  }

  function loadRecords() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return seedRecords.map((record) => ({ ...record }));

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || !parsed.every(isValidRecord)) {
        return seedRecords.map((record) => ({ ...record }));
      }

      return parsed;
    } catch {
      return seedRecords.map((record) => ({ ...record }));
    }
  }

  function saveRecords() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      showToast("Não foi possível salvar neste navegador.");
    }
  }

  function normalizeText(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatDate(value) {
    const parsedDate = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsedDate.getTime())
      ? value
      : dateFormatter.format(parsedDate);
  }

  function formatType(type) {
    return (
      {
        receita: "Receita",
        despesa: "Despesa",
        atividade: "Atividade",
      }[type] || type
    );
  }

  function statusClass(status) {
    return `status-${normalizeText(status).replace(/\s+/g, "-")}`;
  }

  function createCell() {
    return document.createElement("td");
  }

  function renderRecords() {
    const searchTerm = normalizeText(elements.search.value.trim());
    const filteredRecords = records
      .filter((record) => {
        if (!searchTerm) return true;
        return [
          record.description,
          record.category,
          record.type,
          record.status,
        ].some((field) => normalizeText(field).includes(searchTerm));
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    elements.recordsBody.replaceChildren();

    filteredRecords.forEach((record) => {
      const row = document.createElement("tr");

      const dateCell = createCell();
      dateCell.textContent = formatDate(record.date);

      const descriptionCell = createCell();
      const title = document.createElement("span");
      title.className = "record-title";
      title.textContent = record.description;
      const category = document.createElement("span");
      category.className = "record-category";
      category.textContent = record.category;
      descriptionCell.append(title, category);

      const typeCell = createCell();
      const typeLabel = document.createElement("span");
      typeLabel.className = `type-label type-${record.type}`;
      typeLabel.textContent = formatType(record.type);
      typeCell.append(typeLabel);

      const amountCell = createCell();
      if (record.type === "atividade" || record.amount === null) {
        amountCell.textContent = "—";
      } else {
        amountCell.className =
          record.type === "receita" ? "amount-positive" : "amount-negative";
        amountCell.textContent = `${record.type === "despesa" ? "− " : "+ "}${currencyFormatter.format(Number(record.amount))}`;
      }

      const statusCell = createCell();
      const status = document.createElement("span");
      status.className = `record-status ${statusClass(record.status)}`;
      status.textContent = record.status;
      statusCell.append(status);

      const actionsCell = createCell();
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-record";
      deleteButton.type = "button";
      deleteButton.dataset.deleteId = record.id;
      deleteButton.setAttribute("aria-label", `Excluir ${record.description}`);
      deleteButton.textContent = "×";
      actionsCell.append(deleteButton);

      row.append(
        dateCell,
        descriptionCell,
        typeCell,
        amountCell,
        statusCell,
        actionsCell,
      );
      elements.recordsBody.append(row);
    });

    const resultLabel =
      filteredRecords.length === 1
        ? "1 registro"
        : `${filteredRecords.length} registros`;
    elements.resultsCount.textContent = resultLabel;
    elements.emptyState.hidden = filteredRecords.length > 0;
    elements.recordsBody.closest("table").hidden = filteredRecords.length === 0;
  }

  function renderMetrics() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const confirmedFinancialRecords = records.filter((record) => {
      if (
        !["receita", "despesa"].includes(record.type) ||
        record.status !== "Confirmada"
      )
        return false;
      const recordDate = new Date(`${record.date}T12:00:00`);
      return (
        recordDate.getFullYear() === currentYear &&
        recordDate.getMonth() === currentMonth
      );
    });

    const income = confirmedFinancialRecords
      .filter((record) => record.type === "receita")
      .reduce((total, record) => total + Number(record.amount || 0), 0);

    const expenses = confirmedFinancialRecords
      .filter((record) => record.type === "despesa")
      .reduce((total, record) => total + Number(record.amount || 0), 0);

    const pendingActivities = records.filter(
      (record) => record.type === "atividade" && record.status !== "Concluída",
    ).length;

    const profit = income - expenses;
    elements.incomeTotal.textContent = currencyFormatter.format(income);
    elements.expenseTotal.textContent = currencyFormatter.format(expenses);
    elements.profitTotal.textContent = currencyFormatter.format(profit);
    elements.profitTotal.style.color = profit < 0 ? "var(--danger-700)" : "";
    elements.pendingTotal.textContent = String(pendingActivities);
  }

  function renderAll() {
    renderRecords();
    renderMetrics();
  }

  function toggleSidebar(forceOpen) {
    const shouldOpen =
      typeof forceOpen === "boolean"
        ? forceOpen
        : !elements.sidebar.classList.contains("open");

    elements.sidebar.classList.toggle("open", shouldOpen);
    elements.sidebarBackdrop.hidden = !shouldOpen;
    elements.menuButton.setAttribute("aria-expanded", String(shouldOpen));
    document.body.classList.toggle("menu-open", shouldOpen);
  }

  function setActiveNavigation(moduleName) {
    document.querySelectorAll("[data-module]").forEach((item) => {
      const isActive = item.dataset.module === moduleName;
      item.classList.toggle("active", isActive);
      if (isActive) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  }

  function showDashboard() {
    activeModule = "dashboard";
    elements.dashboardView.hidden = false;
    elements.moduleView.hidden = true;
    elements.search.disabled = false;
    elements.search.placeholder = "Buscar nos últimos registros";
    setActiveNavigation("dashboard");
    toggleSidebar(false);
    document.title = "Dashboard | Controle Rural Simples";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showModule(moduleName) {
    const module = modules[moduleName];
    if (!module) return;

    activeModule = moduleName;
    elements.dashboardView.hidden = true;
    elements.moduleView.hidden = false;
    elements.moduleTitle.textContent = module.title;
    elements.moduleSymbol.textContent = module.symbol;
    elements.moduleDescription.textContent = module.description;
    elements.moduleFeatures.replaceChildren(
      ...module.features.map((feature) => {
        const item = document.createElement("li");
        item.textContent = feature;
        return item;
      }),
    );
    elements.search.value = "";
    elements.search.disabled = true;
    elements.search.placeholder = "Busca disponível no dashboard";
    setActiveNavigation(moduleName);
    toggleSidebar(false);
    document.title = `${module.title} | Controle Rural Simples`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateRecordForm(type) {
    const isActivity = type === "atividade";
    elements.amountField.hidden = isActivity;
    elements.recordAmount.required = !isActivity;
    elements.recordAmount.disabled = isActivity;
    elements.recordStatus.value = isActivity ? "Pendente" : "Confirmada";
    elements.recordDialogTitle.textContent =
      {
        receita: "Nova receita",
        despesa: "Nova despesa",
        atividade: "Nova atividade",
      }[type] || "Novo registro";
  }

  function openRecordDialog(type = "receita") {
    elements.recordForm.reset();
    elements.recordType.value = type;
    elements.recordDate.value = new Date().toISOString().slice(0, 10);
    updateRecordForm(type);
    elements.recordDialog.showModal();
    window.setTimeout(() => elements.recordDescription.focus(), 0);
  }

  function closeRecordDialog() {
    elements.recordDialog.close();
  }

  function createRecord(event) {
    event.preventDefault();
    if (!elements.recordForm.reportValidity()) return;

    const type = elements.recordType.value;
    const amount =
      type === "atividade" ? null : Number(elements.recordAmount.value);

    if (type !== "atividade" && (!Number.isFinite(amount) || amount <= 0)) {
      elements.recordAmount.setCustomValidity(
        "Informe um valor maior que zero.",
      );
      elements.recordAmount.reportValidity();
      return;
    }

    elements.recordAmount.setCustomValidity("");
    records.unshift({
      id:
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `record-${Date.now()}`,
      date: elements.recordDate.value,
      description: elements.recordDescription.value.trim(),
      category: elements.recordCategory.value.trim(),
      type,
      amount,
      status: elements.recordStatus.value,
    });

    saveRecords();
    renderAll();
    closeRecordDialog();
    showDashboard();
    showToast("Registro salvo e indicadores atualizados.");
  }

  function requestDelete(id) {
    pendingDeleteId = id;
    elements.deleteDialog.showModal();
  }

  function deleteRecord() {
    if (!pendingDeleteId) return;
    records = records.filter((record) => record.id !== pendingDeleteId);
    pendingDeleteId = null;
    saveRecords();
    renderAll();
    elements.deleteDialog.close();
    showToast("Registro excluído.");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 3200);
  }

  function handleModuleAction() {
    if (activeModule === "financeiro") {
      openRecordDialog("receita");
      return;
    }

    if (activeModule === "atividades") {
      openRecordDialog("atividade");
      return;
    }

    showToast(
      "O cadastro completo deste módulo será conectado ao banco de dados na próxima etapa.",
    );
  }

  function setCurrentDate() {
    const formattedDate = longDateFormatter.format(new Date());
    elements.currentDate.textContent =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  }

  elements.menuButton.addEventListener("click", () => toggleSidebar());
  elements.sidebarBackdrop.addEventListener("click", () =>
    toggleSidebar(false),
  );
  elements.backDashboard.addEventListener("click", showDashboard);
  elements.moduleAction.addEventListener("click", handleModuleAction);
  elements.search.addEventListener("input", renderRecords);
  elements.recordType.addEventListener("change", (event) =>
    updateRecordForm(event.target.value),
  );
  elements.recordAmount.addEventListener("input", () =>
    elements.recordAmount.setCustomValidity(""),
  );
  elements.recordForm.addEventListener("submit", createRecord);
  elements.confirmDelete.addEventListener("click", (event) => {
    event.preventDefault();
    deleteRecord();
  });

  document.querySelectorAll("[data-module]").forEach((item) => {
    item.addEventListener("click", () => {
      const moduleName = item.dataset.module;
      if (moduleName === "dashboard") {
        showDashboard();
      } else {
        showModule(moduleName);
      }
    });
  });

  document.querySelectorAll("[data-new-record]").forEach((button) => {
    button.addEventListener("click", () =>
      openRecordDialog(button.dataset.newRecord),
    );
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", closeRecordDialog);
  });

  elements.recordsBody.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-id]");
    if (deleteButton) requestDelete(deleteButton.dataset.deleteId);
  });

  [elements.recordDialog, elements.deleteDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.sidebar.classList.contains("open")) {
      toggleSidebar(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) toggleSidebar(false);
  });

  setCurrentDate();
  renderAll();
})();

