(() => {
  "use strict";

  const toggle = document.querySelector("#mobile-nav-toggle");
  const navigation = document.querySelector("#site-navigation");
  const form = document.querySelector("#contact-form");
  const feedback = document.querySelector("#contact-feedback");
  const year = document.querySelector("#current-year");
  let forwardingRecovery = false;

  function forwardPasswordRecovery() {
    if (forwardingRecovery) return;
    forwardingRecovery = true;
    window.sessionStorage.setItem("controle-rural-password-recovery", "active");
    const destination = new URL("redefinir-senha.html", window.location.href);
    destination.searchParams.set("recuperacao", "1");
    destination.hash = window.location.hash;
    window.location.replace(destination.href);
  }

  const authHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (authHash.get("type") === "recovery") forwardPasswordRecovery();
  window.ruralSupabase?.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") forwardPasswordRecovery();
  });

  function closeNavigation() {
    if (!toggle || !navigation) return;
    navigation.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }

  function setFeedback(message, state = "") {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.dataset.state = state;
  }

  toggle?.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  navigation?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("");
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const honeypot = String(data.get("website") || "").trim();
    if (honeypot) {
      form.reset();
      setFeedback("Mensagem enviada com sucesso.", "success");
      return;
    }

    const client = window.ruralSupabase;
    if (!client) {
      setFeedback("A conexão está indisponível. Tente novamente em alguns instantes.", "error");
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Enviando...";

    let result;
    try {
      result = await client.from("contact_messages").insert({
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        phone: String(data.get("phone") || "").trim() || null,
        message: String(data.get("message") || "").trim(),
        source_page: "landing",
      });
    } catch (error) {
      console.error("Falha de conexão ao enviar a mensagem.", error);
      result = { error };
    }

    submit.disabled = false;
    submit.textContent = "Enviar mensagem";

    if (result.error) {
      console.error("Falha ao registrar a mensagem.", result.error);
      const rateLimited = String(result.error.message || "").includes("15 minutos");
      setFeedback(
        rateLimited
          ? "Você enviou várias mensagens. Aguarde 15 minutos e tente novamente."
          : "Não foi possível enviar agora. Seus dados foram mantidos para você tentar novamente.",
        "error",
      );
      return;
    }

    form.reset();
    setFeedback("Mensagem enviada! Ela já está disponível para o responsável pelo projeto.", "success");
  });

  if (year) year.textContent = String(new Date().getFullYear());
})();
