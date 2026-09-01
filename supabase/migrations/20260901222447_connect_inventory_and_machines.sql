alter table public.inventory_movements
  add column if not exists created_by uuid
  default auth.uid()
  references auth.users(id) on delete set null;

alter table public.machine_records
  add column if not exists created_by uuid
  default auth.uid()
  references auth.users(id) on delete set null;

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.machines enable row level security;
alter table public.machine_records enable row level security;

drop policy if exists inventory_items_select_member on public.inventory_items;
drop policy if exists inventory_items_insert_manager on public.inventory_items;
drop policy if exists inventory_items_update_manager on public.inventory_items;
drop policy if exists inventory_items_delete_owner on public.inventory_items;

create policy inventory_items_select_member
on public.inventory_items
for select
to authenticated
using (
  (select private.is_farm_member(farm_id, (select auth.uid())))
);

create policy inventory_items_insert_manager
on public.inventory_items
for insert
to authenticated
with check (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'caseiro']::text[]
  ))
);

create policy inventory_items_update_manager
on public.inventory_items
for update
to authenticated
using (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'caseiro']::text[]
  ))
)
with check (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'caseiro']::text[]
  ))
);

create policy inventory_items_delete_owner
on public.inventory_items
for delete
to authenticated
using (
  (select private.is_farm_owner(farm_id, (select auth.uid())))
);

drop policy if exists inventory_movements_select_member on public.inventory_movements;

create policy inventory_movements_select_member
on public.inventory_movements
for select
to authenticated
using (
  exists (
    select 1
    from public.inventory_items item
    where item.id = inventory_item_id
      and (select private.is_farm_member(item.farm_id, (select auth.uid())))
  )
);

drop policy if exists machines_select_member on public.machines;
drop policy if exists machines_insert_manager on public.machines;
drop policy if exists machines_update_manager on public.machines;
drop policy if exists machines_delete_owner on public.machines;

create policy machines_select_member
on public.machines
for select
to authenticated
using (
  (select private.is_farm_member(farm_id, (select auth.uid())))
);

create policy machines_insert_manager
on public.machines
for insert
to authenticated
with check (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'caseiro']::text[]
  ))
);

create policy machines_update_manager
on public.machines
for update
to authenticated
using (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'caseiro']::text[]
  ))
)
with check (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'caseiro']::text[]
  ))
);

create policy machines_delete_owner
on public.machines
for delete
to authenticated
using (
  (select private.is_farm_owner(farm_id, (select auth.uid())))
);

drop policy if exists machine_records_select_member on public.machine_records;

create policy machine_records_select_member
on public.machine_records
for select
to authenticated
using (
  exists (
    select 1
    from public.machines machine
    where machine.id = machine_id
      and (select private.is_farm_member(machine.farm_id, (select auth.uid())))
  )
);

revoke all on table public.inventory_items from public, anon, authenticated;
grant select on table public.inventory_items to authenticated;
grant insert (
  farm_id,
  name,
  category,
  quantity,
  unit,
  minimum_quantity,
  storage_location
) on public.inventory_items to authenticated;
grant update (
  name,
  category,
  quantity,
  unit,
  minimum_quantity,
  storage_location,
  updated_at
) on public.inventory_items to authenticated;
grant delete on table public.inventory_items to authenticated;

revoke all on table public.inventory_movements from public, anon, authenticated;
grant select on table public.inventory_movements to authenticated;

revoke all on table public.machines from public, anon, authenticated;
grant select on table public.machines to authenticated;
grant insert (
  farm_id,
  name,
  machine_type,
  brand,
  model,
  manufacture_year,
  work_hours,
  fuel_consumption_liters,
  last_maintenance,
  next_maintenance,
  repair_cost,
  status
) on public.machines to authenticated;
grant update (
  name,
  machine_type,
  brand,
  model,
  manufacture_year,
  work_hours,
  fuel_consumption_liters,
  last_maintenance,
  next_maintenance,
  repair_cost,
  status,
  updated_at
) on public.machines to authenticated;
grant delete on table public.machines to authenticated;

revoke all on table public.machine_records from public, anon, authenticated;
grant select on table public.machine_records to authenticated;

