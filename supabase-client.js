(() => {
  "use strict";

  const projectUrl = "https://mwzytijhwvnrtembjpeh.supabase.co";
  const publishableKey = "sb_publishable_bLv0YF3ezGsrWs0LJEConA_FfsIaiZE";

  if (!window.supabase?.createClient) {
    console.error("Não foi possível carregar a conexão segura com o Supabase.");
    return;
  }

  window.ruralSupabase = window.supabase.createClient(projectUrl, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})();
