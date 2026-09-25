begin;

-- A user may have several active farm memberships. Access to each farm is
-- still checked by the existing farm-scoped RLS policies.
drop index if exists public.farm_members_one_active_staff_farm_per_user;

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
  normalized_name text := btrim(coalesce(p_full_name, ''));
  already_active boolean;
begin
  if current_user_id is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_requested_role is null or p_requested_role not in ('gerente', 'vaqueiro', 'caseiro') then
    raise exception 'Cargo inválido.';
  end if;
  if char_length(normalized_name) not between 2 and 100 then
    raise exception 'Informe seu nome completo.';
  end if;
  -- Serialise two invitations accepted at the same time by the same person.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 0));
  select exists (
    select 1 from public.farm_members fm
    where fm.user_id = current_user_id and fm.status = 'active'
  ) into already_active;

  select * into selected_invite from public.farm_invites
    where code = upper(btrim(coalesce(p_code, '')))
      and used_at is null and expires_at > now()
    for update;
  if not found then raise exception 'Convite inválido, usado ou vencido.'; end if;
  if selected_invite.role <> p_requested_role then
    raise exception 'O cargo selecionado não corresponde ao convite.';
  end if;
  if selected_invite.invited_email is not null and selected_invite.invited_email <> current_email then
    raise exception 'Este convite foi criado para outro e-mail.';
  end if;
  if exists (
    select 1 from public.farm_members fm
    where fm.user_id = current_user_id and fm.farm_id = selected_invite.farm_id
  ) then
    raise exception 'Você já possui um vínculo com esta fazenda. Peça ao dono para reativá-lo, se necessário.';
  end if;
  if already_active and not exists (
    select 1 from public.farms f
    where f.id = selected_invite.farm_id and f.owner_id = selected_invite.created_by
      and private.is_farm_owner(f.id, selected_invite.created_by)
  ) then
    raise exception 'Para entrar em outra fazenda, peça um convite emitido pelo dono dela.';
  end if;

  insert into public.profiles (user_id, full_name)
    values (current_user_id, normalized_name)
    on conflict (user_id) do nothing;
  insert into public.farm_members (farm_id, user_id, role, status, invited_by)
    values (selected_invite.farm_id, current_user_id, selected_invite.role, 'active', selected_invite.created_by);
  update public.farm_invites set used_by = current_user_id, used_at = now()
    where id = selected_invite.id;
  select f.name into selected_farm_name from public.farms f where f.id = selected_invite.farm_id;
  return query select selected_invite.farm_id, selected_farm_name, selected_invite.role;
end;
$$;

commit;
