begin;

-- Owners may own several farms. Staff onboarding remains limited to one active farm.
drop index if exists public.farm_members_one_active_farm_per_user;
create unique index farm_members_one_active_staff_farm_per_user
  on public.farm_members (user_id)
  where status = 'active' and role <> 'owner';
create index farm_members_active_user_farms_idx
  on public.farm_members (user_id, created_at, farm_id)
  where status = 'active';

create function private.create_owned_farm_impl(p_name text, p_farm_id uuid)
returns table (farm_id uuid, farm_name text, member_role text)
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_name text := btrim(coalesce(p_name, ''));
begin
  if current_user_id is null then
    raise exception 'É necessário entrar na conta.';
  end if;
  if char_length(normalized_name) not between 2 and 120 or p_farm_id is null then
    raise exception 'Informe um nome de fazenda entre 2 e 120 caracteres.';
  end if;
  -- Serialize retries for this owner and require an existing owner membership.
  perform 1 from public.profiles p where p.user_id = current_user_id for update;
  if not exists (
    select 1 from public.farm_members fm where fm.user_id = current_user_id
      and fm.role = 'owner' and fm.status = 'active'
  ) then
    raise exception 'Somente o dono de uma fazenda pode adicionar outra fazenda.';
  end if;

  if exists (select 1 from public.farms f where f.id = p_farm_id) then
    if not exists (
      select 1 from public.farms f where f.id = p_farm_id
        and f.owner_id = current_user_id
        and private.is_farm_owner(f.id, current_user_id)
    ) then
      raise exception 'Não foi possível criar a fazenda. Atualize a página e tente novamente.';
    end if;
    -- A retry after a lost response returns the same farm, without another insert.
    return query select f.id, f.name, 'owner'::text from public.farms f where f.id = p_farm_id;
    return;
  end if;

  insert into public.farms (id, name, owner_id)
    values (p_farm_id, normalized_name, current_user_id);
  insert into public.farm_members (farm_id, user_id, role, status)
    values (p_farm_id, current_user_id, 'owner', 'active');
  return query select p_farm_id, normalized_name, 'owner'::text;
end;
$$;

create function public.create_owned_farm(p_name text, p_farm_id uuid)
returns table (farm_id uuid, farm_name text, member_role text)
language sql security invoker set search_path = ''
as $$ select * from private.create_owned_farm_impl(p_name, p_farm_id); $$;

create function private.create_farm_invite_for_farm_impl(
  p_farm_id uuid, p_role text, p_invited_email text default null
)
returns table (invite_id uuid, invite_code text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  generated_code text;
  created_invite_id uuid;
  created_expiry timestamptz;
  normalized_email text := nullif(lower(btrim(coalesce(p_invited_email, ''))), '');
begin
  if current_user_id is null then
    raise exception 'É necessário entrar na conta.';
  end if;
  if p_role is null or p_role not in ('vaqueiro', 'caseiro') then
    raise exception 'Somente os cargos vaqueiro e caseiro podem ser convidados.';
  end if;
  if not private.is_farm_owner(p_farm_id, current_user_id) then
    raise exception 'Somente o dono desta fazenda pode criar convites.';
  end if;
  generated_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.farm_invites (farm_id, code, role, invited_email, created_by)
    values (p_farm_id, generated_code, p_role, normalized_email, current_user_id)
    returning id, farm_invites.expires_at into created_invite_id, created_expiry;
  return query select created_invite_id, generated_code, created_expiry;
end;
$$;

create function public.create_farm_invite_for_farm(
  p_farm_id uuid, p_role text, p_invited_email text default null
)
returns table (invite_id uuid, invite_code text, expires_at timestamptz)
language sql security invoker set search_path = ''
as $$ select * from private.create_farm_invite_for_farm_impl(p_farm_id, p_role, p_invited_email); $$;

-- Older cached clients may invite only when the farm is unambiguous.
create or replace function private.create_farm_invite_impl(p_role text, p_invited_email text default null)
returns table (invite_id uuid, invite_code text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  owner_farm_ids uuid[];
begin
  select array_agg(fm.farm_id) into owner_farm_ids from public.farm_members fm
    where fm.user_id = auth.uid() and fm.role = 'owner' and fm.status = 'active';
  if coalesce(cardinality(owner_farm_ids), 0) = 0 then
    raise exception 'Somente o dono pode criar convites.';
  end if;
  if cardinality(owner_farm_ids) > 1 then
    raise exception 'Atualize o site e selecione a fazenda antes de gerar um convite.';
  end if;
  return query select * from private.create_farm_invite_for_farm_impl(owner_farm_ids[1], p_role, p_invited_email);
end;
$$;

revoke all on function private.create_owned_farm_impl(text, uuid) from public, anon;
revoke all on function public.create_owned_farm(text, uuid) from public, anon;
revoke all on function private.create_farm_invite_for_farm_impl(uuid, text, text) from public, anon;
revoke all on function public.create_farm_invite_for_farm(uuid, text, text) from public, anon;
grant execute on function private.create_owned_farm_impl(text, uuid) to authenticated;
grant execute on function public.create_owned_farm(text, uuid) to authenticated;
grant execute on function private.create_farm_invite_for_farm_impl(uuid, text, text) to authenticated;
grant execute on function public.create_farm_invite_for_farm(uuid, text, text) to authenticated;

commit;
