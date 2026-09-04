const CACHE_NAME = "controle-rural-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./redefinir-senha.html",
  "./painel.html",
  "./styles.css",
  "./supabase-client.js",
  "./auth.js",
  "./recuperar-senha.js",
  "./auth-guard.js",
  "./landing.js",
  "./app.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./assets/hero-fazenda.jpg",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./assets/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          return cached || caches.match("./index.html");
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const refreshed = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || refreshed;
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "Você recebeu uma nova atividade." };
  }

  const title = payload.title || "Controle Rural Simples";
  const options = {
    body: payload.body || "Existe uma nova atividade para você.",
    icon: payload.icon || "./assets/app-icon-192.png",
    badge: payload.badge || "./assets/app-icon-192.png",
    tag: payload.tag || "controle-rural-atividade",
    renotify: true,
    data: {
      url: payload.url || "./painel.html#agenda",
      notificationId: payload.notificationId || "",
      taskId: payload.taskId || "",
    },
    actions: [{ action: "open", title: "Abrir atividade" }],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const destination = new URL(data.url || "./painel.html#agenda", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        if ("navigate" in existing) await existing.navigate(destination);
        existing.postMessage({
          type: "OPEN_TASK",
          notificationId: data.notificationId || "",
          taskId: data.taskId || "",
        });
        return existing.focus();
      }
      return self.clients.openWindow(destination);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
