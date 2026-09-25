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
  const joinForm = document.querySelector("#farm-join-form");
  const joinCode = document.querySelector("#farm-join-code");
  const joinRole = document.querySelector("#farm-join-role");
  const joinSubmit = document.querySelector("#farm-join-button");
  const feedback = document.querySelector("#farms-feedback");
  const deleteDialog = document.querySelector("#delete-farm-dialog");
  const deleteForm = document.querySelector("#delete-farm-form");
  const deleteName = document.querySelector("#delete-farm-name");
  const deleteInput = document.querySelector("#delete-farm-confirm-name");
  const deleteSubmit = document.querySelector("#delete-farm-submit");
  const deleteClose = document.querySelector("#delete-farm-close");
  const deleteCancel = document.querySelector("#delete-farm-cancel");
  const deleteFeedback = document.querySelector("#delete-farm-feedback");
  const locationDialog = document.querySelector("#farm-location-dialog");
  const locationForm = document.querySelector("#farm-location-form");
  const locationClose = document.querySelector("#farm-location-close");
  const locationCity = document.querySelector("#farm-location-city");
  const locationSearch = document.querySelector("#farm-location-search");
  const locationCurrent = document.querySelector("#farm-location-current");
  const locationLatitude = document.querySelector("#farm-location-latitude");
  const locationLongitude = document.querySelector("#farm-location-longitude");
  const locationFeedback = document.querySelector("#farm-location-feedback");
  const locationSave = document.querySelector("#farm-location-save");
  const locationClear = document.querySelector("#farm-location-clear");
  let account = null;
  let busy = false;
  let pendingCreation = null;
  let targetFarm = null;
  let locationFarm = null;
  let map = null;
  let marker = null;

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

  function coordinates(farm) {
    const latitude = Number(farm?.locationLatitude);
    const longitude = Number(farm?.locationLongitude);
    return farm?.locationLatitude != null && farm?.locationLongitude != null
      && Number.isFinite(latitude) && Number.isFinite(longitude)
      && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
      ? { latitude, longitude } : null;
  }

  function showLocationFeedback(message, error = false) {
    locationFeedback.textContent = message;
    locationFeedback.dataset.state = error ? "error" : "info";
    locationFeedback.hidden = !message;
  }

  function markLocation(latitude, longitude, center = true) {
    locationLatitude.value = latitude.toFixed(6);
    locationLongitude.value = longitude.toFixed(6);
    if (!map) return;
    if (marker) marker.setLatLng([latitude, longitude]);
    else marker = window.L.circleMarker([latitude, longitude], {
      radius: 9, color: "#143d2b", weight: 3, fillColor: "#e7ae3b", fillOpacity: 1,
    }).addTo(map);
    if (center) map.setView([latitude, longitude], Math.max(map.getZoom(), 14));
  }

  function openLocation(farm) {
    if (farm.farmId !== account?.farmId || account.role !== "owner" || !navigator.onLine || account.offlineAccess || busy) return;
    locationFarm = farm;
    const saved = coordinates(farm);
    locationLatitude.value = saved ? saved.latitude.toFixed(6) : "";
    locationLongitude.value = saved ? saved.longitude.toFixed(6) : "";
    locationCity.value = "";
    locationClear.hidden = !saved;
    showLocationFeedback("");
    locationDialog.showModal();
    if (!window.L) {
      showLocationFeedback("O mapa não carregou. Informe as coordenadas manualmente ou tente novamente mais tarde.", true);
      return;
    }
    if (!map) {
      map = window.L.map("farm-location-map", { scrollWheelZoom: false });
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.on("click", (event) => {
        markLocation(event.latlng.lat, event.latlng.lng, false);
        showLocationFeedback("");
      });
    }
    if (marker) { marker.remove(); marker = null; }
    map.setView(saved ? [saved.latitude, saved.longitude] : [-16, -51], saved ? 14 : 4);
    if (saved) markLocation(saved.latitude, saved.longitude, false);
    map.invalidateSize();
  }

  function closeLocation() {
    if (!busy) locationDialog.close();
  }

  async function searchCity() {
    const query = locationCity.value.trim();
    const requestedFarm = locationFarm;
    if (query.length < 2 || !map || busy) {
      showLocationFeedback("Informe o nome de uma cidade para aproximar o mapa.", true);
      return;
    }
    const [name, state = ""] = query.split(",").map((part) => part.trim());
    locationSearch.disabled = true;
    showLocationFeedback("Buscando cidade...");
    try {
      const params = new URLSearchParams({ name, count: "10", language: "pt", format: "json" });
      const response = await fetch("https://geocoding-api.open-meteo.com/v1/search?" + params);
      if (!response.ok) throw new Error("Cidade indisponível");
      const results = (await response.json()).results || [];
      const normalized = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const brazil = results.filter((item) => item.country_code === "BR");
      const city = brazil.find((item) => state && normalized(item.admin1).includes(normalized(state)))
        || brazil[0] || results[0];
      if (!city) throw new Error("Cidade não encontrada. Tente informar cidade e estado.");
      if (!locationDialog.open || locationFarm !== requestedFarm) return;
      map.setView([city.latitude, city.longitude], 11);
      if (marker) { marker.remove(); marker = null; }
      locationLatitude.value = "";
      locationLongitude.value = "";
      showLocationFeedback("Cidade encontrada. Aproxime o mapa e toque no ponto da fazenda.");
    } catch (error) {
      showLocationFeedback(error?.message || "Não foi possível buscar a cidade.", true);
    } finally {
      locationSearch.disabled = false;
    }
  }

  function useCurrentPosition() {
    if (!locationFarm || busy || !locationDialog.open) return;
    if (!navigator.geolocation?.getCurrentPosition) {
      showLocationFeedback("Este aparelho não oferece localização. Toque no mapa ou informe as coordenadas.", true);
      return;
    }
    const requestedFarm = locationFarm;
    locationCurrent.disabled = true;
    showLocationFeedback("Buscando sua posição. Autorize o acesso quando o navegador solicitar...");
    navigator.geolocation.getCurrentPosition((position) => {
      locationCurrent.disabled = false;
      if (!locationDialog.open || locationFarm !== requestedFarm || busy) return;
      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        showLocationFeedback("Não foi possível determinar as coordenadas deste aparelho.", true);
        return;
      }
      markLocation(latitude, longitude);
      showLocationFeedback(`Ponto encontrado (precisão aproximada: ${Math.round(accuracy)} m). Confira no mapa e salve.`);
    }, (error) => {
      locationCurrent.disabled = false;
      if (!locationDialog.open || locationFarm !== requestedFarm) return;
      const message = error.code === 1 ? "A localização foi negada. Permita o acesso no navegador ou marque no mapa."
        : error.code === 3 ? "A busca da sua posição demorou demais. Tente novamente ou marque no mapa."
          : "Não foi possível obter sua posição. Marque no mapa ou informe as coordenadas.";
      showLocationFeedback(message, true);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }

  async function saveLocation(event, clear = false) {
    event?.preventDefault();
    const farm = locationFarm;
    if (!farm || farm.farmId !== account?.farmId || account.role !== "owner" || busy) return;
    if (!canChangeFarm()) {
      showLocationFeedback(feedback.textContent || "Aguarde o salvamento terminar.", true);
      return;
    }
    const latitudeText = locationLatitude.value.trim();
    const longitudeText = locationLongitude.value.trim();
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    if (!clear && (!latitudeText || !longitudeText || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180)) {
      showLocationFeedback("Informe latitude entre -90 e 90 e longitude entre -180 e 180.", true);
      return;
    }
    busy = true;
    render();
    showLocationFeedback(clear ? "Removendo localização..." : "Salvando localização...");
    try {
      const { data, error } = await window.ruralSupabase.from("farms")
        .update({ location_latitude: clear ? null : latitude, location_longitude: clear ? null : longitude })
        .eq("id", farm.farmId).eq("owner_id", account.userId)
        .select("location_latitude, location_longitude").single();
      if (error || !data) throw error || new Error("A localização não foi salva.");
      farm.locationLatitude = data.location_latitude;
      farm.locationLongitude = data.location_longitude;
      account.locationLatitude = data.location_latitude;
      account.locationLongitude = data.location_longitude;
      window.ruralOffline?.saveAccount?.(account);
      window.dispatchEvent(new CustomEvent("rural:farm-location-updated", {
        detail: { farmId: farm.farmId, farmName: farm.farmName,
          latitude: data.location_latitude, longitude: data.location_longitude },
      }));
      locationDialog.close();
      showFeedback(clear ? "Localização removida." : "Localização salva para esta fazenda.");
    } catch (error) {
      showLocationFeedback(error?.message || "Não foi possível salvar a localização.", true);
    } finally {
      busy = false;
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
      const position = coordinates(farm);
      if (position) {
        const mapsLink = document.createElement("a");
        mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${position.latitude},${position.longitude}`)}`;
        mapsLink.target = "_blank";
        mapsLink.rel = "noopener noreferrer";
        mapsLink.textContent = "Ver localização no Google Maps";
        mapsLink.setAttribute("aria-label", `Ver ${farm.farmName} no Google Maps`);
        info.append(mapsLink);
      } else {
        const missing = document.createElement("small");
        missing.textContent = "Localização não cadastrada";
        info.append(missing);
      }
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
        const locate = document.createElement("button");
        locate.type = "button";
        locate.className = "button button-secondary";
        locate.textContent = position ? "Editar localização" : "Marcar no mapa";
        locate.disabled = busy || !navigator.onLine || !!account.offlineAccess;
        locate.setAttribute("aria-label", `${position ? "Editar localização de" : "Marcar no mapa"} ${farm.farmName}`);
        locate.addEventListener("click", () => openLocation(farm));
        actions.append(locate);
      }
      row.append(info, actions);
      return row;
    }));
    form.hidden = !farms.some((farm) => farm.role === "owner");
    submit.disabled = busy || !navigator.onLine || !!account.offlineAccess;
    joinSubmit.disabled = busy || !navigator.onLine || !!account.offlineAccess;
    nameInput.disabled = busy;
    closeButton.disabled = busy;
    locationClose.disabled = busy;
    locationSave.disabled = busy || !navigator.onLine || !!account.offlineAccess;
    locationClear.disabled = busy || !navigator.onLine || !!account.offlineAccess;
    locationCurrent.disabled = busy || !navigator.onLine || !!account.offlineAccess;
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

  async function joinFarm(event) {
    event.preventDefault();
    if (!account || !canChangeFarm() || !joinForm.reportValidity()) return;
    const code = joinCode.value.trim().toUpperCase();
    const role = joinRole.value;
    if (!code || !["gerente", "vaqueiro", "caseiro"].includes(role)) return;
    busy = true;
    render();
    showFeedback("Conferindo convite...");
    try {
      const { data, error } = await window.ruralSupabase.rpc("accept_farm_invite", {
        p_full_name: account.fullName, p_code: code, p_requested_role: role,
      });
      if (error || !data?.[0]?.farm_id) throw error || new Error("Não foi possível confirmar o convite.");
      showFeedback("Convite aceito. Abrindo a nova fazenda...");
      navigateToFarm(data[0].farm_id);
    } catch (error) {
      showFeedback(error?.message || "Não foi possível entrar na fazenda.", true);
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
  locationClose.addEventListener("click", closeLocation);
  locationDialog.addEventListener("cancel", (event) => { if (busy) event.preventDefault(); });
  locationDialog.addEventListener("close", () => { locationFarm = null; });
  locationForm.addEventListener("submit", saveLocation);
  locationClear.addEventListener("click", () => saveLocation(null, true));
  locationSearch.addEventListener("click", searchCity);
  locationCurrent.addEventListener("click", useCurrentPosition);
  locationCity.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); searchCity(); }
  });
  for (const input of [locationLatitude, locationLongitude]) input.addEventListener("change", () => {
    const latitude = Number(locationLatitude.value);
    const longitude = Number(locationLongitude.value);
    if (locationLatitude.value && locationLongitude.value && Number.isFinite(latitude)
      && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      markLocation(latitude, longitude);
      showLocationFeedback("");
    }
  });
  form.addEventListener("submit", createFarm);
  joinForm.addEventListener("submit", joinFarm);
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
