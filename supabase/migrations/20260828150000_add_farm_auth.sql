-- Contas, propriedades, equipe e convites do Controle Rural Simples.
-- As funções RPC validam auth.uid() no servidor; funções auxiliares evitam
-- recursão nas políticas de Row Level Security.

create schema if not exists private;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.farm_members (
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null check (role in ('owner', 'vaqueiro', 'caseiro')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  invited_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (farm_id, user_id)
);

create unique index if not exists farm_members_one_active_farm_per_user
  on public.farm_members(user_id)
  where status = 'active';

create table if not exists public.farm_invites (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  code text not null unique,
  role text not null check (role in ('vaqueiro', 'caseiro')),
  invited_email text,
  created_by uuid not null references public.profiles(user_id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references public.profiles(user_id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  check (invited_email is null or position('@' in invited_email) > 1)
);

create or replace function private.is_farm_member(p_farm_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farm_members fm
    where fm.farm_id = p_farm_id
      and fm.user_id = p_user_id
      and fm.status = 'active'
  );
$$;

create or replace function private.is_farm_owner(p_farm_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farm_members fm
    where fm.farm_id = p_farm_id
      and fm.user_id = p_user_id
      and fm.role = 'owner'
      and fm.status = 'active'
  );
$$;

create or replace function private.users_share_farm(p_first_user uuid, p_second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farm_members first_member
    join public.farm_members second_member
      on second_member.farm_id = first_member.farm_id
    where first_member.user_id = p_first_user
      and second_member.user_id = p_second_user
      and first_member.status = 'active'
      and second_member.status = 'active'
  );
$$;

revoke all on function private.is_farm_member(uuid, uuid) from public;
revoke all on function private.is_farm_owner(uuid, uuid) from public;
revoke all on function private.users_share_farm(uuid, uuid) from public;
grant execute on function private.is_farm_member(uuid, uuid) to authenticated;
grant execute on function private.is_farm_owner(uuid, uuid) to authenticated;
grant execute on function private.users_share_farm(uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.farm_invites enable row level security;

drop policy if exists profiles_select_team on public.profiles;
create policy profiles_select_team
on public.profiles for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.users_share_farm(user_id, (select auth.uid()))
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists farms_select_members on public.farms;
create policy farms_select_members
on public.farms for select
to authenticated
using (private.is_farm_member(id, (select auth.uid())));

drop policy if exists farms_update_owner on public.farms;
create policy farms_update_owner
on public.farms for update
to authenticated
using (private.is_farm_owner(id, (select auth.uid())))
with check (private.is_farm_owner(id, (select auth.uid())));

drop policy if exists farm_members_select_team on public.farm_members;
create policy farm_members_select_team
on public.farm_members for select
to authenticated
using (private.is_farm_member(farm_id, (select auth.uid())));

drop policy if exists farm_members_update_owner on public.farm_members;
create policy farm_members_update_owner
on public.farm_members for update
to authenticated
using (
  private.is_farm_owner(farm_id, (select auth.uid()))
  and user_id <> (select auth.uid())
)
with check (
  private.is_farm_owner(farm_id, (select auth.uid()))
  and user_id <> (select auth.uid())
  and role in ('vaqueiro', 'caseiro')
);

drop policy if exists farm_members_delete_owner on public.farm_members;
create policy farm_members_delete_owner
on public.farm_members for delete
to authenticated
using (
  private.is_farm_owner(farm_id, (select auth.uid()))
  and user_id <> (select auth.uid())
);

drop policy if exists farm_invites_owner_manage on public.farm_invites;
create policy farm_invites_owner_manage
on public.farm_invites for all
to authenticated
using (private.is_farm_owner(farm_id, (select auth.uid())))
with check (private.is_farm_owner(farm_id, (select auth.uid())));

grant select, update on public.profiles to authenticated;
grant select, update on public.farms to authenticated;
grant select, update, delete on public.farm_members to authenticated;
grant select, insert, update, delete on public.farm_invites to authenticated;

create or replace function public.complete_owner_onboarding(
  p_full_name text,
  p_farm_name text
)
returns table (farm_id uuid, farm_name text, member_role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_farm_id uuid;
  normalized_name text := trim(p_full_name);
  normalized_farm_name text := trim(p_farm_name);
begin
  if current_user_id is null then
    raise exception 'É necessário entrar na conta.';
  end if;
  if char_length(normalized_name) < 2 or char_length(normalized_farm_name) < 2 then
    raise exception 'Informe seu nome e o nome da propriedade.';
  end if;
  if exists (select 1 from public.farm_members where user_id = current_user_id and status = 'active') then
    raise exception 'Esta conta já está vinculada a uma propriedade.';
  end if;

  insert into public.profiles (user_id, full_name)
  values (current_user_id, normalized_name)
  on conflict (user_id) do update
    set full_name = excluded.full_name, updated_at = now();

  insert into public.farms (name, owner_id)
  values (normalized_farm_name, current_user_id)
  returning id into created_farm_id;

  insert into public.farm_members (farm_id, user_id, role, status)
  values (created_farm_id, current_user_id, 'owner', 'active');

  return query select created_farm_id, normalized_farm_name, 'owner'::text;
end;
$$;

create or replace function public.accept_farm_invite(
  p_full_name text,
  p_code text,
  p_requested_role text
)
returns table (farm_id uuid, farm_name text, member_role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  selected_invite public.farm_invites%rowtype;
  selected_farm_name text;
  normalized_name text := trim(p_full_name);
begin
  if current_user_id is null then
    raise exception 'É necessário entrar na conta.';
  end if;
  if p_requested_role not in ('vaqueiro', 'caseiro') then
    raise exception 'Cargo inválido.';
  end if;
  if exists (select 1 from public.farm_members where user_id = current_user_id and status = 'active') then
    raise exception 'Esta conta já está vinculada a uma propriedade.';
  end if;

  select * into selected_invite
  from public.farm_invites
  where code = upper(trim(p_code))
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Convite inválido, usado ou vencido.';
  end if;
  if selected_invite.role <> p_requested_role then
    raise exception 'O cargo selecionado não corresponde ao convite.';
  end if;
  if selected_invite.invited_email is not null
     and lower(selected_invite.invited_email) <> current_email then
    raise exception 'Este convite foi criado para outro e-mail.';
  end if;

  insert into public.profiles (user_id, full_name)
  values (current_user_id, normalized_name)
  on conflict (user_id) do update
    set full_name = excluded.full_name, updated_at = now();

  insert into public.farm_members (farm_id, user_id, role, status, invited_by)
  values (selected_invite.farm_id, current_user_id, selected_invite.role, 'active', selected_invite.created_by);

  update public.farm_invites
  set used_by = current_user_id, used_at = now()
  where id = selected_invite.id;

  select name into selected_farm_name from public.farms where id = selected_invite.farm_id;
  return query select selected_invite.farm_id, selected_farm_name, selected_invite.role;
end;
$$;

create or replace function public.create_farm_invite(
  p_role text,
  p_invited_email text default null
)
returns table (invite_id uuid, invite_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  owner_farm_id uuid;
  generated_code text;
  created_invite_id uuid;
  created_expiry timestamptz;
  normalized_email text := nullif(lower(trim(coalesce(p_invited_email, ''))), '');
begin
  if current_user_id is null then
    raise exception 'É necessário entrar na conta.';
  end if;
  if p_role not in ('vaqueiro', 'caseiro') then
    raise exception 'Somente os cargos vaqueiro e caseiro podem ser convidados.';
  end if;

  select fm.farm_id into owner_farm_id
  from public.farm_members fm
  where fm.user_id = current_user_id
    and fm.role = 'owner'
    and fm.status = 'active'
  limit 1;

  if owner_farm_id is null then
    raise exception 'Somente o dono pode criar convites.';
  end if;

  generated_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.farm_invites (farm_id, code, role, invited_email, created_by)
  values (owner_farm_id, generated_code, p_role, normalized_email, current_user_id)
  returning id, farm_invites.expires_at into created_invite_id, created_expiry;

  return query select created_invite_id, generated_code, created_expiry;
end;
$$;

revoke all on function public.complete_owner_onboarding(text, text) from public;
revoke all on function public.accept_farm_invite(text, text, text) from public;
revoke all on function public.create_farm_invite(text, text) from public;
grant execute on function public.complete_owner_onboarding(text, text) to authenticated;
grant execute on function public.accept_farm_invite(text, text, text) to authenticated;
grant execute on function public.create_farm_invite(text, text) to authenticated;

