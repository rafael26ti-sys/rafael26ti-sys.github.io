-- Integration test: all synthetic users, farms, invites and logs are rolled back.
begin;
do $$
declare
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  worker uuid := gen_random_uuid();
  farm_b uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (owner_a), (owner_b), (worker);
  insert into public.farms(id, name, owner_id) values (farm_b, 'TESTE TRANSACIONAL B', owner_b);
  insert into public.farm_members(farm_id, user_id, role, status)
    values (farm_b, owner_b, 'owner', 'active'), (farm_b, worker, 'vaqueiro', 'active');
  perform set_config('test.owner_a', owner_a::text, true);
  perform set_config('test.owner_b', owner_b::text, true);
  perform set_config('test.worker', worker::text, true);
  perform set_config('test.farm_b', farm_b::text, true);
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
end;
$$;
set local role authenticated;
do $$
declare
  original_farm uuid;
  next_farm uuid := gen_random_uuid();
  returned_farm uuid;
  invite uuid;
  rejected boolean;
  deleted_count integer;
  selected_log bigint;
  logs_before bigint;
begin
  select farm_id into original_farm from public.complete_owner_onboarding('TESTE TRANSACIONAL A', 'TESTE TRANSACIONAL A');
  if original_farm is null then raise exception 'Initial onboarding failed'; end if;
  select farm_id into returned_farm from public.create_owned_farm('  TESTE TRANSACIONAL A2  ', next_farm);
  if returned_farm <> next_farm then raise exception 'Wrong farm returned'; end if;
  perform * from public.create_owned_farm('TESTE TRANSACIONAL A2', next_farm);
  if (select count(*) from public.farm_members where user_id = auth.uid() and role = 'owner' and status = 'active') <> 2 then
    raise exception 'Multiple ownership or idempotency failed';
  end if;
  if (select name from public.farms where id = next_farm) <> 'TESTE TRANSACIONAL A2' then raise exception 'Name normalization failed'; end if;
  if exists (select 1 from public.farms where id = current_setting('test.farm_b')::uuid) then raise exception 'Foreign farm visible'; end if;

  select invite_id into invite from public.create_farm_invite_for_farm(next_farm, 'caseiro', null);
  if not exists (select 1 from public.farm_invites where id = invite and farm_id = next_farm) then raise exception 'Invite in wrong farm'; end if;
  rejected := false;
  begin perform * from public.create_farm_invite('caseiro', null); exception when others then rejected := true; end;
  if not rejected then raise exception 'Ambiguous legacy invite allowed'; end if;
  rejected := false;
  begin perform * from public.create_farm_invite_for_farm(current_setting('test.farm_b')::uuid, 'caseiro', null); exception when others then rejected := true; end;
  if not rejected then raise exception 'Foreign invite allowed'; end if;
  rejected := false;
  begin perform * from public.create_farm_invite_for_farm(next_farm, 'owner', null); exception when others then rejected := true; end;
  if not rejected then raise exception 'Owner invitation allowed'; end if;
  rejected := false;
  begin perform * from public.create_owned_farm('x', gen_random_uuid()); exception when others then rejected := true; end;
  if not rejected then raise exception 'Invalid farm name allowed'; end if;
  rejected := false;
  begin perform * from public.create_owned_farm('TESTE', current_setting('test.farm_b')::uuid); exception when others then rejected := true; end;
  if not rejected then raise exception 'Foreign idempotency ID accepted'; end if;

  select count(*) into logs_before from public.activity_log where farm_id = next_farm;
  select id into selected_log from public.activity_log where farm_id = next_farm order by id limit 1;
  if selected_log is null then raise exception 'Test activity log missing'; end if;
  delete from public.activity_log where farm_id = next_farm and id = selected_log;
  get diagnostics deleted_count = row_count;
  if deleted_count <> 1 or (select count(*) from public.activity_log where farm_id = next_farm) <> logs_before - 1 then raise exception 'Owner history deletion failed'; end if;
  if not exists (select 1 from public.farms where id = next_farm) then raise exception 'Source farm removed with log'; end if;
  delete from public.activity_log where farm_id = current_setting('test.farm_b')::uuid;
  get diagnostics deleted_count = row_count;
  if deleted_count <> 0 then raise exception 'Foreign history deletion allowed'; end if;
  perform set_config('test.new_farm', next_farm::text, true);
  perform set_config('request.jwt.claim.sub', current_setting('test.worker'), true);
end;
$$;
do $$
declare
  rejected boolean := false;
  deleted_count integer;
begin
  begin perform * from public.create_owned_farm('TESTE WORKER', gen_random_uuid()); exception when others then rejected := true; end;
  if not rejected then raise exception 'Worker became owner'; end if;
  rejected := false;
  begin perform * from public.create_farm_invite_for_farm(current_setting('test.farm_b')::uuid, 'caseiro', null); exception when others then rejected := true; end;
  if not rejected then raise exception 'Worker created invitation'; end if;
  if exists (select 1 from public.farms where id = current_setting('test.new_farm')::uuid) then raise exception 'Worker sees another farm'; end if;
  delete from public.activity_log where farm_id = current_setting('test.farm_b')::uuid;
  get diagnostics deleted_count = row_count;
  if deleted_count <> 0 then raise exception 'Worker erased history'; end if;
end;
$$;
set local role anon;
do $$
declare rejected boolean := false;
begin
  begin perform * from public.create_owned_farm('TESTE ANON', gen_random_uuid()); exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Anonymous creation allowed'; end if;
end;
$$;
rollback;
select 'PASS: onboarding, multiple farms, retry, invitations, RLS and history deletion; fixtures rolled back' as result;
