(() => {
  "use strict";

  const client = window.ruralSupabase;
  const tabs = [...document.querySelectorAll("[data-auth-panel]")];
  const signInPanel = document.querySelector("#signin-panel");
  const signUpPanel = document.querySelector("#signup-panel");
  const onboardingPanel = document.querySelector("#onboarding-panel");
  const signInForm = document.querySelector("#signin-form");
  const signUpForm = document.querySelector("#signup-form");
  const onboardingForm = document.querySelector("#onboarding-form");
  const title = document.querySelector("#auth-title");
  const subtitle = document.querySelector("#auth-subtitle");
  const returnTarget = getSafeReturnTarget();

  function getSafeReturnTarget() {
    const requested = new URLSearchParams(window.location.search).get("return") || "";
    return /^painel\.html(?:#[a-z-]+)?$/.test(requested) ? requested : "painel.html#dashboard";
  }

  function setFeedback(element, message = "", kind = "") {
    if (!element) return;
    element.textContent = message;
    element.className = `auth-feedback${kind ? ` auth-feedback-${kind}` : ""}`;
  }

  function setLoading(form, loading, loadingLabel) {
    const button = form?.querySelector('button[type="submit"]');
    if (!button) return;
    if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent;
    button.disabled = loading;
    button.textContent = loading ? loadingLabel : button.dataset.defaultLabel;
    form.setAttribute("aria-busy", String(loading));
  }

  function friendlyAuthError(error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (message.includes("email not confirmed")) return "Esta conta antiga ainda está aguardando confirmação. Desative a confirmação no Supabase ou crie a conta novamente.";
    if (message.includes("user already registered")) return "Já existe uma conta com este e-mail. Use a opção Entrar.";
    if (message.includes("password")) return "Use uma senha com pelo menos 8 caracteres.";
    if (message.includes("rate limit")) return "Muitas tentativas seguidas. Aguarde um pouco e tente novamente.";
    return error?.message || "Não foi possível concluir. Tente novamente.";
  }

  function switchPanel(panelName) {
    const isSignIn = panelName === "signin";
    signInPanel.hidden = !isSignIn;
    signUpPanel.hidden = isSignIn;
    onboardingPanel.hidden = true;
    tabs.forEach((tab) => {
      const active = tab.dataset.authPanel === panelName;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    title.textContent = isSignIn ? "Bem-vindo de volta" : "Crie sua conta";
    subtitle.textContent = isSignIn
      ? "Entre para acessar o painel da sua propriedade."
      : "Escolha seu cargo e vincule sua conta à propriedade.";
  }

  function configureRoleFields(select, farmField, inviteField) {
    const isOwner = select.value === "owner";
    farmField.hidden = !isOwner;
    inviteField.hidden = isOwner;
    const farmInput = farmField.querySelector("input");
    const inviteInput = inviteField.querySelector("input");
    farmInput.required = isOwner;
    inviteInput.required = !isOwner;
  }

  async function findMembership(userId) {
    const { data, error } = await client
      .from("farm_members")
      .select("farm_id, role")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function finishOnboarding({ fullName, role, farmName, inviteCode }) {
    if (role === "owner") {
      const { error } = await client.rpc("complete_owner_onboarding", {
        p_full_name: fullName,
        p_farm_name: farmName,
      });
      if (error) throw error;
      return;
    }

    const { error } = await client.rpc("accept_farm_invite", {
      p_full_name: fullName,
      p_code: inviteCode,
      p_requested_role: role,
    });
    if (error) throw error;
  }

  function showOnboarding(user) {
    signInPanel.hidden = true;
    signUpPanel.hidden = true;
    onboardingPanel.hidden = false;
    document.querySelector(".auth-tabs").hidden = true;
    title.textContent = "Conta encontrada";
    subtitle.textContent = "Agora vamos ligar sua conta à propriedade correta.";
    onboardingForm.elements.fullName.value = user.user_metadata?.full_name || "";
    configureRoleFields(
      document.querySelector("#onboarding-role"),
      document.querySelector("#onboarding-farm-field"),
      document.querySelector("#onboarding-invite-field"),
    );
  }

  async function continueAfterAuthentication(user) {
    const membership = await findMembership(user.id);
    if (membership) {
      window.location.replace(returnTarget);
      return;
    }
    showOnboarding(user);
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => switchPanel(tab.dataset.authPanel)));

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.textContent = showing ? "Mostrar" : "Ocultar";
      button.setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
    });
  });

  const signUpRole = document.querySelector("#signup-role");
  const onboardingRole = document.querySelector("#onboarding-role");
  signUpRole.addEventListener("change", () => configureRoleFields(signUpRole, document.querySelector("#signup-farm-field"), document.querySelector("#signup-invite-field")));
  onboardingRole.addEventListener("change", () => configureRoleFields(onboardingRole, document.querySelector("#onboarding-farm-field"), document.querySelector("#onboarding-invite-field")));
  configureRoleFields(signUpRole, document.querySelector("#signup-farm-field"), document.querySelector("#signup-invite-field"));

  signInForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!signInForm.reportValidity() || !client) return;
    const values = new FormData(signInForm);
    setFeedback(document.querySelector("#signin-feedback"));
    setLoading(signInForm, true, "Entrando...");
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: String(values.get("email")).trim().toLowerCase(),
        password: String(values.get("password")),
      });
      if (error) throw error;
      await continueAfterAuthentication(data.user);
    } catch (error) {
      setFeedback(document.querySelector("#signin-feedback"), friendlyAuthError(error), "error");
    } finally {
      setLoading(signInForm, false);
    }
  });

  signUpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!signUpForm.reportValidity() || !client) return;
    const values = new FormData(signUpForm);
    const fullName = String(values.get("fullName")).trim();
    const role = String(values.get("role"));
    const details = {
      fullName,
      role,
      farmName: String(values.get("farmName") || "").trim(),
      inviteCode: String(values.get("inviteCode") || "").trim().toUpperCase(),
    };
    setFeedback(document.querySelector("#signup-feedback"));
    setLoading(signUpForm, true, "Criando conta...");
    try {
      const { data, error } = await client.auth.signUp({
        email: String(values.get("email")).trim().toLowerCase(),
        password: String(values.get("password")),
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (!data.session) {
        setFeedback(
          document.querySelector("#signup-feedback"),
          "A conta foi salva, mas a confirmação de e-mail ainda está ativada no Supabase. Desative essa opção para o acesso imediato funcionar.",
          "warning",
        );
        return;
      }
      await finishOnboarding(details);
      setFeedback(document.querySelector("#signup-feedback"), "Conta criada com sucesso. Abrindo o painel...", "success");
      window.location.replace(returnTarget);
    } catch (error) {
      setFeedback(document.querySelector("#signup-feedback"), friendlyAuthError(error), "error");
    } finally {
      setLoading(signUpForm, false);
    }
  });

  onboardingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!onboardingForm.reportValidity() || !client) return;
    const values = new FormData(onboardingForm);
    setFeedback(document.querySelector("#onboarding-feedback"));
    setLoading(onboardingForm, true, "Concluindo...");
    try {
      await finishOnboarding({
        fullName: String(values.get("fullName")).trim(),
        role: String(values.get("role")),
        farmName: String(values.get("farmName") || "").trim(),
        inviteCode: String(values.get("inviteCode") || "").trim().toUpperCase(),
      });
      window.location.replace(returnTarget);
    } catch (error) {
      setFeedback(document.querySelector("#onboarding-feedback"), friendlyAuthError(error), "error");
    } finally {
      setLoading(onboardingForm, false);
    }
  });

  document.querySelector("#onboarding-signout").addEventListener("click", async () => {
    await client?.auth.signOut();
    window.location.replace("login.html");
  });

  (async () => {
    if (!client) {
      setFeedback(document.querySelector("#signin-feedback"), "Não foi possível conectar ao Supabase. Atualize a página.", "error");
      return;
    }
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.user) return;
    try {
      await continueAfterAuthentication(data.session.user);
    } catch (sessionError) {
      setFeedback(document.querySelector("#signin-feedback"), friendlyAuthError(sessionError), "error");
    }
  })();
})();
