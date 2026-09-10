import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_ORIGIN = "https://rafael26ti-sys.github.io";
const ALLOWED_ORIGINS = new Set([
  PRODUCTION_ORIGIN,
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

function corsHeaders(request: Request) {
  const requestOrigin = request.headers.get("origin") || "";
  const origin = ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : PRODUCTION_ORIGIN;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(request: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function secretApiKey() {
  const modernKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modernKeys) {
    try {
      const parsed = JSON.parse(modernKeys) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      // Mantém compatibilidade com projetos que ainda usam a chave antiga.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAdmin = createClient(supabaseUrl, secretApiKey(), {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

function validFullName(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 100 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    return "";
  }
  return normalized;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return json(request, { error: "Método não permitido." }, 405);
  }

  const user = await authenticatedUser(request);
  if (!user) return json(request, { error: "Sessão inválida ou expirada." }, 401);

  try {
    const body = await request.json();
    const fullName = validFullName(body?.full_name);
    if (!fullName) {
      return json(request, { error: "Informe um nome entre 2 e 100 caracteres." }, 400);
    }

    const saved = await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: user.id, full_name: fullName }, { onConflict: "user_id" })
      .select("full_name")
      .single();
    if (saved.error) throw saved.error;

    return json(request, { profile: saved.data });
  } catch (error) {
    console.error("Falha ao atualizar perfil.", error);
    return json(request, { error: "Não foi possível atualizar o perfil." }, 500);
  }
});
