alter table public.animal_health_records
  add column if not exists created_by uuid
  default auth.uid()
  references auth.users(id) on delete set null;

alter table public.animal_health_records
  add column if not exists updated_at timestamptz not null default now();

create index if not exists animal_health_records_created_by_idx
  on public.animal_health_records (created_by);

alter table public.animal_health_records enable row level security;

drop policy if exists animal_health_records_select_member
  on public.animal_health_records;
drop policy if exists animal_health_records_insert_keeper
  on public.animal_health_records;
drop policy if exists animal_health_records_update_keeper
  on public.animal_health_records;
drop policy if exists animal_health_records_delete_owner
  on public.animal_health_records;

create policy animal_health_records_select_member
on public.animal_health_records
for select
to authenticated
using (
  exists (
    select 1
    from public.animals animal
    where animal.id = animal_id
      and (select private.is_farm_member(
        animal.farm_id,
        (select auth.uid())
      ))
  )
);

create policy animal_health_records_insert_keeper
on public.animal_health_records
for insert
to authenticated
with check (
  exists (
    select 1
    from public.animals animal
    where animal.id = animal_id
      and (select private.has_farm_role(
        animal.farm_id,
        (select auth.uid()),
        array['owner', 'vaqueiro']::text[]
      ))
  )
);

create policy animal_health_records_update_keeper
on public.animal_health_records
for update
to authenticated
using (
  exists (
    select 1
    from public.animals animal
    where animal.id = animal_id
      and (select private.has_farm_role(
        animal.farm_id,
        (select auth.uid()),
        array['owner', 'vaqueiro']::text[]
      ))
  )
)
with check (
  exists (
    select 1
    from public.animals animal
    where animal.id = animal_id
      and (select private.has_farm_role(
        animal.farm_id,
        (select auth.uid()),
        array['owner', 'vaqueiro']::text[]
      ))
  )
);

create policy animal_health_records_delete_owner
on public.animal_health_records
for delete
to authenticated
using (
  exists (
    select 1
    from public.animals animal
    where animal.id = animal_id
      and (select private.is_farm_owner(
        animal.farm_id,
        (select auth.uid())
      ))
  )
);

revoke all on table public.animal_health_records
  from public, anon, authenticated;
grant select on table public.animal_health_records to authenticated;

