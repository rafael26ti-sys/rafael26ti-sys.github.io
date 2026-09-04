(() => {
  "use strict";

  const client = window.ruralSupabase;
  const requestPanel = document.querySelector("#recovery-request-panel");
  const updatePanel = document.querySelector("#password-update-panel");
  const completePanel = document.querySelector("#password-complete-panel");
  const requestForm = document.querySelector("#recovery-request-form");
  const updateForm = document.querySelector("#password-update-form");
  const requestFeedback = document.querySelector("#recovery-request-feedback");
  const updateFeedback = document.querySelector("#password-update-feedback");
  const currentPasswordField = document.querySelector("#current-password-field");
  const recoveryMarker = "controle-rural-password-recovery";
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const requestedAccountChange = url.searchParams.get("modo") === "trocar";
  const recoverySignal =
    url.searchParams.get("recuperacao") === "1" ||
    hashParams.get("type") === "recovery" ||
    window.sessionStorage.getItem(recoveryMarker) === "active";

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

  function friendlyRecoveryError(error, changingPassword = false) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("rate limit") || message.includes("too many")) {
      return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";
    }
    if (message.includes("email address not authorized")) {
      return "O envio de recuperação ainda precisa ser liberado pelo administrador do sistema.";
    }
    if (message.includes("same password")) return "Escolha uma senha diferente da senha atual.";
    if (message.includes("current password") || message.includes("invalid login credentials")) {
      return "A senha atual está incorreta.";
    }
    if (message.includes("password")) return "Use uma senha válida com pelo menos 8 caracteres.";
    return changingPassword
      ? "Não foi possível atualizar a senha. Tente solicitar um novo link."
      : "Não foi possível enviar o link agora. Tente novamente em alguns instantes.";
  }

  function togglePasswordButtons() {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.parentElement.querySelector("input");
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        button.textContent = showing ? "Mostrar" : "Ocultar";
        const subject = input.name === "currentPassword" ? "senha atual" : "senha";
        button.setAttribute("aria-label", `${showing ? "Mostrar" : "Ocultar"} ${subject}`);
      });
    });
  }

  function cleanRecoveryUrl() {
    const cleanUrl = new URL("redefinir-senha.html", window.location.href);
    window.history.replaceState({}, "", cleanUrl.pathname);
  }

  function showRequest(message = "", kind = "") {
    requestPanel.hidden = false;
    updatePanel.hidden = true;
    completePanel.hidden = true;
    setFeedback(requestFeedback, message, kind);
  }

  function showUpdate({ requireCurrentPassword = false } = {}) {
    requestPanel.hidden = true;
    updatePanel.hidden = false;
    completePanel.hidden = true;
    currentPasswordField.hidden = !requireCurrentPassword;
    updateForm.elements.currentPassword.required = requireCurrentPassword;
    updateForm.dataset.requireCurrentPassword = String(requireCurrentPassword);
    document.querySelector("#password-update-eyebrow").textContent = requireCurrentPassword ? "Segurança da conta" : "Nova senha";
    document.querySelector("#password-update-title").textContent = requireCurrentPassword ? "Troque sua senha" : "Crie uma nova senha";
    document.querySelector("#password-update-subtitle").textContent = requireCurrentPassword
      ? "Confirme sua senha atual e escolha uma nova para continuar protegendo sua conta."
      : "Use uma senha diferente e que seja fácil apenas para você lembrar.";
    cleanRecoveryUrl();
  }

  function showComplete() {
    requestPanel.hidden = true;
    updatePanel.hidden = true;
    completePanel.hidden = false;
    document.querySelector(".auth-security-note").hidden = true;
  }

  function resetRedirectUrl() {
    const redirectUrl = new URL("redefinir-senha.html", window.location.href);
    redirectUrl.search = "";
    redirectUrl.hash = "";
    return redirectUrl.href;
  }

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requestForm.reportValidity() || !client) return;
    const email = String(new FormData(requestForm).get("email") || "").trim().toLowerCase();
    setFeedback(requestFeedback);
    setLoading(requestForm, true, "Enviando...");
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl(),
      });
      if (error) throw error;
      requestForm.reset();
      setFeedback(
        requestFeedback,
        "Se existir uma conta com este e-mail, o link de recuperação chegará em alguns minutos. Confira também a caixa de spam.",
        "success",
      );
    } catch (error) {
      setFeedback(requestFeedback, friendlyRecoveryError(error), "error");
    } finally {
      setLoading(requestForm, false);
    }
  });

  updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!updateForm.reportValidity() || !client) return;
    const values = new FormData(updateForm);
    const newPassword = String(values.get("newPassword") || "");
    const confirmPassword = String(values.get("confirmPassword") || "");
    const requireCurrentPassword = updateForm.dataset.requireCurrentPassword === "true";

    setFeedback(updateFeedback);
    if (newPassword !== confirmPassword) {
      setFeedback(updateFeedback, "As duas novas senhas precisam ser iguais.", "error");
      return;
    }

    setLoading(updateForm, true, "Salvando...");
    try {
      const passwordUpdate = { password: newPassword };
      if (requireCurrentPassword) {
        passwordUpdate.current_password = String(values.get("currentPassword") || "");
      }
      const { error } = await client.auth.updateUser(passwordUpdate);
      if (error) throw error;
      window.sessionStorage.removeItem(recoveryMarker);
      await client.auth.signOut({ scope: "global" }).catch(() => null);
      updateForm.reset();
      showComplete();
    } catch (error) {
      setFeedback(updateFeedback, friendlyRecoveryError(error, true), "error");
    } finally {
      setLoading(updateForm, false);
    }
  });

  client?.auth.onAuthStateChange((event) => {
    if (event !== "PASSWORD_RECOVERY") return;
    window.sessionStorage.setItem(recoveryMarker, "active");
    showUpdate({ requireCurrentPassword: false });
  });

  togglePasswordButtons();

  (async () => {
    if (!client) {
      showRequest("Não foi possível conectar ao Supabase. Atualize a página.", "error");
      return;
    }

    const authError = hashParams.get("error_description");
    if (authError) {
      window.sessionStorage.removeItem(recoveryMarker);
      showRequest("Este link expirou ou já foi usado. Solicite um novo link de recuperação.", "error");
      cleanRecoveryUrl();
      return;
    }

    const { data, error } = await client.auth.getSession();
    const hasSession = Boolean(data?.session?.user) && !error;
    if (recoverySignal && hasSession) {
      window.sessionStorage.setItem(recoveryMarker, "active");
      showUpdate({ requireCurrentPassword: false });
      return;
    }
    if (requestedAccountChange && hasSession) {
      showUpdate({ requireCurrentPassword: true });
      return;
    }
    if (requestedAccountChange) {
      showRequest("Entre na sua conta primeiro ou solicite um link para recuperar o acesso.", "warning");
    }
  })();
})();
