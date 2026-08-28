-- Mantém as implementações privilegiadas fora do schema exposto pela API.
-- As funções públicas são wrappers SECURITY INVOKER e continuam validando
-- o usuário autenticado dentro das implementações privadas.

alter function public.complete_owner_onboarding(text, text) set schema private;
alter function private.complete_owner_onboarding(text, text) rename to complete_owner_onboarding_impl;

alter function public.accept_farm_invite(text, text, text) set schema private;
alter function private.accept_farm_invite(text, text, text) rename to accept_farm_invite_impl;

alter function public.create_farm_invite(text, text) set schema private;
alter function private.create_farm_invite(text, text) rename to create_farm_invite_impl;

create function public.complete_owner_onboarding(
  p_full_name text,
  p_farm_name text
)
returns table (farm_id uuid, farm_name text, member_role text)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.complete_owner_onboarding_impl(p_full_name, p_farm_name);
$$;

create function public.accept_farm_invite(
  p_full_name text,
  p_code text,
  p_requested_role text
)
returns table (farm_id uuid, farm_name text, member_role text)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.accept_farm_invite_impl(p_full_name, p_code, p_requested_role);
$$;

create function public.create_farm_invite(
  p_role text,
  p_invited_email text default null
)
returns table (invite_id uuid, invite_code text, expires_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.create_farm_invite_impl(p_role, p_invited_email);
$$;

revoke all on function private.complete_owner_onboarding_impl(text, text) from public, anon;
revoke all on function private.accept_farm_invite_impl(text, text, text) from public, anon;
revoke all on function private.create_farm_invite_impl(text, text) from public, anon;
grant execute on function private.complete_owner_onboarding_impl(text, text) to authenticated;
grant execute on function private.accept_farm_invite_impl(text, text, text) to authenticated;
grant execute on function private.create_farm_invite_impl(text, text) to authenticated;

revoke all on function public.complete_owner_onboarding(text, text) from public, anon;
revoke all on function public.accept_farm_invite(text, text, text) from public, anon;
revoke all on function public.create_farm_invite(text, text) from public, anon;
grant execute on function public.complete_owner_onboarding(text, text) to authenticated;
grant execute on function public.accept_farm_invite(text, text, text) to authenticated;
grant execute on function public.create_farm_invite(text, text) to authenticated;

-- Índices para todas as chaves estrangeiras usadas em filtros, joins e RLS.
create index if not exists farms_owner_id_idx
  on public.farms(owner_id);

create index if not exists farm_members_invited_by_idx
  on public.farm_members(invited_by);

create index if not exists farm_invites_farm_id_idx
  on public.farm_invites(farm_id);

create index if not exists farm_invites_created_by_idx
  on public.farm_invites(created_by);

create index if not exists farm_invites_used_by_idx
  on public.farm_invites(used_by)
  where used_by is not null;

-- A tabela de contato já existia. Limita a leitura ao papel authenticated
-- sem depender da função auth.role(), evitando reavaliação linha a linha.
drop policy if exists "Permitir leitura apenas para usuários autenticados" on public.contatos;
create policy "Permitir leitura apenas para usuários autenticados"
on public.contatos for select
to authenticated
using (true);

notify pgrst, 'reload schema';
