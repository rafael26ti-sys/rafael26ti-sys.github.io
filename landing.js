(() => {
  "use strict";

  const toggle = document.querySelector("#mobile-nav-toggle");
  const navigation = document.querySelector("#site-navigation");
  const form = document.querySelector("#contact-form");
  const feedback = document.querySelector("#contact-feedback");
  const year = document.querySelector("#current-year");

  function closeNavigation() {
    if (!toggle || !navigation) return;
    navigation.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
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

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    form.reset();
    feedback.textContent =
      "Mensagem registrada nesta demonstração. A integração de envio será adicionada na próxima etapa.";
  });

  if (year) year.textContent = String(new Date().getFullYear());
})();
