-- Histórico unificado das ações realizadas dentro de cada propriedade.
-- O aplicativo pode apenas consultar estes registros; a escrita acontece
-- exclusivamente por gatilhos protegidos no banco de dados.

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text not null default 'Sistema'
    check (char_length(btrim(actor_name)) between 1 and 100),
  actor_role text
    check (actor_role is null or actor_role = any (array['owner', 'vaqueiro', 'caseiro']::text[])),
  module text not null
    check (module = any (array[
      'propriedade',
      'financeiro',
      'agenda',
      'animais',
      'saude_animal',
      'plantacoes',
      'estoque',
      'maquinas',
      'equipe'
    ]::text[])),
  action text not null
    check (action = any (array['create', 'update', 'delete']::text[])),
  record_id text,
  record_label text not null default 'Registro'
    check (char_length(btrim(record_label)) between 1 and 140),
  changed_fields text[] not null default array[]::text[],
  occurred_at timestamptz not null default timezone('utc', now())
);

comment on table public.activity_log is
  'Histórico imutável e isolado por fazenda das alterações nos módulos do sistema.';

create index if not exists activity_log_farm_id_id_idx
  on public.activity_log (farm_id, id desc);

create index if not exists activity_log_actor_user_id_idx
  on public.activity_log (actor_user_id)
  where actor_user_id is not null;

alter table public.activity_log enable row level security;

drop policy if exists activity_log_select_owner on public.activity_log;

create policy activity_log_select_owner
on public.activity_log
for select
to authenticated
using (
  (select private.is_farm_owner(farm_id, (select auth.uid())))
);

revoke all privileges on table public.activity_log from public, anon, authenticated;
grant select on table public.activity_log to authenticated;

revoke all privileges on sequence public.activity_log_id_seq from public, anon, authenticated;

create or replace function private.capture_activity_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row_data jsonb;
  v_old_data jsonb;
  v_new_data jsonb;
  v_farm_id uuid;
  v_actor_user_id uuid;
  v_actor_name text;
  v_actor_role text;
  v_module text := tg_argv[0];
  v_action text;
  v_record_id text;
  v_record_label text;
  v_parent_label text;
  v_changed_fields text[] := array[]::text[];
