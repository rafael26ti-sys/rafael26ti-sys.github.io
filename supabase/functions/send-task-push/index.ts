import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";
import webpush from "npm:web-push@3.6.7";

const PRODUCTION_ORIGIN = "https://rafael26ti-sys.github.io";
const ALLOWED_ORIGINS = new Set([
  PRODUCTION_ORIGIN,
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);
const VAPID_SUBJECT = "https://rafael26ti-sys.github.io/";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PushSubscriptionInput = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

type RequestBody = {
  action?: unknown;
  farm_id?: unknown;
  subscription?: PushSubscriptionInput;
  endpoint?: unknown;
  notification_id?: unknown;
  dispatch_token?: unknown;
  user_agent?: unknown;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  failure_count: number;
};

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
      // The legacy key below keeps older projects compatible.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseSecret = secretApiKey();
const supabaseAdmin = createClient(supabaseUrl, supabaseSecret, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

function firstRow<T>(data: T[] | T | null): T | null {
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

async function getVapidConfig() {
  let result = await supabaseAdmin.rpc("get_push_vapid_config");
  if (result.error) throw result.error;
  let config = firstRow(result.data as Array<{ public_key: string; private_key: string }> | null);
  if (config) return config;

  const generated = webpush.generateVAPIDKeys();
  const stored = await supabaseAdmin.rpc("store_push_vapid_config", {
    p_public_key: generated.publicKey,
    p_private_key: generated.privateKey,
  });
  if (stored.error) throw stored.error;

  result = await supabaseAdmin.rpc("get_push_vapid_config");
  if (result.error) throw result.error;
  config = firstRow(result.data as Array<{ public_key: string; private_key: string }> | null);
  if (!config) throw new Error("Não foi possível preparar as chaves de notificação.");
  return config;
}

function validSubscription(input: PushSubscriptionInput | undefined) {
  const endpoint = typeof input?.endpoint === "string" ? input.endpoint.trim() : "";
  const p256dh = typeof input?.keys?.p256dh === "string" ? input.keys.p256dh.trim() : "";
  const auth = typeof input?.keys?.auth === "string" ? input.keys.auth.trim() : "";
  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return null;
  }
  if (
    endpointUrl.protocol !== "https:" ||
    endpoint.length < 20 ||
    endpoint.length > 2048 ||
    p256dh.length < 20 ||
    p256dh.length > 255 ||
    auth.length < 8 ||
    auth.length > 255
  ) {
    return null;
  }
  return { endpoint, p256dh, auth };
}

async function handleAuthenticatedAction(request: Request, body: RequestBody) {
  const user = await authenticatedUser(request);
  if (!user) return json(request, { error: "Sessão inválida ou expirada." }, 401);

  const action = typeof body.action === "string" ? body.action : "";
  if (action === "public-key") {
    const config = await getVapidConfig();
    return json(request, { publicKey: config.public_key });
  }

  if (action === "register") {
    const farmId = typeof body.farm_id === "string" ? body.farm_id : "";
    const subscription = validSubscription(body.subscription);
    if (!UUID_PATTERN.test(farmId) || !subscription) {
      return json(request, { error: "Dados do aparelho inválidos." }, 400);
    }

    const membership = await supabaseAdmin
      .from("farm_members")
      .select("status")
      .eq("farm_id", farmId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (membership.error || !membership.data) {
      return json(request, { error: "Sua conta não possui acesso ativo a esta propriedade." }, 403);
    }

    const userAgent = typeof body.user_agent === "string"
      ? body.user_agent.trim().slice(0, 300) || null
      : null;
    const saved = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          farm_id: farmId,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth_key: subscription.auth,
          user_agent: userAgent,
          active: true,
          failure_count: 0,
          last_failure_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      )
      .select("id")
      .single();
    if (saved.error) throw saved.error;
    return json(request, { active: true });
  }

  if (action === "unregister") {
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    if (!endpoint || endpoint.length > 2048) {
      return json(request, { error: "Assinatura inválida." }, 400);
    }
    const removed = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);
    if (removed.error) throw removed.error;
    return json(request, { active: false });
  }

  return json(request, { error: "Ação não reconhecida." }, 400);
}

async function handleDatabaseDispatch(request: Request, body: RequestBody) {
  const notificationId = typeof body.notification_id === "string" ? body.notification_id : "";
  const dispatchToken = typeof body.dispatch_token === "string" ? body.dispatch_token : "";
  if (!UUID_PATTERN.test(notificationId) || !UUID_PATTERN.test(dispatchToken)) {
    return json(request, { error: "Despacho inválido." }, 401);
  }

  const consumed = await supabaseAdmin.rpc("consume_push_dispatch", {
    p_notification_id: notificationId,
    p_dispatch_token: dispatchToken,
  });
  if (consumed.error) throw consumed.error;
  const notification = firstRow(
    consumed.data as Array<{
      notification_id: string;
      recipient_id: string;
      task_id: string | null;
      title: string;
      message: string;
    }> | null,
  );
  if (!notification) return json(request, { error: "Despacho expirado ou já utilizado." }, 401);

  const subscriptionsResult = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key, failure_count")
    .eq("user_id", notification.recipient_id)
    .eq("active", true);
  if (subscriptionsResult.error) throw subscriptionsResult.error;
  const subscriptions = (subscriptionsResult.data || []) as StoredSubscription[];
  if (!subscriptions.length) return json(request, { sent: 0, failed: 0 });

  const config = await getVapidConfig();
  webpush.setVapidDetails(VAPID_SUBJECT, config.public_key, config.private_key);
  const destination = `/painel.html?task=${encodeURIComponent(notification.task_id || "")}&notification=${encodeURIComponent(notification.notification_id)}#agenda`;
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    icon: "/assets/app-icon-192.png",
    badge: "/assets/app-icon-192.png",
    tag: `task-${notification.task_id || notification.notification_id}`,
    url: destination,
    notificationId: notification.notification_id,
    taskId: notification.task_id,
  });

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth_key,
          },
        },
        payload,
        { TTL: 86400, urgency: "high" },
      )
    ),
  );

  let sent = 0;
  let failed = 0;
  await Promise.all(results.map(async (result, index) => {
    const subscription = subscriptions[index];
    if (result.status === "fulfilled") {
      sent += 1;
      await supabaseAdmin
        .from("push_subscriptions")
        .update({
          active: true,
          failure_count: 0,
          last_success_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);
      return;
    }

    failed += 1;
    const reason = result.reason as { statusCode?: number } | undefined;
    const expired = reason?.statusCode === 404 || reason?.statusCode === 410;
    await supabaseAdmin
      .from("push_subscriptions")
      .update({
        active: expired ? false : true,
        failure_count: Math.min(100, (subscription.failure_count || 0) + 1),
        last_failure_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);
  }));

  return json(request, { sent, failed });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return json(request, { error: "Método não permitido." }, 405);
  }
  if (!supabaseUrl || !supabaseSecret) {
    return json(request, { error: "Configuração do servidor indisponível." }, 503);
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return json(request, { error: "Corpo da requisição inválido." }, 400);
  }

  if (body.action === "health") return json(request, { ok: true });

  try {
    if (body.notification_id || body.dispatch_token) {
      return await handleDatabaseDispatch(request, body);
    }
    return await handleAuthenticatedAction(request, body);
  } catch (error) {
    console.error("Falha ao processar Web Push.", error);
    return json(request, { error: "Não foi possível concluir a operação de notificação." }, 500);
  }
});
