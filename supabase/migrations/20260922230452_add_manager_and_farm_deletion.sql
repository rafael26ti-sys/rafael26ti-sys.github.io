begin;

-- A manager is staff: only an owner can appoint one, and managers can invite
-- vaqueiros and caseiros within their own active farm.
alter table public.farm_members drop constraint farm_members_role_check;
alter table public.farm_members add constraint farm_members_role_check
  check (role in ('owner', 'gerente', 'vaqueiro', 'caseiro'));
alter table public.farm_invites drop constraint farm_invites_role_check;
alter table public.farm_invites add constraint farm_invites_role_check
  check (role in ('gerente', 'vaqueiro', 'caseiro'));
alter table public.activity_log drop constraint activity_log_actor_role_check;
alter table public.activity_log add constraint activity_log_actor_role_check
  check (actor_role is null or actor_role in ('owner', 'gerente', 'vaqueiro', 'caseiro'));

drop policy if exists farm_members_update_owner on public.farm_members;
create policy farm_members_update_owner on public.farm_members for update to authenticated
using (private.is_farm_owner(farm_id, (select auth.uid())) and user_id <> (select auth.uid()))
with check (
  private.is_farm_owner(farm_id, (select auth.uid()))
  and user_id <> (select auth.uid())
  and role in ('gerente', 'vaqueiro', 'caseiro')
);

create policy farm_invites_manager_read_own on public.farm_invites for select to authenticated
using (
  created_by = (select auth.uid())
  and private.has_farm_role(farm_id, (select auth.uid()), array['gerente']::text[])
);
create policy farm_invites_manager_cancel_own on public.farm_invites for delete to authenticated
using (
  created_by = (select auth.uid()) and used_at is null
  and private.has_farm_role(farm_id, (select auth.uid()), array['gerente']::text[])
);

create or replace function private.accept_farm_invite_impl(
  p_full_name text, p_code text, p_requested_role text
)
returns table (farm_id uuid, farm_name text, member_role text)
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  selected_invite public.farm_invites%rowtype;
  selected_farm_name text;
  normalized_name text := trim(p_full_name);
begin
  if current_user_id is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_requested_role is null or p_requested_role not in ('gerente', 'vaqueiro', 'caseiro') then
    raise exception 'Cargo inválido.';
  end if;
  if exists (select 1 from public.farm_members where user_id = current_user_id and status = 'active') then
    raise exception 'Esta conta já está vinculada a uma propriedade.';
  end if;
  select * into selected_invite
    from public.farm_invites
    where code = upper(trim(p_code)) and used_at is null and expires_at > now()
    for update;
  if not found then raise exception 'Convite inválido, usado ou vencido.'; end if;
  if selected_invite.role <> p_requested_role then
    raise exception 'O cargo selecionado não corresponde ao convite.';
  end if;
  if selected_invite.invited_email is not null and lower(selected_invite.invited_email) <> current_email then
    raise exception 'Este convite foi criado para outro e-mail.';
  end if;
  insert into public.profiles (user_id, full_name)
    values (current_user_id, normalized_name)
    on conflict (user_id) do update set full_name = excluded.full_name, updated_at = now();
  insert into public.farm_members (farm_id, user_id, role, status, invited_by)
    values (selected_invite.farm_id, current_user_id, selected_invite.role, 'active', selected_invite.created_by);
  update public.farm_invites set used_by = current_user_id, used_at = now()
    where id = selected_invite.id;
  select name into selected_farm_name from public.farms where id = selected_invite.farm_id;
  return query select selected_invite.farm_id, selected_farm_name, selected_invite.role;
end;
$$;

