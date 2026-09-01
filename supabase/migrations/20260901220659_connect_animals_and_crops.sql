create or replace function private.has_farm_role(
  p_farm_id uuid,
  p_user_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id is not null
    and p_user_id = (select auth.uid())
    and exists (
      select 1
      from public.farm_members fm
      where fm.farm_id = p_farm_id
        and fm.user_id = p_user_id
        and fm.status = 'active'
        and fm.role = any (p_roles)
    );
$$;

comment on function private.has_farm_role(uuid, uuid, text[]) is
  'Checks the authenticated user active role in a farm for RLS policies.';

revoke all on function private.has_farm_role(uuid, uuid, text[]) from public, anon;
grant execute on function private.has_farm_role(uuid, uuid, text[]) to authenticated, service_role;

alter table public.animals enable row level security;

drop policy if exists animals_select_member on public.animals;
drop policy if exists animals_insert_keeper on public.animals;
drop policy if exists animals_update_keeper on public.animals;
drop policy if exists animals_delete_owner on public.animals;

create policy animals_select_member
on public.animals
for select
to authenticated
using (
  (select private.is_farm_member(farm_id, (select auth.uid())))
);

create policy animals_insert_keeper
on public.animals
for insert
to authenticated
with check (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'vaqueiro']::text[]
  ))
);

create policy animals_update_keeper
on public.animals
for update
to authenticated
using (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'vaqueiro']::text[]
  ))
)
with check (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'vaqueiro']::text[]
  ))
);

create policy animals_delete_owner
on public.animals
for delete
to authenticated
using (
  (select private.is_farm_owner(farm_id, (select auth.uid())))
);

revoke all on table public.animals from anon, authenticated;
grant select on table public.animals to authenticated;
grant insert (
  farm_id,
  identifier,
  species,
  breed,
  birth_date,
  weight_kg,
  applied_vaccines,
  next_vaccination,
  health_notes,
  active
) on public.animals to authenticated;
grant update (
  identifier,
  species,
  breed,
  birth_date,
  weight_kg,
  applied_vaccines,
  next_vaccination,
  health_notes,
  active,
  updated_at
) on public.animals to authenticated;
grant delete on table public.animals to authenticated;

alter table public.crops enable row level security;

drop policy if exists crops_select_member on public.crops;
drop policy if exists crops_insert_keeper on public.crops;
drop policy if exists crops_update_keeper on public.crops;
drop policy if exists crops_delete_owner on public.crops;

create policy crops_select_member
on public.crops
for select
to authenticated
using (
  (select private.is_farm_member(farm_id, (select auth.uid())))
);

create policy crops_insert_keeper
on public.crops
for insert
to authenticated
with check (
  (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'caseiro']::text[]
  ))
);

create policy crops_update_keeper
on public.crops
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

create policy crops_delete_owner
on public.crops
for delete
to authenticated
using (
  (select private.is_farm_owner(farm_id, (select auth.uid())))
);

revoke all on table public.crops from anon, authenticated;
grant select on table public.crops to authenticated;
grant insert (
  farm_id,
  name,
  area_hectares,
  planting_date,
  planned_harvest_date,
  harvested_on,
  harvested_quantity,
  harvested_unit,
  production_cost,
  status,
  notes
) on public.crops to authenticated;
grant update (
  name,
  area_hectares,
  planting_date,
  planned_harvest_date,
  harvested_on,
  harvested_quantity,
  harvested_unit,
  production_cost,
  status,
  notes,
  updated_at
) on public.crops to authenticated;
grant delete on table public.crops to authenticated;
