begin;

-- Daily milk production belongs to both a farm and one animal from that farm.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'animals_id_farm_id_unique'
      and conrelid = 'public.animals'::regclass
  ) then
    alter table public.animals
      add constraint animals_id_farm_id_unique unique (id, farm_id);
  end if;
end
$$;

create table if not exists public.milk_production_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null,
  production_date date not null default current_date,
  shift text not null
    check (shift = any (array['manha', 'tarde', 'noite']::text[])),
  liters numeric(10, 2) not null
    check (liters > 0 and liters <= 1000),
  discarded_liters numeric(10, 2) not null default 0
    check (discarded_liters >= 0 and discarded_liters <= liters),
  notes text
    check (notes is null or char_length(notes) <= 500),
  created_by uuid not null default auth.uid()
    references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milk_production_records_animal_farm_fkey
    foreign key (animal_id, farm_id)
    references public.animals(id, farm_id)
    on delete cascade
);

comment on table public.milk_production_records is
  'Produção diária de leite por vaca, turno e propriedade.';

create index if not exists milk_production_farm_date_idx
  on public.milk_production_records (farm_id, production_date desc);

create index if not exists milk_production_animal_date_idx
  on public.milk_production_records (animal_id, production_date desc);

create or replace function private.touch_milk_production_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_milk_production_updated_at()
  from public, anon, authenticated;

drop trigger if exists touch_milk_production_updated_at
  on public.milk_production_records;
create trigger touch_milk_production_updated_at
before update on public.milk_production_records
for each row execute function private.touch_milk_production_updated_at();

alter table public.milk_production_records enable row level security;

drop policy if exists milk_production_select_member
  on public.milk_production_records;
drop policy if exists milk_production_insert_member
  on public.milk_production_records;
drop policy if exists milk_production_update_author_or_owner
  on public.milk_production_records;
drop policy if exists milk_production_delete_owner
  on public.milk_production_records;

create policy milk_production_select_member
on public.milk_production_records
for select
to authenticated
using (
  (select private.is_farm_member(farm_id, (select auth.uid())))
);

create policy milk_production_insert_member
on public.milk_production_records
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_farm_role(
    farm_id,
    (select auth.uid()),
    array['owner', 'vaqueiro', 'caseiro']::text[]
  ))
  and exists (
    select 1
    from public.animals animal
    where animal.id = milk_production_records.animal_id
      and animal.farm_id = milk_production_records.farm_id
      and animal.active
  )
);

create policy milk_production_update_author_or_owner
on public.milk_production_records
for update
to authenticated
using (
  (select private.is_farm_owner(farm_id, (select auth.uid())))
  or (
    created_by = (select auth.uid())
    and (select private.has_farm_role(
      farm_id,
      (select auth.uid()),
      array['owner', 'vaqueiro', 'caseiro']::text[]
    ))
  )
)
with check (
  (
    (select private.is_farm_owner(farm_id, (select auth.uid())))
    or (
      created_by = (select auth.uid())
      and (select private.has_farm_role(
        farm_id,
        (select auth.uid()),
        array['owner', 'vaqueiro', 'caseiro']::text[]
      ))
    )
  )
  and exists (
    select 1
    from public.animals animal
    where animal.id = milk_production_records.animal_id
      and animal.farm_id = milk_production_records.farm_id
      and animal.active
  )
);

create policy milk_production_delete_owner
on public.milk_production_records
for delete
to authenticated
using (
  (select private.is_farm_owner(farm_id, (select auth.uid())))
);

revoke all on table public.milk_production_records
  from public, anon, authenticated;
grant select on table public.milk_production_records to authenticated;
grant insert (
  id,
  farm_id,
  animal_id,
  production_date,
  shift,
  liters,
  discarded_liters,
  notes
) on public.milk_production_records to authenticated;
grant update (
  animal_id,
  production_date,
  shift,
  liters,
  discarded_liters,
  notes,
  updated_at
) on public.milk_production_records to authenticated;
grant delete on table public.milk_production_records to authenticated;

-- Include milk records in the owner's immutable property history.
alter table public.activity_log
  drop constraint if exists activity_log_module_check;
alter table public.activity_log
  add constraint activity_log_module_check
  check (module = any (array[
    'propriedade',
    'financeiro',
    'agenda',
    'animais',
    'saude_animal',
    'producao_leite',
    'plantacoes',
    'estoque',
    'maquinas',
    'equipe'
  ]::text[]));

create or replace function private.capture_milk_production_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.milk_production_records%rowtype;
  v_action text;
  v_actor_user_id uuid := (select auth.uid());
  v_actor_name text;
  v_actor_role text;
  v_animal_label text;
  v_changed_fields text[] := array[]::text[];
begin
  if tg_op = 'DELETE' then
    v_row := old;
    v_action := 'delete';
  elsif tg_op = 'UPDATE' then
    v_row := new;
    v_action := 'update';

    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
      into v_changed_fields
      from jsonb_each(to_jsonb(new)) entry
     where (to_jsonb(old) -> entry.key) is distinct from entry.value
       and entry.key <> all (array[
         'id', 'farm_id', 'created_by', 'created_at', 'updated_at'
       ]::text[]);

    if cardinality(v_changed_fields) = 0 then
      return new;
    end if;
  else
    v_row := new;
    v_action := 'create';
  end if;

  select animal.identifier
    into v_animal_label
    from public.animals animal
   where animal.id = v_row.animal_id
     and animal.farm_id = v_row.farm_id;

  if v_actor_user_id is not null then
    select profile.full_name
      into v_actor_name
      from public.profiles profile
     where profile.user_id = v_actor_user_id;

    select member.role
      into v_actor_role
      from public.farm_members member
     where member.farm_id = v_row.farm_id
       and member.user_id = v_actor_user_id
     limit 1;
  end if;

  insert into public.activity_log (
    farm_id,
    actor_user_id,
    actor_name,
    actor_role,
    module,
    action,
    record_id,
    record_label,
    changed_fields
  ) values (
    v_row.farm_id,
    v_actor_user_id,
    coalesce(nullif(btrim(v_actor_name), ''), 'Sistema'),
    v_actor_role,
    'producao_leite',
    v_action,
    v_row.id::text,
    left(concat(
      'Produção de ',
      coalesce(nullif(btrim(v_animal_label), ''), 'vaca'),
      ': ',
      v_row.liters,
      ' L'
    ), 140),
    v_changed_fields
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.capture_milk_production_activity()
  from public, anon, authenticated;

drop trigger if exists audit_milk_production_activity
  on public.milk_production_records;
create trigger audit_milk_production_activity
after insert or update or delete on public.milk_production_records
for each row execute function private.capture_milk_production_activity();

commit;
