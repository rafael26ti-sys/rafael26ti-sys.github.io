begin;

-- Cascaded DELETE triggers write to activity_log. Remove audited child rows
-- while the farm still exists, then remove their logs and finally the farm.
create or replace function private.delete_owned_farm_impl(p_farm_id uuid, p_name text)
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

  delete from public.transactions where farm_id = p_farm_id;
  delete from public.tasks where farm_id = p_farm_id;
  delete from public.animals where farm_id = p_farm_id;
  delete from public.crops where farm_id = p_farm_id;
  delete from public.inventory_items where farm_id = p_farm_id;
  delete from public.machines where farm_id = p_farm_id;
  delete from public.farm_invites where farm_id = p_farm_id;
  delete from public.farm_members where farm_id = p_farm_id;
  delete from public.activity_log where farm_id = p_farm_id;

  delete from public.farms f where f.id = p_farm_id and f.owner_id = auth.uid();
  if not found then raise exception 'A fazenda não foi encontrada.'; end if;
  return true;
end;
$$;

commit;
