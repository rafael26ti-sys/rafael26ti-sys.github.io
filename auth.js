(() => {
  "use strict";

  const client = window.getRuralSupabase();
  const loginTab = document.querySelector("#login-tab");
  const signupTab = document.querySelector("#signup-tab");
  const loginPanel = document.querySelector("#login-panel");
  const signupPanel = document.querySelector("#signup-panel");
  const loginForm = document.querySelector("#login-form");
  const signupForm = document.querySelector("#signup-form");
  const farmNameField = document.querySelector("#farm-name-field");
  const inviteCodeField = document.querySelector("#invite-code-field");
  const feedback = document.querySelector("#auth-feedback");

  const roleLabels = { owner: "dono", vaqueiro: "vaqueiro", caseiro: "caseiro" };

  function setFeedback(message, type = "") {
    feedback.textContent = message;
    feedback.dataset.type = type;
  }

  function setBusy(form, busy) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = busy;
    button.dataset.originalText ||= button.textContent;
    button.textContent = busy ? "Aguarde…" : button.dataset.originalText;
  }

  function showPanel(panel) {
    const signupActive = panel === "signup";
    loginPanel.hidden = signupActive;
    signupPanel.hidden = !signupActive;
    loginTab.classList.toggle("active", !signupActive);
    signupTab.classList.toggle("active", signupActive);
    loginTab.setAttribute("aria-selected", String(!signupActive));
    signupTab.setAttribute("aria-selected", String(signupActive));
    history.replaceState(null, "", signupActive ? "#cadastro" : "#entrar");
    setFeedback("");
  }

  async function getMembership(userId) {
    const { data, error } = await client
      .from("farm_members")
      .select("farm_id, role, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function finishOnboarding(user) {
    const existingMembership = await getMembership(user.id);
    if (existingMembership) return existingMembership;

    const metadata = user.user_metadata || {};
    const role = metadata.onboarding_role;
    const fullName = metadata.full_name;

    if (role === "owner") {
      const { data, error } = await client.rpc("complete_owner_onboarding", {
        p_full_name: fullName,
        p_farm_name: metadata.farm_name,
      });
      if (error) throw error;
      return data?.[0];
    }

    if (role === "vaqueiro" || role === "caseiro") {
      const { data, error } = await client.rpc("accept_farm_invite", {
        p_full_name: fullName,
        p_code: metadata.invite_code,
        p_requested_role: role,
      });
      if (error) throw error;
      return data?.[0];
    }

    throw new Error("Sua conta ainda não está vinculada a uma propriedade.");
  }

  document.querySelectorAll('input[name="role"]').forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelectorAll(".role-option").forEach((option) => option.classList.remove("active"));
      input.closest(".role-option").classList.add("active");
      const owner = input.value === "owner";
      farmNameField.hidden = !owner;
      inviteCodeField.hidden = owner;
      signupForm.elements.farmName.required = owner;
      signupForm.elements.inviteCode.required = !owner;
    });
  });

  loginTab.addEventListener("click", () => showPanel("login"));
  signupTab.addEventListener("click", () => showPanel("signup"));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    setBusy(loginForm, true);
    setFeedback("Conferindo seus dados…");
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value,
      });
      if (error) throw error;
      await finishOnboarding(data.user);
      location.replace("painel.html");
    } catch (error) {
      setFeedback(error.message || "Não foi possível entrar. Confira e-mail e senha.", "error");
    } finally {
      setBusy(loginForm, false);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!signupForm.reportValidity()) return;
    const role = signupForm.elements.role.value;
    const fullName = signupForm.elements.fullName.value.trim();
    const farmName = signupForm.elements.farmName.value.trim();
    const inviteCode = signupForm.elements.inviteCode.value.trim().toUpperCase();
    setBusy(signupForm, true);
    setFeedback(`Criando sua conta de ${roleLabels[role]}…`);
    try {
      const { data, error } = await client.auth.signUp({
        email: signupForm.elements.email.value.trim(),
        password: signupForm.elements.password.value,
        options: {
          emailRedirectTo: "https://rafael26ti-sys.github.io/login.html",
          data: {
            full_name: fullName,
            onboarding_role: role,
            farm_name: role === "owner" ? farmName : null,
            invite_code: role === "owner" ? null : inviteCode,
          },
        },
      });
      if (error) throw error;
      if (data.session && data.user) {
        await finishOnboarding(data.user);
        location.replace("painel.html");
        return;
      }
      signupForm.reset();
      setFeedback("Conta criada. Confirme o e-mail recebido e depois entre no sistema.", "success");
    } catch (error) {
      setFeedback(error.message || "Não foi possível criar a conta.", "error");
    } finally {
      setBusy(signupForm, false);
    }
  });

  (async () => {
    if (location.hash === "#cadastro") showPanel("signup");
    const { data } = await client.auth.getSession();
    if (data.session?.user) {
      try {
        await finishOnboarding(data.session.user);
        location.replace("painel.html");
      } catch (error) {
        setFeedback(error.message, "error");
      }
    }
  })();
})();

