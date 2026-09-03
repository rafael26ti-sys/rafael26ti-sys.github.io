create extension if not exists pg_net;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid not null references public.farms(id) on delete cascade,
  endpoint text not null unique
    constraint push_subscriptions_endpoint_check check (
      char_length(endpoint) between 20 and 2048
      and endpoint like 'https://%'
    ),
  p256dh text not null
    constraint push_subscriptions_p256dh_check check (
      char_length(p256dh) between 20 and 255
    ),
  auth_key text not null
    constraint push_subscriptions_auth_key_check check (
      char_length(auth_key) between 8 and 255
    ),
  user_agent text
    constraint push_subscriptions_user_agent_check check (
      user_agent is null or char_length(user_agent) <= 300
    ),
  active boolean not null default true,
  failure_count smallint not null default 0
    constraint push_subscriptions_failure_count_check check (
      failure_count between 0 and 100
    ),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'Assinaturas Web Push dos aparelhos autorizados pelos membros das propriedades.';

create index push_subscriptions_user_active_idx
  on public.push_subscriptions (user_id)
  where active;

create index push_subscriptions_farm_id_idx
  on public.push_subscriptions (farm_id);

alter table public.push_subscriptions enable row level security;

revoke all on table public.push_subscriptions from public, anon, authenticated;
grant select, delete on table public.push_subscriptions to authenticated;

create policy push_subscriptions_select_own
on public.push_subscriptions
for select
to authenticated
using (user_id = (select auth.uid()));

create policy push_subscriptions_delete_own
on public.push_subscriptions
for delete
to authenticated
using (user_id = (select auth.uid()));

create table private.push_vapid_config (
  singleton boolean primary key default true
    constraint push_vapid_config_singleton_check check (singleton),
  public_key text not null
    constraint push_vapid_config_public_key_check check (
      char_length(public_key) between 40 and 200
    ),
  private_key text not null
    constraint push_vapid_config_private_key_check check (
      char_length(private_key) between 30 and 200
    ),
  created_at timestamptz not null default now()
);

create table private.push_dispatch_tokens (
  notification_id uuid primary key references public.notifications(id) on delete cascade,
  dispatch_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

revoke all on table private.push_vapid_config from public, anon, authenticated, service_role;
revoke all on table private.push_dispatch_tokens from public, anon, authenticated, service_role;

create or replace function public.get_push_vapid_config()
returns table (public_key text, private_key text)
language sql
security definer
set search_path = ''
as $$
  select config.public_key, config.private_key
  from private.push_vapid_config as config
  where config.singleton = true
  limit 1;
$$;

revoke execute on function public.get_push_vapid_config()
  from public, anon, authenticated;
grant execute on function public.get_push_vapid_config()
  to service_role;

create or replace function public.store_push_vapid_config(
  p_public_key text,
  p_private_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(p_public_key) not between 40 and 200
    or char_length(p_private_key) not between 30 and 200 then
    raise exception 'Chaves VAPID inválidas.';
  end if;

  insert into private.push_vapid_config (
    singleton,
    public_key,
    private_key
  )
  values (
    true,
    p_public_key,
    p_private_key
  )
  on conflict (singleton) do nothing;
end;
$$;

revoke execute on function public.store_push_vapid_config(text, text)
  from public, anon, authenticated;
grant execute on function public.store_push_vapid_config(text, text)
  to service_role;

create or replace function public.consume_push_dispatch(
  p_notification_id uuid,
  p_dispatch_token uuid
)
returns table (
  notification_id uuid,
  recipient_id uuid,
  task_id uuid,
  title text,
  message text
)
language sql
security definer
set search_path = ''
as $$
  with consumed as (
    update private.push_dispatch_tokens as token
    set used_at = now()
    where token.notification_id = p_notification_id
      and token.dispatch_token = p_dispatch_token
      and token.used_at is null
      and token.created_at >= now() - interval '10 minutes'
    returning token.notification_id
  )
  select
    notification.id,
    notification.recipient_id,
    notification.task_id,
    notification.title,
    notification.message
  from consumed
  join public.notifications as notification
    on notification.id = consumed.notification_id;
$$;

revoke execute on function public.consume_push_dispatch(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.consume_push_dispatch(uuid, uuid)
  to service_role;

create or replace function private.enqueue_notification_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_token uuid := gen_random_uuid();
begin
  if not exists (
    select 1
    from public.push_subscriptions as subscription
    where subscription.user_id = new.recipient_id
      and subscription.active = true
  ) then
    return new;
  end if;

  insert into private.push_dispatch_tokens (
    notification_id,
    dispatch_token
  )
  values (
    new.id,
    generated_token
  );

  begin
    perform net.http_post(
      url := 'https://mwzytijhwvnrtembjpeh.supabase.co/functions/v1/send-task-push',
      body := jsonb_build_object(
        'notification_id', new.id,
        'dispatch_token', generated_token
      ),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 4000
    );
  exception
    when others then
      raise warning 'Falha ao enfileirar Web Push para a notificação %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

revoke execute on function private.enqueue_notification_push()
  from public, anon, authenticated, service_role;

create trigger notifications_enqueue_web_push
after insert on public.notifications
for each row
execute function private.enqueue_notification_push();