begin
  if tg_op = 'DELETE' then
    v_row_data := to_jsonb(old);
    v_old_data := v_row_data;
    v_action := 'delete';
  elsif tg_op = 'UPDATE' then
    v_old_data := to_jsonb(old);
    v_new_data := to_jsonb(new);
    v_row_data := v_new_data;
    v_action := 'update';
  else
    v_row_data := to_jsonb(new);
    v_new_data := v_row_data;
    v_action := 'create';
  end if;

  if tg_table_name = 'farms' then
    v_farm_id := (v_row_data ->> 'id')::uuid;
  elsif v_row_data ? 'farm_id' then
    v_farm_id := (v_row_data ->> 'farm_id')::uuid;
  elsif tg_table_name = 'animal_health_records' then
    select animal.farm_id, animal.identifier
      into v_farm_id, v_parent_label
      from public.animals animal
     where animal.id = (v_row_data ->> 'animal_id')::uuid;
  elsif tg_table_name = 'inventory_movements' then
    select item.farm_id, item.name
      into v_farm_id, v_parent_label
      from public.inventory_items item
     where item.id = (v_row_data ->> 'inventory_item_id')::uuid;
  elsif tg_table_name = 'machine_records' then
    select machine.farm_id, machine.name
      into v_farm_id, v_parent_label
      from public.machines machine
     where machine.id = (v_row_data ->> 'machine_id')::uuid;
  end if;

  -- Uma exclusão em cascata pode remover o registro pai antes do filho.
  -- Nesse cenário o evento principal já está registrado e o filho é ignorado.
  if v_farm_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
      into v_changed_fields
      from jsonb_each(v_new_data) entry
     where (v_old_data -> entry.key) is distinct from entry.value
       and entry.key <> all (array[
         'id',
         'farm_id',
         'animal_id',
         'inventory_item_id',
         'machine_id',
         'created_at',
         'updated_at',
         'created_by',
         'completed_at',
         'invited_by',
         'used_by'
       ]::text[]);

    if cardinality(v_changed_fields) = 0 then
      return new;
    end if;
  end if;

  v_record_id := coalesce(
    v_row_data ->> 'id',
    v_row_data ->> 'user_id',
    v_row_data ->> 'farm_id'
  );

  if tg_table_name = 'farm_members' then
    select profile.full_name
      into v_record_label
      from public.profiles profile
     where profile.user_id = (v_row_data ->> 'user_id')::uuid;
  elsif tg_table_name = 'farm_invites' then
    v_record_label := concat(
      'Convite de ',
      case v_row_data ->> 'role'
        when 'vaqueiro' then 'vaqueiro'
        when 'caseiro' then 'caseiro'
        else 'funcionário'
      end
    );
  elsif tg_table_name = 'animal_health_records' then
    v_record_label := concat(
      coalesce(nullif(btrim(v_parent_label), ''), 'Animal'),
      ': ',
      coalesce(nullif(btrim(v_row_data ->> 'description'), ''), 'registro de saúde')
    );
  elsif tg_table_name = 'inventory_movements' then
    v_record_label := concat(
      case v_row_data ->> 'movement_type'
        when 'entrada' then 'Entrada de '
        when 'saida' then 'Saída de '
        else 'Movimentação de '
      end,
      coalesce(nullif(btrim(v_parent_label), ''), 'item do estoque')
    );
  elsif tg_table_name = 'machine_records' then
    v_record_label := concat(
      case v_row_data ->> 'activity_type'
        when 'uso' then 'Uso de '
        when 'abastecimento' then 'Abastecimento de '
        when 'manutencao' then 'Manutenção de '
        else 'Atividade de '
      end,
      coalesce(nullif(btrim(v_parent_label), ''), 'equipamento')
    );
  else
    v_record_label := coalesce(
      nullif(btrim(v_row_data ->> 'name'), ''),
      nullif(btrim(v_row_data ->> 'title'), ''),
      nullif(btrim(v_row_data ->> 'identifier'), ''),
      nullif(btrim(v_row_data ->> 'description'), ''),
      'Registro'
    );
  end if;

  v_actor_user_id := (select auth.uid());

  if v_actor_user_id is not null then
    select profile.full_name
      into v_actor_name
      from public.profiles profile
     where profile.user_id = v_actor_user_id;

    select member.role
      into v_actor_role
      from public.farm_members member
     where member.farm_id = v_farm_id
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
  )
  values (
    v_farm_id,
    v_actor_user_id,
    coalesce(nullif(btrim(v_actor_name), ''), 'Sistema'),
    v_actor_role,
    v_module,
    v_action,
    v_record_id,
    left(coalesce(nullif(btrim(v_record_label), ''), 'Registro'), 140),
    v_changed_fields
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.capture_activity_log() from public, anon, authenticated;

drop trigger if exists audit_farms_activity on public.farms;
create trigger audit_farms_activity
after insert or update or delete on public.farms
for each row execute function private.capture_activity_log('propriedade');

drop trigger if exists audit_transactions_activity on public.transactions;
create trigger audit_transactions_activity
after insert or update or delete on public.transactions
for each row execute function private.capture_activity_log('financeiro');

drop trigger if exists audit_tasks_activity on public.tasks;
create trigger audit_tasks_activity
after insert or update or delete on public.tasks
for each row execute function private.capture_activity_log('agenda');

drop trigger if exists audit_animals_activity on public.animals;
create trigger audit_animals_activity
after insert or update or delete on public.animals
for each row execute function private.capture_activity_log('animais');

drop trigger if exists audit_animal_health_activity on public.animal_health_records;
create trigger audit_animal_health_activity
after insert or update or delete on public.animal_health_records
for each row execute function private.capture_activity_log('saude_animal');

drop trigger if exists audit_crops_activity on public.crops;
create trigger audit_crops_activity
after insert or update or delete on public.crops
for each row execute function private.capture_activity_log('plantacoes');

drop trigger if exists audit_inventory_items_activity on public.inventory_items;
create trigger audit_inventory_items_activity
after insert or update or delete on public.inventory_items
for each row execute function private.capture_activity_log('estoque');

drop trigger if exists audit_inventory_movements_activity on public.inventory_movements;
create trigger audit_inventory_movements_activity
after insert or update or delete on public.inventory_movements
for each row execute function private.capture_activity_log('estoque');

drop trigger if exists audit_machines_activity on public.machines;
create trigger audit_machines_activity
after insert or update or delete on public.machines
for each row execute function private.capture_activity_log('maquinas');

drop trigger if exists audit_machine_records_activity on public.machine_records;
create trigger audit_machine_records_activity
after insert or update or delete on public.machine_records
for each row execute function private.capture_activity_log('maquinas');

drop trigger if exists audit_farm_members_activity on public.farm_members;
create trigger audit_farm_members_activity
after insert or update or delete on public.farm_members
for each row execute function private.capture_activity_log('equipe');

drop trigger if exists audit_farm_invites_activity on public.farm_invites;
create trigger audit_farm_invites_activity
after insert or update or delete on public.farm_invites
for each row execute function private.capture_activity_log('equipe');
