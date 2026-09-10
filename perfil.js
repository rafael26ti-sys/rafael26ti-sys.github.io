(() => {
  "use strict";

  const client = window.ruralSupabase;
  const dialog = document.querySelector("#profile-dialog");
  const form = document.querySelector("#profile-form");
  const fullNameInput = document.querySelector("#profile-full-name");
  const emailInput = document.querySelector("#profile-email");
  const roleInput = document.querySelector("#profile-role");
  const farmInput = document.querySelector("#profile-farm");
  const summaryName = document.querySelector("#profile-summary-name");
  const avatar = document.querySelector("#profile-avatar");
  const feedback = document.querySelector("#profile-feedback");
  const saveButton = document.querySelector("#profile-save-button");
  const roleLabels = { owner: "Dono da fazenda", vaqueiro: "Vaqueiro", caseiro: "Caseiro" };
  let account = window.ruralAccount || null;

  function initials(name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "CR";
  }

  function normalizedName(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function setFeedback(message = "", state = "") {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.dataset.state = state;
    feedback.hidden = !message;
  }

  function setSaving(saving) {
    if (!saveButton) return;
    saveButton.disabled = saving;
    saveButton.textContent = saving ? "Salvando..." : "Salvar alterações";
  }

  function fillProfile() {
    if (!account) return;
    fullNameInput.value = account.fullName || "";
    emailInput.value = account.email || "";
    roleInput.value = roleLabels[account.role] || "Membro da equipe";
    farmInput.value = account.farmName || "";
    summaryName.textContent = account.fullName || "Usuário Rural";
    avatar.textContent = initials(account.fullName || "");
  }

  function openProfile() {
    if (!dialog || !account) return;
    fillProfile();
    setFeedback();
    dialog.showModal();
    fullNameInput.focus();
  }

  function closeProfile() {
    if (dialog?.open) dialog.close();
  }

  function updateVisibleProfile(fullName) {
    account.fullName = fullName;
    if (window.ruralAccount) window.ruralAccount.fullName = fullName;

    const userChip = document.querySelector("#profile-open-button");
    const roleName = roleLabels[account.role] || "Membro da equipe";
    if (userChip) {
      userChip.querySelector("span").textContent = initials(fullName);
      userChip.querySelector("strong").textContent = fullName;
      userChip.setAttribute("aria-label", `${fullName}, ${roleName}`);
    }
    summaryName.textContent = fullName;
    avatar.textContent = initials(fullName);
    window.dispatchEvent(new CustomEvent("rural:profile-updated", { detail: { fullName } }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!client || !account) {
      setFeedback("Não foi possível acessar sua conta. Atualize a página e tente novamente.", "error");
      return;
    }

    const fullName = normalizedName(fullNameInput.value);
    if (fullName.length < 2 || fullName.length > 100) {
      setFeedback("Informe um nome entre 2 e 100 caracteres.", "error");
      fullNameInput.focus();
      return;
    }
    if (fullName === account.fullName) {
      setFeedback("Seu nome já está atualizado.", "success");
      return;
    }

    setSaving(true);
    setFeedback();
    try {
      const { data, error } = await client.functions.invoke("update-profile", {
        body: { full_name: fullName },
      });
      if (error || data?.error) throw error || new Error(data.error);
      const savedName = normalizedName(data?.profile?.full_name || fullName);
      updateVisibleProfile(savedName);
      setFeedback("Perfil atualizado com sucesso.", "success");
    } catch (error) {
      console.error("Falha ao atualizar o perfil.", error);
      setFeedback("Não foi possível salvar o perfil. Tente novamente.", "error");
    } finally {
      setSaving(false);
    }
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("#profile-open-button, #sidebar-profile-button")) openProfile();
    if (event.target.closest("[data-close-profile]")) closeProfile();
  });

  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeProfile();
  });
  form?.addEventListener("submit", saveProfile);
  window.addEventListener("rural:account-ready", (event) => {
    account = event.detail;
  });
})();
