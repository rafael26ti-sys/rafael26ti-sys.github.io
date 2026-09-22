-- Synthetic accounts and farms exist only inside this rolled-back transaction.
begin;
do $$
declare
  owner_a uuid := gen_random_uuid(); owner_b uuid := gen_random_uuid();
  manager_a uuid := gen_random_uuid(); staff_a uuid := gen_random_uuid();
  farm_b uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (owner_a), (owner_b), (manager_a), (staff_a);
  insert into public.farms(id, name, owner_id) values (farm_b, 'TESTE FAZENDA B', owner_b);
  insert into public.farm_members(farm_id, user_id, role, status) values (farm_b, owner_b, 'owner', 'active');
  perform set_config('test.owner_a', owner_a::text, true);
  perform set_config('test.owner_b', owner_b::text, true);
  perform set_config('test.manager', manager_a::text, true);
  perform set_config('test.staff', staff_a::text, true);
  perform set_config('test.farm_b', farm_b::text, true);
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
end;
$$;
set local role authenticated;
do $$
declare original_farm uuid; next_farm uuid := gen_random_uuid(); manager_code text;
begin
  select farm_id into original_farm from public.complete_owner_onboarding('TESTE DONO A', 'TESTE FAZENDA A');
  perform set_config('test.farm_a', original_farm::text, true);
  perform * from public.create_owned_farm('TESTE FAZENDA A2', next_farm);
  perform set_config('test.farm_a2', next_farm::text, true);
  select invite_code into manager_code from public.create_farm_invite_for_farm(original_farm, 'gerente', null);
  perform set_config('test.manager_code', manager_code, true);
  if manager_code is null then raise exception 'Owner cannot invite a manager'; end if;
  perform set_config('request.jwt.claim.sub', current_setting('test.manager'), true);
end;
$$;
do $$
declare staff_code text; rejected boolean;
begin
  perform * from public.accept_farm_invite('TESTE GERENTE', current_setting('test.manager_code'), 'gerente');
  if not exists (
    select 1 from public.farm_members where farm_id = current_setting('test.farm_a')::uuid
      and user_id = auth.uid() and role = 'gerente' and status = 'active'
  ) then raise exception 'Manager not admitted to the intended farm'; end if;
  select invite_code into staff_code from public.create_farm_invite_for_farm(current_setting('test.farm_a')::uuid, 'vaqueiro', null);
  if staff_code is null then raise exception 'Manager cannot invite staff'; end if;
  perform set_config('test.staff_code', staff_code, true);
  if (select count(*) from public.farm_invites where farm_id = current_setting('test.farm_a')::uuid) <> 1 then
    raise exception 'Manager sees an invite they did not create';
  end if;
  rejected := false;
  begin perform * from public.create_farm_invite_for_farm(current_setting('test.farm_a')::uuid, 'gerente', null);
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Manager invited another manager'; end if;
  rejected := false;
  begin perform * from public.create_farm_invite_for_farm(current_setting('test.farm_b')::uuid, 'caseiro', null);
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Manager invited staff into a foreign farm'; end if;
  rejected := false;
  begin perform * from public.delete_owned_farm(current_setting('test.farm_a')::uuid, 'TESTE FAZENDA A');
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Manager deleted a farm'; end if;
  rejected := false;
  begin perform * from public.list_owned_farm_evidence(current_setting('test.farm_a')::uuid, '');
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Manager listed owner-only file paths'; end if;
  if exists (select 1 from public.farms where id = current_setting('test.farm_b')::uuid) then
    raise exception 'Manager can read the foreign farm';
  end if;
  update public.farm_members set role = 'owner'
    where farm_id = current_setting('test.farm_a')::uuid and user_id = auth.uid();
  if exists (
    select 1 from public.farm_members where farm_id = current_setting('test.farm_a')::uuid
      and user_id = auth.uid() and role = 'owner'
  ) then raise exception 'Manager promoted themselves'; end if;
  perform set_config('request.jwt.claim.sub', current_setting('test.staff'), true);