create or replace function private.record_inventory_movement_impl(
  p_item_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_occurred_on date,
  p_notes text
)
returns table (
  movement_id uuid,
  new_quantity numeric,
  item_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_farm_id uuid;
  v_current_quantity numeric;
  v_movement_id uuid;
  v_new_quantity numeric;
  v_updated_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'É necessário entrar na conta para movimentar o estoque.'
      using errcode = '42501';
  end if;

  if p_movement_type not in ('entrada', 'saida') then
    raise exception 'Tipo de movimentação inválido.' using errcode = '22023';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'A quantidade deve ser maior que zero.' using errcode = '22023';
  end if;

  if p_occurred_on is null then
    raise exception 'Informe a data da movimentação.' using errcode = '22023';
  end if;

  select item.farm_id, item.quantity
    into v_farm_id, v_current_quantity
  from public.inventory_items item
  where item.id = p_item_id
  for update;

  if v_farm_id is null then
    raise exception 'Item de estoque não encontrado.' using errcode = 'P0002';
  end if;

  if not (select private.is_farm_member(v_farm_id, v_user_id)) then
    raise exception 'Sua conta não pertence a esta fazenda.' using errcode = '42501';
  end if;

  v_new_quantity := v_current_quantity +
    case when p_movement_type = 'entrada' then p_quantity else -p_quantity end;

  if v_new_quantity < 0 then
    raise exception 'A saída não pode ser maior que o saldo disponível.'
      using errcode = '22023';
  end if;

  insert into public.inventory_movements (
    inventory_item_id,
    movement_type,
    quantity,
    occurred_on,
    notes,
    created_by
  )
  values (
    p_item_id,
    p_movement_type,
    p_quantity,
    p_occurred_on,
    nullif(btrim(p_notes), ''),
    v_user_id
  )
  returning id into v_movement_id;

  update public.inventory_items
  set quantity = v_new_quantity,
      updated_at = now()
  where id = p_item_id
  returning updated_at into v_updated_at;

  return query select v_movement_id, v_new_quantity, v_updated_at;
end;
$$;

revoke all on function private.record_inventory_movement_impl(uuid, text, numeric, date, text)
  from public, anon;
grant execute on function private.record_inventory_movement_impl(uuid, text, numeric, date, text)
  to authenticated, service_role;

create or replace function public.record_inventory_movement(
  p_item_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_occurred_on date default current_date,
  p_notes text default null
)
returns table (
  movement_id uuid,
  new_quantity numeric,
  item_updated_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.record_inventory_movement_impl(
    p_item_id,
    p_movement_type,
    p_quantity,
    p_occurred_on,
    p_notes
  );
$$;

revoke all on function public.record_inventory_movement(uuid, text, numeric, date, text)
  from public, anon;
grant execute on function public.record_inventory_movement(uuid, text, numeric, date, text)
  to authenticated, service_role;

create or replace function private.record_machine_activity_impl(
  p_machine_id uuid,
  p_activity_type text,
  p_occurred_on date,
  p_added_hours numeric,
  p_fuel_liters numeric,
  p_cost numeric,
  p_next_maintenance date,
  p_status_after text,
  p_notes text
)
returns table (
  record_id uuid,
  machine_work_hours numeric,
  machine_fuel_liters numeric,
  machine_repair_cost numeric,
  machine_last_maintenance date,
  machine_next_maintenance date,
  machine_status text,
  machine_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_farm_id uuid;
  v_work_hours numeric;
  v_fuel_liters numeric;
  v_repair_cost numeric;
  v_last_maintenance date;
  v_next_maintenance date;
  v_status text;
  v_record_id uuid;
  v_updated_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'É necessário entrar na conta para atualizar a máquina.'
      using errcode = '42501';
  end if;

  if p_activity_type not in ('uso', 'abastecimento', 'manutencao') then
    raise exception 'Tipo de atividade inválido.' using errcode = '22023';
  end if;

  if p_occurred_on is null then
    raise exception 'Informe a data da atividade.' using errcode = '22023';
  end if;

  if coalesce(p_added_hours, 0) < 0
    or coalesce(p_fuel_liters, 0) < 0
    or coalesce(p_cost, 0) < 0 then
    raise exception 'Horas, combustível e custo não podem ser negativos.'
      using errcode = '22023';
  end if;

  if p_status_after not in ('disponivel', 'trabalhando', 'em_manutencao') then
    raise exception 'Situação da máquina inválida.' using errcode = '22023';
  end if;

  if p_activity_type = 'manutencao'
    and p_next_maintenance is not null
    and p_next_maintenance < p_occurred_on then
    raise exception 'A próxima manutenção deve ser posterior ao serviço atual.'
      using errcode = '22023';
  end if;

  select
    machine.farm_id,
    machine.work_hours,
    machine.fuel_consumption_liters,
    machine.repair_cost,
    machine.last_maintenance,
    machine.next_maintenance,
    machine.status
  into
    v_farm_id,
    v_work_hours,
    v_fuel_liters,
    v_repair_cost,
    v_last_maintenance,
    v_next_maintenance,
    v_status
  from public.machines machine
  where machine.id = p_machine_id
  for update;

  if v_farm_id is null then
    raise exception 'Máquina ou equipamento não encontrado.' using errcode = 'P0002';
  end if;

  if not (select private.is_farm_member(v_farm_id, v_user_id)) then
    raise exception 'Sua conta não pertence a esta fazenda.' using errcode = '42501';
  end if;

  v_work_hours := v_work_hours + coalesce(p_added_hours, 0);
  v_fuel_liters := v_fuel_liters + coalesce(p_fuel_liters, 0);
  v_repair_cost := v_repair_cost + coalesce(p_cost, 0);
  v_last_maintenance := case
    when p_activity_type = 'manutencao' then p_occurred_on
    else v_last_maintenance
  end;
  v_next_maintenance := coalesce(p_next_maintenance, v_next_maintenance);
  v_status := p_status_after;

  if v_next_maintenance is not null
    and v_last_maintenance is not null
    and v_next_maintenance < v_last_maintenance then
    raise exception 'A próxima manutenção não pode ser anterior à última manutenção.'
      using errcode = '22023';
  end if;

  insert into public.machine_records (
    machine_id,
    activity_type,
    occurred_on,
    added_hours,
    fuel_liters,
    cost,
    next_maintenance,
    status_after,
    notes,
    created_by
  )
  values (
    p_machine_id,
    p_activity_type,
    p_occurred_on,
    coalesce(p_added_hours, 0),
    coalesce(p_fuel_liters, 0),
    coalesce(p_cost, 0),
    p_next_maintenance,
    p_status_after,
    nullif(btrim(p_notes), ''),
    v_user_id
  )
  returning id into v_record_id;

  update public.machines
  set work_hours = v_work_hours,
      fuel_consumption_liters = v_fuel_liters,
      repair_cost = v_repair_cost,
      last_maintenance = v_last_maintenance,
      next_maintenance = v_next_maintenance,
      status = v_status,
      updated_at = now()
  where id = p_machine_id
  returning updated_at into v_updated_at;

  return query
  select
    v_record_id,
    v_work_hours,
    v_fuel_liters,
    v_repair_cost,
    v_last_maintenance,
    v_next_maintenance,
    v_status,
    v_updated_at;
end;
$$;

revoke all on function private.record_machine_activity_impl(uuid, text, date, numeric, numeric, numeric, date, text, text)
  from public, anon;
grant execute on function private.record_machine_activity_impl(uuid, text, date, numeric, numeric, numeric, date, text, text)
  to authenticated, service_role;

create or replace function public.record_machine_activity(
  p_machine_id uuid,
  p_activity_type text,
  p_occurred_on date,
  p_added_hours numeric default 0,
  p_fuel_liters numeric default 0,
  p_cost numeric default 0,
  p_next_maintenance date default null,
  p_status_after text default 'disponivel',
  p_notes text default null
)
returns table (
  record_id uuid,
  machine_work_hours numeric,
  machine_fuel_liters numeric,
  machine_repair_cost numeric,
  machine_last_maintenance date,
  machine_next_maintenance date,
  machine_status text,
  machine_updated_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.record_machine_activity_impl(
    p_machine_id,
    p_activity_type,
    p_occurred_on,
    p_added_hours,
    p_fuel_liters,
    p_cost,
    p_next_maintenance,
    p_status_after,
    p_notes
  );
$$;

revoke all on function public.record_machine_activity(uuid, text, date, numeric, numeric, numeric, date, text, text)
  from public, anon;
grant execute on function public.record_machine_activity(uuid, text, date, numeric, numeric, numeric, date, text, text)
  to authenticated, service_role;

comment on function public.record_inventory_movement(uuid, text, numeric, date, text) is
  'Registra uma entrada ou saída e atualiza o saldo do item na mesma transação.';

comment on function public.record_machine_activity(uuid, text, date, numeric, numeric, numeric, date, text, text) is
  'Registra uso, abastecimento ou manutenção e atualiza os totais da máquina atomicamente.';
