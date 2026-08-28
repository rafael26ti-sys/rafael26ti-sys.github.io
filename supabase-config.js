(() => {
  "use strict";

  const config = Object.freeze({
    url: "https://mwzytijhwvnrtembjpeh.supabase.co",
    publishableKey: "sb_publishable_bLv0YF3ezGsrWs0LJEConA_FfsIaiZE",
  });

  window.getRuralSupabase = () => {
    if (!window.supabase?.createClient) {
      throw new Error("Não foi possível carregar o serviço de autenticação.");
    }

    window.__ruralSupabaseClient ??= window.supabase.createClient(
      config.url,
      config.publishableKey,
      {
        auth: {
          storageKey: "controle-rural-auth",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );

    return window.__ruralSupabaseClient;
  };
})();

