(() => {
  "use strict";

  let installPrompt = null;

  function announce(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  if (!("serviceWorker" in navigator)) {
    window.ruralPwa = {
      supported: false,
      registration: Promise.resolve(null),
      canInstall: () => false,
      install: async () => ({ outcome: "unsupported" }),
    };
    return;
  }

  const registration = navigator.serviceWorker
    .register("./sw.js", { scope: "./" })
    .then((serviceWorkerRegistration) => {
      announce("rural:pwa-ready", { registration: serviceWorkerRegistration });
      return serviceWorkerRegistration;
    })
    .catch((error) => {
      console.error("Não foi possível preparar o aplicativo para instalação.", error);
      announce("rural:pwa-error");
      return null;
    });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    announce("rural:pwa-installable");
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    announce("rural:pwa-installed");
  });

  window.ruralPwa = {
    supported: true,
    registration,
    canInstall: () => Boolean(installPrompt),
    install: async () => {
      if (!installPrompt) return { outcome: "unavailable" };
      const prompt = installPrompt;
      installPrompt = null;
      await prompt.prompt();
      const choice = await prompt.userChoice;
      announce("rural:pwa-install-choice", choice);
      return choice;
    },
  };
})();
