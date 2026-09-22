(() => {
  "use strict";

  const PREFERENCE_PREFIX = "controle-rural.selected-farm.v1.";
  const PENDING_PREFIX = "controle-rural.new-farm.v1.";
  const roles = { owner: "Dono da fazenda", gerente: "Gerente", vaqueiro: "Vaqueiro", caseiro: "Caseiro" };
  const dialog = document.querySelector("#farms-dialog");
  const openButton = document.querySelector("#farm-switch-open");
  const closeButton = document.querySelector("#farms-close");
  const list = document.querySelector("#farms-list");
  const form = document.querySelector("#farm-create-form");
  const nameInput = document.querySelector("#new-farm-name");
  const submit = document.querySelector("#farm-create-button");
  const feedback = document.querySelector("#farms-feedback");
  const deleteDialog = document.querySelector("#delete-farm-dialog");
  const deleteForm = document.querySelector("#delete-farm-form");
  const deleteName = document.querySelector("#delete-farm-name");
  const deleteInput = document.querySelector("#delete-farm-confirm-name");
  const deleteSubmit = document.querySelector("#delete-farm-submit");
  const deleteClose = document.querySelector("#delete-farm-close");
  const deleteCancel = document.querySelector("#delete-farm-cancel");
  const deleteFeedback = document.querySelector("#delete-farm-feedback");
  let account = null;
  let busy = false;
  let pendingCreation = null;
  let targetFarm = null;

  function readPreference(userId) {
    try { return localStorage.getItem(PREFERENCE_PREFIX + userId) || ""; }
    catch { return ""; }
  }

  function rememberFarm(userId, farmId) {
    try { localStorage.setItem(PREFERENCE_PREFIX + userId, farmId); }
    catch { /* The selected farm is also carried in the URL. */ }
  }

  function chooseMembership(userId, memberships) {
    const requested = new URL(window.location.href).searchParams.get("fazenda");
    return memberships.find((item) => item.farm_id === requested)
      || memberships.find((item) => item.farm_id === readPreference(userId))
      || memberships[0] || null;
  }

  function showFeedback(message, error = false) {
    feedback.textContent = message;
    feedback.dataset.state = error ? "error" : "info";
    feedback.hidden = !message;
  }

  function canChangeFarm() {
    if (!account || busy) return false;
    if (!navigator.onLine || account.offlineAccess) {
      showFeedback("Conecte-se à internet e atualize a página para criar ou trocar de fazenda.", true);
      return false;
    }
    const event = new CustomEvent("rural:before-farm-switch", { cancelable: true, detail: {} });
    if (!window.dispatchEvent(event)) {
      showFeedback(event.detail.reason || "Aguarde o salvamento terminar.", true);
      return false;
    }
    return true;
  }

  function navigateToFarm(farmId) {
    rememberFarm(account.userId, farmId);
    const url = new URL(window.location.href);
    url.searchParams.set("fazenda", farmId);
    url.hash = "dashboard";
    window.location.assign(url.href);
  }

  function switchFarm(farmId) {
    if (!account?.farms?.some((farm) => farm.farmId === farmId) || farmId === account.farmId) return;
    if (!canChangeFarm()) return;
    busy = true;
    render();
    showFeedback("Abrindo a fazenda...");
    navigateToFarm(farmId);
  }

  function openDeleteFarm(farm) {
    if (farm.farmId !== account?.farmId || account.role !== "owner" || !canChangeFarm()) return;
    targetFarm = farm;
    deleteName.textContent = farm.farmName;
    deleteInput.value = "";
    deleteFeedback.hidden = true;
    deleteSubmit.disabled = true;
    deleteDialog.showModal();
    deleteInput.focus();
  }

  function closeDeleteFarm() {
    if (busy) return;
    deleteDialog.close();
    targetFarm = null;
  }

  function showDeleteFeedback(message) {
    deleteFeedback.textContent = message;
    deleteFeedback.dataset.state = "error";
    deleteFeedback.hidden = !message;
  }

  async function deleteFarm(event) {
    event.preventDefault();
    const farm = targetFarm;
    if (!farm || account?.role !== "owner" || farm.farmId !== account.farmId || !canChangeFarm()) return;
    if (deleteInput.value !== farm.farmName) {
      showDeleteFeedback("Digite exatamente o nome da fazenda para confirmar.");
      return;
    }
    busy = true;
    render();
    deleteSubmit.disabled = true;
    deleteClose.disabled = true;
    deleteCancel.disabled = true;
    showDeleteFeedback("");
    try {
      let after = "";
      while (true) {
        const batch = await window.ruralSupabase.rpc("list_owned_farm_evidence", {
          p_farm_id: farm.farmId, p_after: after,
        });
        if (batch.error) throw batch.error;
        const paths = (batch.data || []).map((item) => item.path);
        if (!paths.length) break;
        if (paths.some((path) => typeof path !== "string" || !path.startsWith(farm.farmId + "/"))) {
          throw new Error("Não foi possível conferir as fotos da fazenda.");
        }
        const removed = await window.ruralSupabase.storage.from("task-evidence").remove(paths);
        if (removed.error || !Array.isArray(removed.data) || removed.data.length !== paths.length) {
          throw removed.error || new Error("Algumas fotos não foram removidas. Tente novamente.");
        }
        after = paths.at(-1);
      }
      const result = await window.ruralSupabase.rpc("delete_owned_farm", {
        p_farm_id: farm.farmId, p_name: farm.farmName,
      });
      if (result.error || result.data !== true) throw result.error || new Error("Não foi possível confirmar a exclusão.");
      window.ruralOffline?.purgeFarm?.(farm.farmId);
      if (account.legacyFarmId === farm.farmId) {
        try { localStorage.removeItem("controle-rural-simples.profissional.v1"); } catch { /* Best effort. */ }
      }
      try {
        if (localStorage.getItem(PREFERENCE_PREFIX + account.userId) === farm.farmId) {
          localStorage.removeItem(PREFERENCE_PREFIX + account.userId);
        }
      } catch { /* The next navigation verifies farm membership. */ }
      deleteDialog.close();
      const next = account.farms?.find((item) => item.farmId !== farm.farmId);
      if (next) navigateToFarm(next.farmId);
      else window.location.replace("login.html");
    } catch (error) {
      showDeleteFeedback(error?.message || "Falha ao excluir a fazenda. Os registros foram preservados; tente novamente.");
      busy = false;
      deleteClose.disabled = false;
      deleteCancel.disabled = false;
      deleteSubmit.disabled = deleteInput.value !== farm.farmName;
      render();
    }
  }

  function render() {
    if (!account) return;
    const farms = account.farms?.length ? account.farms : [account];
    list.replaceChildren(...farms.map((farm) => {
      const row = document.createElement("li");
      const info = document.createElement("div");
      const name = document.createElement("strong");
      const role = document.createElement("small");
      const button = document.createElement("button");
      const current = farm.farmId === account.farmId;
      name.textContent = farm.farmName;
      role.textContent = roles[farm.role] || "Membro da equipe";
      info.append(name, role);
      button.type = "button";
      button.className = "button button-secondary";
      button.textContent = current ? "Atual" : "Acessar";
      button.disabled = busy || current || !navigator.onLine || !!account.offlineAccess;
      button.setAttribute("aria-label", `${current ? "Fazenda atual:" : "Acessar"} ${farm.farmName}`);
      if (current) row.setAttribute("aria-current", "true");
      button.addEventListener("click", () => switchFarm(farm.farmId));
      const actions = document.createElement("div");
      actions.className = "farms-list-actions";
      actions.append(button);
      if (current && farm.role === "owner" && account.role === "owner") {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "button button-secondary farms-delete-button";
        remove.textContent = "Excluir";
        remove.disabled = busy || !navigator.onLine || !!account.offlineAccess;
        remove.setAttribute("aria-label", `Excluir fazenda ${farm.farmName}`);
        remove.addEventListener("click", () => openDeleteFarm(farm));
        actions.append(remove);
      }
      row.append(info, actions);
      return row;
    }));
    form.hidden = !farms.some((farm) => farm.role === "owner");
    submit.disabled = busy || !navigator.onLine || !!account.offlineAccess;
    nameInput.disabled = busy;
    closeButton.disabled = busy;
    submit.textContent = busy ? "Aguarde..." : "+ Criar fazenda";
  }

  function savePending(value) {
    pendingCreation = value;
    try {
      if (value) sessionStorage.setItem(PENDING_PREFIX + account.userId, JSON.stringify(value));
      else sessionStorage.removeItem(PENDING_PREFIX + account.userId);
    } catch { /* Keep the same operation ID in memory when storage is unavailable. */ }
  }

  async function createFarm(event) {
    event.preventDefault();
    if (account?.role !== "owner" || !canChangeFarm()) return;
    nameInput.setCustomValidity("");
    const name = nameInput.value.trim();
    if (name.length < 2) nameInput.setCustomValidity("Informe um nome com pelo menos 2 caracteres.");
    if (!form.reportValidity()) return;
    if (pendingCreation && pendingCreation.name !== name) {
      showFeedback(`Confirme primeiro a criação de “${pendingCreation.name}”: use esse nome e tente novamente, ou atualize a página para conferir suas fazendas.`, true);
      return;
    }
    if (!pendingCreation) savePending({ id: crypto.randomUUID(), name });
    busy = true;
    render();
    showFeedback("Criando sua fazenda...");
    try {
      const { data, error } = await window.ruralSupabase.rpc("create_owned_farm", {
        p_name: name, p_farm_id: pendingCreation.id,
      });
      if (error) {
        // A definite HTTP error can be corrected; an uncertain network result must reuse the ID.
        if (error.code && !["", "504", "57014"].includes(error.code)) savePending(null);
        throw error;
      }
      const created = data?.[0];
      if (!created?.farm_id) throw new Error("Resposta incompleta. Tente novamente para confirmar a criação.");
      savePending(null);
      showFeedback("Fazenda criada! Abrindo o painel...");
      navigateToFarm(created.farm_id);
    } catch (error) {
      showFeedback(error?.message || "Não foi possível criar a fazenda. Tente novamente.", true);
      busy = false;
      render();
    }
  }

  window.ruralFarms = { chooseMembership, rememberFarm };
  if (!dialog || !openButton) return;
  openButton.addEventListener("click", () => {
    render();
    showFeedback(navigator.onLine && !account?.offlineAccess ? "" : "Sem internet: você pode usar a última fazenda aberta. Conecte-se e atualize a página para trocar.");
    dialog.showModal();
  });
  closeButton.addEventListener("click", () => { if (!busy) dialog.close(); });
  dialog.addEventListener("cancel", (event) => { if (busy) event.preventDefault(); });
  deleteClose.addEventListener("click", closeDeleteFarm);
  deleteCancel.addEventListener("click", closeDeleteFarm);
  deleteDialog.addEventListener("cancel", (event) => { if (busy) event.preventDefault(); else targetFarm = null; });
  deleteInput.addEventListener("input", () => {
    deleteSubmit.disabled = busy || !targetFarm || deleteInput.value !== targetFarm.farmName;
    showDeleteFeedback("");
  });
  deleteForm.addEventListener("submit", deleteFarm);
  form.addEventListener("submit", createFarm);
  nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));
  window.addEventListener("online", render);
  window.addEventListener("offline", render);
  window.addEventListener("rural:account-ready", (event) => {
    account = event.detail;
    try {
      pendingCreation = JSON.parse(sessionStorage.getItem(PENDING_PREFIX + account.userId) || "null");
      if (account.farms?.some((farm) => farm.farmId === pendingCreation?.id)) savePending(null);
      if (pendingCreation) nameInput.value = pendingCreation.name;
    } catch { pendingCreation = null; }
    openButton.disabled = false;
    render();
  });
})();
