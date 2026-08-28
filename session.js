(() => {
  "use strict";

  const client = window.getRuralSupabase();
  const roleLabels = { owner: "Dono", vaqueiro: "Vaqueiro", caseiro: "Caseiro" };
  const allowedViews = {
    owner: ["dashboard", "financeiro", "agenda", "plantacoes", "animais"],
    vaqueiro: ["dashboard", "agenda", "animais"],
    caseiro: ["dashboard", "agenda", "plantacoes"],
  };

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function applyRolePermissions(role) {
    document.body.dataset.role = role;
    const allowed = allowedViews[role] || ["dashboard"];
    document.querySelectorAll("[data-view]").forEach((item) => {
      if (!allowed.includes(item.dataset.view)) item.dataset.roleHidden = "true";
    });
    document.querySelectorAll(".app-view[data-page]").forEach((view) => {
      if (!allowed.includes(view.dataset.page)) view.dataset.roleHidden = "true";
    });
    document.querySelectorAll('[data-open-dialog="transaction"]').forEach((button) => {
      if (role !== "owner") button.dataset.roleHidden = "true";
    });
    document.querySelectorAll('[data-open-dialog="crop"]').forEach((button) => {
      if (!allowed.includes("plantacoes")) button.dataset.roleHidden = "true";
    });
    document.querySelectorAll('[data-open-dialog="animal"]').forEach((button) => {
      if (!allowed.includes("animais")) button.dataset.roleHidden = "true";
    });
    document.querySelectorAll("[data-owner-only]").forEach((element) => {
      element.hidden = role !== "owner";
    });
  }

  async function loadAccount() {
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      location.replace("login.html#entrar");
      return;
    }

    const { data: membership, error: membershipError } = await client
      .from("farm_members")
      .select("farm_id, role, status, farms(name)")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError || !membership) {
      await client.auth.signOut();
      location.replace("login.html#entrar");
      return;
    }

    const { data: profile } = await client
      .from("profiles")
      .select("full_name")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const fullName = profile?.full_name || session.user.user_metadata?.full_name || session.user.email;
    const role = membership.role;
    const farmName = membership.farms?.name || "Minha propriedade";

    document.querySelectorAll("[data-account-name]").forEach((element) => { element.textContent = fullName; });
    document.querySelectorAll("[data-account-role]").forEach((element) => { element.textContent = roleLabels[role] || role; });
    document.querySelectorAll("[data-account-initials]").forEach((element) => { element.textContent = initials(fullName); });
    document.querySelectorAll("[data-farm-name]").forEach((element) => { element.textContent = farmName; });
    applyRolePermissions(role);
    document.body.classList.remove("auth-checking");
  }

  document.addEventListener("click", async (event) => {
    const logoutButton = event.target.closest("[data-sign-out]");
    if (!logoutButton) return;
    logoutButton.disabled = true;
    await client.auth.signOut();
    location.replace("login.html#entrar");
  });

  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") location.replace("login.html#entrar");
  });

  loadAccount().catch(async () => {
    await client.auth.signOut();
    location.replace("login.html#entrar");
  });
})();

