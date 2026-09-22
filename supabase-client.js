(() => {
  "use strict";

  const projectUrl = "https://mwzytijhwvnrtembjpeh.supabase.co";
  const publishableKey = "sb_publishable_bLv0YF3ezGsrWs0LJEConA_FfsIaiZE";

  if (!window.supabase?.createClient) {
    console.error("Não foi possível carregar a conexão segura com o Supabase.");
    return;
  }

  let pendingWrites = 0;
  window.ruralPendingWrites = () => pendingWrites;
  window.ruralSupabase = window.supabase.createClient(projectUrl, publishableKey, {
    global: {
      fetch: async (input, options) => {
        const method = (options?.method || input?.method || "GET").toUpperCase();
        const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method);
        if (isWrite) pendingWrites += 1;
        try {
          return await fetch(input, options);
        } finally {
          if (isWrite) pendingWrites -= 1;
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})();
