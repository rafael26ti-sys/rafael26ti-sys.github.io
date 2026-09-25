-- All test records are rolled back after checking the live RLS policies.
begin;
do $$
declare
  farm_owner uuid := gen_random_uuid();
  farm_manager uuid := gen_random_uuid();
  other_owner uuid := gen_random_uuid();
  current_farm uuid := gen_random_uuid();
  other_farm uuid := gen_random_uuid();
begin
  insert into auth.users (id) values (farm_owner), (farm_manager), (other_owner);
  insert into public.farms (id, name, owner_id) values
    (current_farm, 'TESTE MAPA A', farm_owner),
    (other_farm, 'TESTE MAPA B', other_owner);
  insert into public.farm_members (farm_id, user_id, role, status) values
    (current_farm, farm_owner, 'owner', 'active'),
    (current_farm, farm_manager, 'gerente', 'active'),
    (other_farm, other_owner, 'owner', 'active');
  perform set_config('test.map.owner', farm_owner::text, true);
  perform set_config('test.map.manager', farm_manager::text, true);
  perform set_config('test.map.farm', current_farm::text, true);
  perform set_config('test.map.foreign', other_farm::text, true);
end;
$$;
set local role authenticated;
do $$
declare affected integer; rejected boolean;
begin
  perform set_config('request.jwt.claim.sub', current_setting('test.map.manager'), true);
  update public.farms set location_latitude = -19.920800, location_longitude = -43.937800
    where id = current_setting('test.map.farm')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Manager edited a farm location'; end if;
  if exists (select 1 from public.farms where id = current_setting('test.map.foreign')::uuid) then
    raise exception 'Manager read another farm location';
  end if;
  rejected := false;
  begin perform public.delete_owned_farm(current_setting('test.map.farm')::uuid, 'TESTE MAPA A');
    exception when others then rejected := true; end;
  if not rejected then raise exception 'Manager deleted a farm'; end if;

  perform set_config('request.jwt.claim.sub', current_setting('test.map.owner'), true);
  update public.farms set location_latitude = -19.920800, location_longitude = -43.937800
    where id = current_setting('test.map.farm')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner cannot save the farm location'; end if;
  update public.farms set location_latitude = 0, location_longitude = 0
    where id = current_setting('test.map.foreign')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Owner edited another farm location'; end if;
  rejected := false;
  begin update public.farms set location_latitude = 91, location_longitude = 0
    where id = current_setting('test.map.farm')::uuid;
    exception when check_violation then rejected := true; end;
  if not rejected then raise exception 'Invalid coordinates were accepted'; end if;

  perform set_config('request.jwt.claim.sub', current_setting('test.map.manager'), true);
  if not exists (
    select 1 from public.farms where id = current_setting('test.map.farm')::uuid
      and location_latitude = -19.920800 and location_longitude = -43.937800
  ) then raise exception 'Manager cannot see their farm location'; end if;
end;
$$;
rollback;
