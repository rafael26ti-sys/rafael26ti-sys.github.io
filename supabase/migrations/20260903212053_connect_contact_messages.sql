create table if not exists private.contact_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on table private.contact_admins from public, anon, authenticated;

create or replace function private.is_contact_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.contact_admins admin
    where admin.user_id = p_user_id
  );
$$;

revoke all on function private.is_contact_admin(uuid) from public, anon;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_contact_admin(uuid) to authenticated, service_role;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  source_page text not null default 'landing',
  status text not null default 'novo',
  handled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_name_length
    check (char_length(name) between 2 and 100),
  constraint contact_messages_email_length
    check (char_length(email) between 5 and 254),
  constraint contact_messages_email_format
    check (email ~* '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'),
  constraint contact_messages_phone_format
    check (phone is null or phone ~ '^[0-9+() .-]{8,30}$'),
  constraint contact_messages_message_length
    check (char_length(message) between 10 and 1000),
  constraint contact_messages_source_length
    check (char_length(source_page) between 1 and 50),
  constraint contact_messages_status_allowed
    check (status in ('novo', 'lido', 'atendido'))
);

create index if not exists contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);

create index if not exists contact_messages_email_created_idx
  on public.contact_messages (email, created_at desc);

create or replace function private.guard_contact_message_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.name := btrim(new.name);
    new.email := lower(btrim(new.email));
    new.phone := nullif(btrim(new.phone), '');
    new.message := btrim(new.message);
    new.source_page := coalesce(nullif(btrim(new.source_page), ''), 'landing');
    new.status := 'novo';
    new.handled_by := null;
    new.created_at := now();
    new.updated_at := now();

    if (
      select count(*) >= 3
      from public.contact_messages existing
      where existing.email = new.email
        and existing.created_at >= now() - interval '15 minutes'
    ) then
      raise exception 'Muitas mensagens foram enviadas. Aguarde 15 minutos e tente novamente.'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  if not (select private.is_contact_admin((select auth.uid()))) then
    raise exception 'Sua conta não pode alterar mensagens de contato.'
      using errcode = '42501';
  end if;

  new.name := old.name;
  new.email := old.email;
  new.phone := old.phone;
  new.message := old.message;
  new.source_page := old.source_page;
  new.created_at := old.created_at;
  new.updated_at := now();
  new.handled_by := case when new.status = 'novo' then null else (select auth.uid()) end;
  return new;
end;
$$;

revoke all on function private.guard_contact_message_write() from public, anon, authenticated;

drop trigger if exists contact_messages_guard_write on public.contact_messages;
create trigger contact_messages_guard_write
before insert or update on public.contact_messages
for each row execute function private.guard_contact_message_write();

alter table public.contact_messages enable row level security;

drop policy if exists contact_messages_insert_public on public.contact_messages;
drop policy if exists contact_messages_select_admin on public.contact_messages;
drop policy if exists contact_messages_update_admin on public.contact_messages;

create policy contact_messages_insert_public
on public.contact_messages
for insert
to anon, authenticated
with check (
  status = 'novo'
  and handled_by is null
);

create policy contact_messages_select_admin
on public.contact_messages
for select
to authenticated
using (
  (select private.is_contact_admin((select auth.uid())))
);

create policy contact_messages_update_admin
on public.contact_messages
for update
to authenticated
using (
  (select private.is_contact_admin((select auth.uid())))
)
with check (
  (select private.is_contact_admin((select auth.uid())))
);

revoke all on table public.contact_messages from public, anon, authenticated;
grant insert (name, email, phone, message, source_page)
  on public.contact_messages to anon, authenticated;
grant select on table public.contact_messages to authenticated;
grant update (status) on public.contact_messages to authenticated;

create or replace function public.current_user_is_contact_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_contact_admin((select auth.uid()));
$$;

revoke all on function public.current_user_is_contact_admin() from public, anon;
grant execute on function public.current_user_is_contact_admin()
  to authenticated, service_role;

comment on table public.contact_messages is
  'Mensagens enviadas pelo formulário público do Controle Rural Simples.';

comment on function public.current_user_is_contact_admin() is
  'Informa se o usuário autenticado administra as mensagens do projeto.';
