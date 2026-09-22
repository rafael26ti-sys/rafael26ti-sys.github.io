(() => {
  "use strict";

  const client = window.ruralSupabase;
  const roleLabels = { owner: "Dono da fazenda", vaqueiro: "Vaqueiro", caseiro: "Caseiro" };
  let protectedUserId = "";

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

  function isNetworkFailure(error) {
    return (
      !navigator.onLine ||
      /fetch|network|offline|timeout|failed to fetch/i.test(
        `${error?.message || ""} ${error?.details || ""}`,
      )
    );
  }

  function cachedAccountFor(user) {
    return user?.id
      ? window.ruralOffline?.getAccount?.(user.id) || null
      : window.ruralOffline?.getLatestAccount?.() || null;
  }

  function activateAccount(account) {
    const fullName = account.fullName;
    const farmName = account.farmName;
    const roleName = roleLabels[account.role] || "Membro da equipe";
    protectedUserId = account.userId;
    window.ruralAccount = account;
    const propertyName = document.querySelector("#property-name");
    const propertyRole = document.querySelector("#property-role");
    if (propertyName) propertyName.textContent = farmName;
    if (propertyRole) propertyRole.textContent = roleName;

    const topbarActions = document.querySelector(".topbar-actions");
    const userChip = document.createElement("button");
    userChip.type = "button";
    userChip.id = "profile-open-button";
    userChip.className = "user-chip";
    userChip.setAttribute("aria-haspopup", "dialog");
    userChip.setAttribute("aria-label", `${fullName}, ${roleName}`);
    userChip.title = "Editar meu perfil";
    userChip.innerHTML = '<span aria-hidden="true"></span><div><strong></strong><small></small></div>';
    userChip.querySelector("span").textContent = initials(fullName);
    userChip.querySelector("strong").textContent = fullName;
    userChip.querySelector("small").textContent = account.offlineAccess
      ? `${roleName} · sem internet`
      : roleName;
    topbarActions?.append(userChip);

    document.querySelector("#logout-button")?.addEventListener("click", async () => {
      window.ruralOffline?.signOutAccount?.(account);
      await client?.auth.signOut({ scope: "local" });
      window.location.replace("login.html");
    });

    window.dispatchEvent(new CustomEvent("rural:account-ready", { detail: account }));
    document.body.classList.remove("auth-checking");
  }

  function activateCachedAccount(user) {
    const cached = cachedAccountFor(user);
    if (!cached) return false;
    activateAccount(cached);
    return true;
  }

  async function loadProtectedAccount() {
    if (!client) {
      if (!navigator.onLine && activateCachedAccount(null)) return;
      goToLogin("connection");
      return;
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    const user = sessionData?.session?.user;
    if (sessionError || !user) {
      if (!navigator.onLine && activateCachedAccount(user)) return;
      goToLogin("session");
      return;
    }

    if (!navigator.onLine) {
      if (!activateCachedAccount(user)) goToLogin("offline");
      return;
    }

    let currentUserData;
    try {
      const currentUserResult = await client.auth.getUser();
      if (currentUserResult.error) throw currentUserResult.error;
      currentUserData = currentUserResult.data;
    } catch (error) {
      if (isNetworkFailure(error) && activateCachedAccount(user)) return;
      goToLogin("session");
      return;
    }

    if (currentUserData?.user?.id !== user.id) {
      window.location.reload();
      return;
    }

    let membershipResult;
    try {
      membershipResult = await client
        .from("farm_members")
        .select("farm_id, role, created_at, farms(name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .order("farm_id", { ascending: true });
    } catch (error) {
      if (isNetworkFailure(error) && activateCachedAccount(user)) return;
      goToLogin("onboarding");
      return;
    }

    const { data: memberships, error: membershipError } = membershipResult;
    const membership = window.ruralFarms?.chooseMembership(user.id, memberships || []);

    if (membershipError || !membership) {
      if (isNetworkFailure(membershipError) && activateCachedAccount(user)) return;
      goToLogin("onboarding");
      return;
    }

    let farmResult;
    let profileResult;
    try {
      [farmResult, profileResult] = await Promise.all([
        client.from("farms").select("name").eq("id", membership.farm_id).single(),
        client.from("profiles").select("full_name").eq("user_id", user.id).single(),
      ]);
    } catch (error) {
      if (isNetworkFailure(error) && activateCachedAccount(user)) return;
      goToLogin("profile");
      return;
    }

    if (farmResult.error || profileResult.error) {
      if (
        (isNetworkFailure(farmResult.error) || isNetworkFailure(profileResult.error)) &&
        activateCachedAccount(user)
      ) {
        return;
      }
      goToLogin("profile");
      return;
    }

    const fullName = profileResult.data.full_name;
    const farmName = farmResult.data.name;
    const account = {
      userId: user.id,
      farmId: membership.farm_id,
      role: membership.role,
      fullName,
      farmName,
      email: user.email || "",
      legacyFarmId: memberships[0].farm_id,
      farms: memberships.map((item) => ({
        farmId: item.farm_id,
        farmName: (Array.isArray(item.farms) ? item.farms[0] : item.farms)?.name || "Minha fazenda",
        role: item.role,
      })),
    };
    window.ruralFarms?.rememberFarm(user.id, membership.farm_id);
    window.ruralOffline?.saveAccount?.(account);
    activateAccount(account);
  }

  client?.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") goToLogin();
    if (
      protectedUserId &&
      ["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event) &&
      session?.user?.id !== protectedUserId
    ) {
      window.ruralAccount = null;
      document.body.classList.add("auth-checking");
      window.location.reload();
    }
  });

  loadProtectedAccount().catch(() => goToLogin("unexpected"));
})();
