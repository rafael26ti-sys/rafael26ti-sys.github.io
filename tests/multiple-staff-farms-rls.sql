-- Synthetic people and farms exist only inside this rolled-back transaction.
begin;
do $$
declare
  owner_a uuid := gen_random_uuid(); owner_b uuid := gen_random_uuid(); owner_c uuid := gen_random_uuid();
  manager_id uuid := gen_random_uuid(); staff_id uuid := gen_random_uuid();
  farm_a uuid := gen_random_uuid(); farm_b uuid := gen_random_uuid(); farm_c uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (owner_a), (owner_b), (owner_c), (manager_id), (staff_id);
  insert into public.farms(id,name,owner_id) values
    (farm_a,'TESTE MULTI A',owner_a),(farm_b,'TESTE MULTI B',owner_b),(farm_c,'TESTE MULTI C',owner_c);
  insert into public.farm_members(farm_id,user_id,role,status) values
    (farm_a,owner_a,'owner','active'),(farm_b,owner_b,'owner','active'),
    (farm_c,owner_c,'owner','active'),(farm_a,manager_id,'gerente','active');
  insert into public.tasks(farm_id,title,due_date,category,created_by) values
    (farm_a,'TESTE TAREFA A',current_date,'Rotina',owner_a),
    (farm_b,'TESTE TAREFA B',current_date,'Rotina',owner_b),
    (farm_c,'TESTE TAREFA C',current_date,'Rotina',owner_c);
  perform set_config('test.multi.owner_a',owner_a::text,true);
  perform set_config('test.multi.owner_b',owner_b::text,true);
  perform set_config('test.multi.manager',manager_id::text,true);
  perform set_config('test.multi.staff',staff_id::text,true);
  perform set_config('test.multi.farm_a',farm_a::text,true);
  perform set_config('test.multi.farm_b',farm_b::text,true);
  perform set_config('test.multi.farm_c',farm_c::text,true);
end;
$$;
set local role authenticated;
do $$
declare code text;
begin
  perform set_config('request.jwt.claim.sub',current_setting('test.multi.owner_b'),true);
  select invite_code into code from public.create_farm_invite_for_farm(current_setting('test.multi.farm_b')::uuid,'gerente',null);
  perform set_config('request.jwt.claim.sub',current_setting('test.multi.manager'),true);
  perform * from public.accept_farm_invite('TESTE GERENTE',code,'gerente');
  if (select count(*) from public.farms) <> 2 then raise exception 'Manager cannot see exactly their two farms'; end if;
  if exists (select 1 from public.farms where id=current_setting('test.multi.farm_c')::uuid) then
    raise exception 'Manager sees a foreign farm'; end if;

  perform set_config('request.jwt.claim.sub',current_setting('test.multi.owner_b'),true);
  select invite_code into code from public.create_farm_invite_for_farm(current_setting('test.multi.farm_b')::uuid,'caseiro',null);
  perform set_config('request.jwt.claim.sub',current_setting('test.multi.staff'),true);
  perform * from public.accept_farm_invite('TESTE CASEIRO',code,'caseiro');
  perform set_config('request.jwt.claim.sub',current_setting('test.multi.manager'),true);
  select invite_code into code from public.create_farm_invite_for_farm(current_setting('test.multi.farm_a')::uuid,'vaqueiro',null);
  perform set_config('request.jwt.claim.sub',current_setting('test.multi.staff'),true);
  begin
    perform * from public.accept_farm_invite('TESTE CASEIRO',code,'vaqueiro');
    raise exception 'Manager invite added an existing worker to a second farm';
  exception when others then
    if sqlerrm = 'Manager invite added an existing worker to a second farm' then raise; end if;
  end;
  if exists (select 1 from public.farm_members where farm_id=current_setting('test.multi.farm_a')::uuid and user_id=auth.uid()) then
    raise exception 'Unauthorized second membership was inserted'; end if;

  perform set_config('request.jwt.claim.sub',current_setting('test.multi.owner_a'),true);
  select invite_code into code from public.create_farm_invite_for_farm(current_setting('test.multi.farm_a')::uuid,'vaqueiro',null);
  perform set_config('request.jwt.claim.sub',current_setting('test.multi.staff'),true);
  perform * from public.accept_farm_invite('TESTE CASEIRO',code,'vaqueiro');
  if (select count(*) from public.farms) <> 2 or
    not exists (select 1 from public.farm_members where farm_id=current_setting('test.multi.farm_a')::uuid and user_id=auth.uid() and role='vaqueiro') or
    not exists (select 1 from public.farm_members where farm_id=current_setting('test.multi.farm_b')::uuid and user_id=auth.uid() and role='caseiro') then
    raise exception 'Worker did not receive separate roles for both farms'; end if;
  if exists (select 1 from public.farms where id=current_setting('test.multi.farm_c')::uuid) then
    raise exception 'Worker sees a foreign farm'; end if;
  if (select count(*) from public.tasks where title like 'TESTE TAREFA %') <> 2 then
    raise exception 'Worker sees tasks outside both authorised farms'; end if;

  perform set_config('request.jwt.claim.sub',current_setting('test.multi.owner_a'),true);
  update public.farm_members set status='inactive'
    where farm_id=current_setting('test.multi.farm_a')::uuid and user_id=current_setting('test.multi.staff')::uuid;
  perform set_config('request.jwt.claim.sub',current_setting('test.multi.staff'),true);
  if (select count(*) from public.farms) <> 1 or
    not exists (select 1 from public.farms where id=current_setting('test.multi.farm_b')::uuid) then
    raise exception 'Removing one farm access affected the other farm'; end if;
  if (select count(*) from public.tasks where title like 'TESTE TAREFA %') <> 1 then
    raise exception 'Removing one farm did not isolate its tasks'; end if;
end;
$$;
rollback;