create or replace function private.sync_animal_health_snapshot(
  p_animal_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_weight numeric;
  v_vaccine_description text;
  v_next_vaccination date;
  v_health_description text;
begin
  select record.weight_kg
  into v_weight
  from public.animal_health_records record
  where record.animal_id = p_animal_id
    and record.record_type = 'peso'
    and record.weight_kg is not null
  order by record.occurred_on desc, record.updated_at desc, record.created_at desc
  limit 1;

  if found then
    update public.animals
    set weight_kg = v_weight,
        updated_at = now()
    where id = p_animal_id;
  end if;

  select record.description, record.next_due_date
  into v_vaccine_description, v_next_vaccination
  from public.animal_health_records record
  where record.animal_id = p_animal_id
    and record.record_type = 'vacina'
  order by record.occurred_on desc, record.updated_at desc, record.created_at desc
  limit 1;

  if found then
    update public.animals
    set applied_vaccines = v_vaccine_description,
        next_vaccination = v_next_vaccination,
        updated_at = now()
    where id = p_animal_id;
  end if;

  select record.description
  into v_health_description
  from public.animal_health_records record
  where record.animal_id = p_animal_id
    and record.record_type in ('saude', 'medicamento')
  order by record.occurred_on desc, record.updated_at desc, record.created_at desc
  limit 1;

  if found then
    update public.animals
    set health_notes = v_health_description,
        updated_at = now()
    where id = p_animal_id;
  end if;
end;
$$;

revoke all on function private.sync_animal_health_snapshot(uuid)
  from public, anon, authenticated;

create or replace function private.save_animal_health_record_impl(
  p_record_id uuid,
  p_animal_id uuid,
  p_record_type text,
  p_occurred_on date,
  p_description text,
  p_weight_kg numeric,
  p_next_due_date date
)
returns table (
  record_id uuid,
  record_animal_id uuid,
  saved_record_type text,
  saved_occurred_on date,
  saved_description text,
  saved_weight_kg numeric,
  saved_next_due_date date,
  saved_created_at timestamptz,
  saved_updated_at timestamptz,
  animal_weight_kg numeric,
  animal_next_vaccination date,
  animal_applied_vaccines text,
  animal_health_notes text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_farm_id uuid;
  v_record public.animal_health_records%rowtype;
  v_animal public.animals%rowtype;
begin
  if v_user_id is null then
    raise exception 'É necessário entrar na conta para alterar o histórico.'
      using errcode = '42501';
  end if;

  if p_record_type not in ('vacina', 'saude', 'peso', 'medicamento') then
    raise exception 'Tipo de registro inválido.' using errcode = '22023';
  end if;

  if p_occurred_on is null then
    raise exception 'Informe a data do registro.' using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_description, ''))) not between 2 and 500 then
    raise exception 'A descrição deve ter entre 2 e 500 caracteres.'
      using errcode = '22023';
  end if;

  if p_weight_kg is not null and p_weight_kg <= 0 then
    raise exception 'O peso deve ser maior que zero.' using errcode = '22023';
  end if;

  if p_record_type = 'peso' and p_weight_kg is null then
    raise exception 'Informe o peso para uma pesagem.' using errcode = '22023';
  end if;

  if p_record_type = 'vacina' and p_next_due_date is null then
    raise exception 'Informe a próxima vacinação.' using errcode = '22023';
  end if;

  if p_next_due_date is not null and p_next_due_date < p_occurred_on then
    raise exception 'A próxima data deve ser posterior ao registro.'
      using errcode = '22023';
  end if;

  select animal.farm_id
  into v_farm_id
  from public.animals animal
  where animal.id = p_animal_id
    and animal.active = true
  for update;

  if v_farm_id is null then
    raise exception 'Animal não encontrado.' using errcode = 'P0002';
  end if;

  if not (select private.has_farm_role(
    v_farm_id,
    v_user_id,
    array['owner', 'vaqueiro']::text[]
  )) then
    raise exception 'Seu cargo não permite alterar o histórico do animal.'
      using errcode = '42501';
  end if;

  if p_record_id is null then
    insert into public.animal_health_records (
      animal_id,
      record_type,
      occurred_on,
      description,
      weight_kg,
      next_due_date,
      created_by
    )
    values (
      p_animal_id,
      p_record_type,
      p_occurred_on,
      btrim(p_description),
      p_weight_kg,
      p_next_due_date,
      v_user_id
    )
    returning * into v_record;
  else
    update public.animal_health_records
    set record_type = p_record_type,
        occurred_on = p_occurred_on,
        description = btrim(p_description),
        weight_kg = p_weight_kg,
        next_due_date = p_next_due_date,
        updated_at = now()
    where id = p_record_id
      and animal_id = p_animal_id
    returning * into v_record;

    if v_record.id is null then
      raise exception 'Registro de saúde não encontrado.' using errcode = 'P0002';
    end if;
  end if;

  perform private.sync_animal_health_snapshot(p_animal_id);

  select animal.*
  into v_animal
  from public.animals animal
  where animal.id = p_animal_id;

  return query
  select
    v_record.id,
    v_record.animal_id,
    v_record.record_type,
    v_record.occurred_on,
    v_record.description,
    v_record.weight_kg,
    v_record.next_due_date,
    v_record.created_at,
    v_record.updated_at,
    v_animal.weight_kg,
    v_animal.next_vaccination,
    v_animal.applied_vaccines,
    v_animal.health_notes;
end;
$$;

