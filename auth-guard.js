(() => {
  "use strict";

  const client = window.ruralSupabase;
  const roleLabels = { owner: "Dono da fazenda", vaqueiro: "Vaqueiro", caseiro: "Caseiro" };

  function goToLogin(reason = "") {
    const returnPath = `painel.html${window.location.hash || "#dashboard"}`;
    const query = new URLSearchParams({ return: returnPath });
    if (reason) query.set("reason", reason);
    window.location.replace(`login.html?${query.toString()}`);
  }

  function initials(name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "CR";
  }

  async function loadProtectedAccount() {
    if (!client) {
      goToLogin("connection");
      return;
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    const user = sessionData?.session?.user;
    if (sessionError || !user) {
      goToLogin("session");
      return;
    }

    const { data: membership, error: membershipError } = await client
      .from("farm_members")
      .select("farm_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membershipError || !membership) {
      goToLogin("onboarding");
      return;
    }

    const [farmResult, profileResult] = await Promise.all([
      client.from("farms").select("name").eq("id", membership.farm_id).single(),
      client.from("profiles").select("full_name").eq("user_id", user.id).single(),
    ]);

    if (farmResult.error || profileResult.error) {
      goToLogin("profile");
      return;
    }

    const fullName = profileResult.data.full_name;
    const farmName = farmResult.data.name;
    const roleName = roleLabels[membership.role] || "Membro da equipe";
    window.ruralAccount = {
      userId: user.id,
      farmId: membership.farm_id,
      role: membership.role,
      fullName,
      farmName,
    };
    const propertyName = document.querySelector("#property-name");
    const propertyRole = document.querySelector("#property-role");
    if (propertyName) propertyName.textContent = farmName;
    if (propertyRole) propertyRole.textContent = roleName;

    const topbarActions = document.querySelector(".topbar-actions");
    const userChip = document.createElement("div");
    userChip.className = "user-chip";
    userChip.setAttribute("aria-label", `${fullName}, ${roleName}`);
    userChip.innerHTML = `<span aria-hidden="true">${initials(fullName)}</span><div><strong></strong><small></small></div>`;
    userChip.querySelector("strong").textContent = fullName;
    userChip.querySelector("small").textContent = roleName;
    topbarActions?.append(userChip);

    document.querySelector("#logout-button")?.addEventListener("click", async () => {
      await client.auth.signOut();
      window.location.replace("login.html");
    });

    window.dispatchEvent(
      new CustomEvent("rural:account-ready", { detail: window.ruralAccount }),
    );
    document.body.classList.remove("auth-checking");
  }

  client?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") goToLogin();
  });

  loadProtectedAccount().catch(() => goToLogin("unexpected"));
})();