end;
$$;
do $$
declare rejected boolean := false;
begin
  perform * from public.accept_farm_invite('TESTE VAQUEIRO', current_setting('test.staff_code'), 'vaqueiro');
  if not exists (select 1 from public.farm_members where farm_id = current_setting('test.farm_a')::uuid
     and user_id = auth.uid() and role = 'vaqueiro') then raise exception 'Staff invitation did not join the proper farm'; end if;
  begin perform * from public.create_farm_invite_for_farm(current_setting('test.farm_a')::uuid, 'caseiro', null);
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Staff created a team invitation'; end if;
  perform set_config('request.jwt.claim.sub', current_setting('test.owner_a'), true);
end;
$$;
do $$
declare rejected boolean; deleted boolean;
begin
  if (select count(*) from public.farm_invites where farm_id = current_setting('test.farm_a')::uuid) <> 2 then
    raise exception 'Owner cannot view both invitations'; end if;
  insert into public.transactions (farm_id, transaction_type, occurred_on, description, category, amount)
    values (current_setting('test.farm_a2')::uuid, 'despesa', current_date, 'TESTE ALIMENTO', 'Insumos', 12);
  insert into public.tasks (farm_id, title, due_date, category)
    values (current_setting('test.farm_a2')::uuid, 'TESTE ORDEM', current_date, 'Rotina');
  insert into public.animals (farm_id, identifier, species)
    values (current_setting('test.farm_a2')::uuid, 'TESTE ANIMAL', 'Bovino');
  if (select count(*) from public.activity_log where farm_id = current_setting('test.farm_a2')::uuid) < 3 then
    raise exception 'Test records were not audited'; end if;
  rejected := false;
  begin perform * from public.delete_owned_farm(current_setting('test.farm_a2')::uuid, 'NOME INCORRETO');
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Deletion did not require the exact name'; end if;
  rejected := false;
  begin perform * from public.delete_owned_farm(current_setting('test.farm_b')::uuid, 'TESTE FAZENDA B');
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Owner deleted a foreign farm'; end if;
  select public.delete_owned_farm(current_setting('test.farm_a2')::uuid, 'TESTE FAZENDA A2') into deleted;
  if not deleted then raise exception 'Owner could not delete the selected farm'; end if;
  if exists (select 1 from public.farms where id = current_setting('test.farm_a2')::uuid) then
    raise exception 'Deleted farm still exists'; end if;
  if exists (select 1 from public.transactions where farm_id = current_setting('test.farm_a2')::uuid) or
     exists (select 1 from public.tasks where farm_id = current_setting('test.farm_a2')::uuid) or
     exists (select 1 from public.animals where farm_id = current_setting('test.farm_a2')::uuid) or
     exists (select 1 from public.activity_log where farm_id = current_setting('test.farm_a2')::uuid) then
    raise exception 'Deleted farm retained records'; end if;
  if not exists (select 1 from public.farms where id = current_setting('test.farm_a')::uuid) or
     not exists (select 1 from public.farm_members where farm_id = current_setting('test.farm_a')::uuid
       and user_id = current_setting('test.manager')::uuid and role = 'gerente') then
    raise exception 'Other farms or team were changed'; end if;
  perform set_config('request.jwt.claim.sub', current_setting('test.manager'), true);
  rejected := false;
  begin perform * from public.create_farm_invite_for_farm(current_setting('test.farm_a')::uuid, 'owner', null);
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Manager invited an owner'; end if;
end;
$$;
set local role anon;
do $$
declare rejected boolean := false;
begin
  begin perform * from public.delete_owned_farm(current_setting('test.farm_b')::uuid, 'TESTE FAZENDA B');
    exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Unauthenticated farm deletion was allowed'; end if;
end;
$$;
rollback;
select 'PASS: manager admission and staff invites, owner-only manager role and farm deletion, tenant isolation; fixtures rolled back' as result;