revoke all on function private.save_animal_health_record_impl(
  uuid, uuid, text, date, text, numeric, date
) from public, anon;
grant execute on function private.save_animal_health_record_impl(
  uuid, uuid, text, date, text, numeric, date
) to authenticated, service_role;

create or replace function public.save_animal_health_record(
  p_record_id uuid,
  p_animal_id uuid,
  p_record_type text,
  p_occurred_on date,
  p_description text,
  p_weight_kg numeric default null,
  p_next_due_date date default null
)
returns table (
  record_id uuid,
  record_animal_id uuid,
  saved_record_type text,
  saved_occurred_on date,
  saved_description text,
  saved_weight_kg numeric,
  saved_next_due_date date,
  saved_created_at timestamptz,
  saved_updated_at timestamptz,
  animal_weight_kg numeric,
  animal_next_vaccination date,
  animal_applied_vaccines text,
  animal_health_notes text
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.save_animal_health_record_impl(
    p_record_id,
    p_animal_id,
    p_record_type,
    p_occurred_on,
    p_description,
    p_weight_kg,
    p_next_due_date
  );
$$;

revoke all on function public.save_animal_health_record(
  uuid, uuid, text, date, text, numeric, date
) from public, anon;
grant execute on function public.save_animal_health_record(
  uuid, uuid, text, date, text, numeric, date
) to authenticated, service_role;

create or replace function private.delete_animal_health_record_impl(
  p_record_id uuid
)
returns table (
  deleted_record_id uuid,
  record_animal_id uuid,
  animal_weight_kg numeric,
  animal_next_vaccination date,
  animal_applied_vaccines text,
  animal_health_notes text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_animal_id uuid;
  v_farm_id uuid;
  v_animal public.animals%rowtype;
begin
  if v_user_id is null then
    raise exception 'É necessário entrar na conta para excluir o registro.'
      using errcode = '42501';
  end if;

  select record.animal_id, animal.farm_id
  into v_animal_id, v_farm_id
  from public.animal_health_records record
  join public.animals animal on animal.id = record.animal_id
  where record.id = p_record_id
  for update of animal;

  if v_animal_id is null then
    raise exception 'Registro de saúde não encontrado.' using errcode = 'P0002';
  end if;

  if not (select private.is_farm_owner(v_farm_id, v_user_id)) then
    raise exception 'Somente o dono pode excluir o histórico do animal.'
      using errcode = '42501';
  end if;

  delete from public.animal_health_records
  where id = p_record_id;

  perform private.sync_animal_health_snapshot(v_animal_id);

  select animal.*
  into v_animal
  from public.animals animal
  where animal.id = v_animal_id;

  return query
  select
    p_record_id,
    v_animal_id,
    v_animal.weight_kg,
    v_animal.next_vaccination,
    v_animal.applied_vaccines,
    v_animal.health_notes;
end;
$$;

revoke all on function private.delete_animal_health_record_impl(uuid)
  from public, anon;
grant execute on function private.delete_animal_health_record_impl(uuid)
  to authenticated, service_role;

create or replace function public.delete_animal_health_record(
  p_record_id uuid
)
returns table (
  deleted_record_id uuid,
  record_animal_id uuid,
  animal_weight_kg numeric,
  animal_next_vaccination date,
  animal_applied_vaccines text,
  animal_health_notes text
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.delete_animal_health_record_impl(p_record_id);
$$;

revoke all on function public.delete_animal_health_record(uuid)
  from public, anon;
grant execute on function public.delete_animal_health_record(uuid)
  to authenticated, service_role;

comment on table public.animal_health_records is
  'Prontuário cronológico de vacinas, saúde, peso e medicamentos dos animais.';

comment on function public.save_animal_health_record(
  uuid, uuid, text, date, text, numeric, date
) is 'Cria ou edita um registro e sincroniza peso, vacinação e saúde do animal.';

comment on function public.delete_animal_health_record(uuid) is
  'Exclui um registro como dono e recalcula o resumo atual do animal.';
