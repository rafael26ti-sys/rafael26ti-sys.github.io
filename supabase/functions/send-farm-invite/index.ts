import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://rafael26ti-sys.github.io/login.html";
const ALLOWED_ORIGINS = new Set([
  "https://rafael26ti-sys.github.io",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLES = { gerente: "gerente", vaqueiro: "vaqueiro", caseiro: "caseiro" } as const;

function headers(request: Request) {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://rafael26ti-sys.github.io",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function respond(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(request) });
}

function envKey(name: string) {
  const keys = Deno.env.get(name);
  if (!keys) return "";
  try { return (JSON.parse(keys) as { default?: string }).default || ""; }
  catch { return ""; }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(request) });
  if (request.method !== "POST") return respond(request, { error: "Método não permitido." }, 405);

  const authHeader = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authHeader)) return respond(request, { error: "Entre na sua conta." }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || envKey("SUPABASE_SECRET_KEYS");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || envKey("SUPABASE_PUBLISHABLE_KEYS");
  if (!supabaseUrl || !adminKey || !publicKey) return respond(request, { error: "Serviço indisponível." }, 503);

  try {
    const admin = createClient(supabaseUrl, adminKey, { auth: { persistSession: false } });
    const { data: identity, error: authError } = await admin.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
    if (authError || !identity.user) return respond(request, { error: "Sessão inválida ou expirada." }, 401);

    const payload = await request.json();
    const farmId = typeof payload?.farm_id === "string" ? payload.farm_id : "";
    const role = typeof payload?.role === "string" ? payload.role : "";
    const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!UUID.test(farmId) || !Object.hasOwn(ROLES, role) || !email || email.length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respond(request, { error: "Confira o cargo e o e-mail do convite." }, 400);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const sender = Deno.env.get("INVITE_EMAIL_FROM") || "";
    if (!resendKey || !sender) {
      return respond(request, { error: "O envio de e-mail ainda não está configurado." }, 503);
    }

    // The user JWT applies the same authorization checks as the existing invite form.
    // Never create invites with the admin client: only the database RPC decides permissions.
    const userClient = createClient(supabaseUrl, publicKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: farm, error: farmError } = await userClient.from("farms").select("name").eq("id", farmId).single();
    if (farmError || !farm) return respond(request, { error: "Fazenda indisponível para esta conta." }, 403);

    const { data: invites, error: inviteError } = await userClient.rpc("create_farm_invite_for_farm", {
      p_farm_id: farmId, p_role: role, p_invited_email: email,
    });
    if (inviteError) return respond(request, { error: inviteError.message }, 403);
    const invite = invites?.[0];
    if (!invite?.invite_code) return respond(request, { error: "Não foi possível gerar o convite." }, 500);

    const farmName = String(farm.name);
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#19392d">
      <h1>Convite para a equipe</h1>
      <p>Você foi convidado(a) para participar da equipe da fazenda <strong>${escapeHtml(farmName)}</strong> como ${escapeHtml(role)}.</p>
      <p>Seu código de convite: <strong style="font-size:22px;letter-spacing:2px">${escapeHtml(invite.invite_code)}</strong></p>
      <p><a href="${SITE_URL}">Entrar no Controle Rural Simples</a></p>
      <p>Se você ainda não tem conta, escolha <strong>Criar conta</strong>, selecione o cargo e informe o código. Se já tem conta, entre e vá em <strong>Minhas fazendas</strong> para usar o código.</p>
      <p>O convite vale até ${escapeHtml(new Date(invite.expires_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))} (horário de Brasília), pode ser usado uma vez e só funciona com este e-mail.</p>
      <p>Se você não esperava este convite, ignore a mensagem.</p>
    </div>`;

    let sent = false;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({ from: sender, to: [email], subject: `Convite para a equipe: ${farmName}`, html }),
        signal: AbortSignal.timeout(10000),
      });
      sent = response.ok;
      if (!sent) console.error("Falha no envio do convite:", response.status);
    } catch (error) {
      console.error("Falha no serviço de e-mail:", error);
    }

    // Keep the code available for manual delivery if the provider rejects the email.
    return respond(request, {
      invite_id: invite.invite_id,
      invite_code: invite.invite_code,
      expires_at: invite.expires_at,
      email_sent: sent,
    });
  } catch (error) {
    console.error("Falha ao criar convite por e-mail:", error);
    return respond(request, { error: "Não foi possível preparar o convite." }, 500);
  }
});