create or replace function private.create_farm_invite_for_farm_impl(
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
  if current_user_id is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_role is null or p_role not in ('gerente', 'vaqueiro', 'caseiro') then
    raise exception 'Cargo inválido.';
  end if;
  if not private.is_farm_owner(p_farm_id, current_user_id) then
    if p_role = 'gerente' or not private.has_farm_role(p_farm_id, current_user_id, array['gerente']::text[]) then
      raise exception 'Somente o dono pode convidar gerentes; funcionários são convidados pelo dono ou gerente desta fazenda.';
    end if;
  end if;
  generated_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.farm_invites (farm_id, code, role, invited_email, created_by)
    values (p_farm_id, generated_code, p_role, normalized_email, current_user_id)
    returning id, farm_invites.expires_at into created_invite_id, created_expiry;
  return query select created_invite_id, generated_code, created_expiry;
end;
$$;

-- Permit the owner to remove files by their farm path, even if a task was
-- deleted earlier. Files themselves are removed through the Storage API.
create policy task_evidence_owner_select on storage.objects for select to authenticated
using (
  bucket_id = 'task-evidence' and exists (
    select 1 from public.farms f where f.id::text = split_part(name, '/', 1)
      and f.owner_id = (select auth.uid())
      and private.is_farm_owner(f.id, (select auth.uid()))
  )
);
create policy task_evidence_owner_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'task-evidence' and exists (
    select 1 from public.farms f where f.id::text = split_part(name, '/', 1)
      and f.owner_id = (select auth.uid())
      and private.is_farm_owner(f.id, (select auth.uid()))
  )
);

create function private.list_owned_farm_evidence_impl(p_farm_id uuid, p_after text default '')
returns table (path text)
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.farms f where f.id = p_farm_id and f.owner_id = auth.uid()
      and private.is_farm_owner(f.id, auth.uid())
  ) then raise exception 'Somente o dono desta fazenda pode consultar os anexos.'; end if;
  return query
    select o.name from storage.objects o
    where o.bucket_id = 'task-evidence' and o.name like p_farm_id::text || '/%'
      and o.name > coalesce(p_after, '')
    order by o.name limit 100;
end;
$$;
create function public.list_owned_farm_evidence(p_farm_id uuid, p_after text default '')
returns table (path text)
language sql security invoker set search_path = ''
as $$ select * from private.list_owned_farm_evidence_impl(p_farm_id, p_after); $$;

create function private.delete_owned_farm_impl(p_farm_id uuid, p_name text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  stored_name text;
begin
  if auth.uid() is null then raise exception 'É necessário entrar na conta.'; end if;
  select f.name into stored_name from public.farms f
    where f.id = p_farm_id and f.owner_id = auth.uid()
      and private.is_farm_owner(f.id, auth.uid())
    for update;
  if not found then raise exception 'Somente o dono desta fazenda pode excluí-la.'; end if;
  if stored_name <> btrim(coalesce(p_name, '')) then
    raise exception 'O nome informado não corresponde ao da fazenda.';
  end if;
  if exists (
    select 1 from storage.objects o
    where o.bucket_id = 'task-evidence' and o.name like p_farm_id::text || '/%'
  ) then
    raise exception 'Ainda existem fotos nesta fazenda. Tente novamente para concluir a exclusão.';
  end if;
  delete from public.farms f where f.id = p_farm_id and f.owner_id = auth.uid();
  if not found then raise exception 'A fazenda não foi encontrada.'; end if;
  return true;
end;
$$;
create function public.delete_owned_farm(p_farm_id uuid, p_name text)
returns boolean
language sql security invoker set search_path = ''
as $$ select private.delete_owned_farm_impl(p_farm_id, p_name); $$;

revoke all on function private.list_owned_farm_evidence_impl(uuid, text) from public, anon;
revoke all on function public.list_owned_farm_evidence(uuid, text) from public, anon;
revoke all on function private.delete_owned_farm_impl(uuid, text) from public, anon;
revoke all on function public.delete_owned_farm(uuid, text) from public, anon;
grant execute on function private.list_owned_farm_evidence_impl(uuid, text) to authenticated;
grant execute on function public.list_owned_farm_evidence(uuid, text) to authenticated;
grant execute on function private.delete_owned_farm_impl(uuid, text) to authenticated;
grant execute on function public.delete_owned_farm(uuid, text) to authenticated;

commit;
