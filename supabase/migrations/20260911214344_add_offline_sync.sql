grant insert (id) on table public.tasks to authenticated;
grant insert (id) on table public.crops to authenticated;
grant insert (id) on table public.animals to authenticated;
grant insert (id) on table public.inventory_items to authenticated;
grant insert (id) on table public.machines to authenticated;

create table if not exists private.offline_sync_receipts (
  operation_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid not null references public.farms(id) on delete cascade,
  operation_kind text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table private.offline_sync_receipts enable row level security;
revoke all on table private.offline_sync_receipts from public, anon, authenticated;
grant select, insert, delete on table private.offline_sync_receipts to service_role;

create index if not exists offline_sync_receipts_user_farm_created_idx
  on private.offline_sync_receipts (user_id, farm_id, created_at desc);

create or replace function private.apply_offline_action_impl(
  p_operation_id uuid,
  p_farm_id uuid,
  p_action text,
  p_record_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_existing_user_id uuid;
  v_existing_farm_id uuid;
  v_existing_action text;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'É necessário entrar na conta para sincronizar.'
      using errcode = '42501';
  end if;

  if p_operation_id is null or p_farm_id is null or p_record_id is null then
    raise exception 'A operação offline está incompleta.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_operation_id::text, 0)
  );

  select receipt.user_id, receipt.farm_id, receipt.operation_kind, receipt.result
  into v_existing_user_id, v_existing_farm_id, v_existing_action, v_result
  from private.offline_sync_receipts receipt
  where receipt.operation_id = p_operation_id;

  if found then
    if v_existing_user_id <> v_user_id
      or v_existing_farm_id <> p_farm_id
      or v_existing_action <> p_action then
      raise exception 'Esta identificação já pertence a outra operação.'
        using errcode = '42501';
    end if;
    return v_result;
  end if;

  if not (select private.is_farm_member(p_farm_id, v_user_id)) then
    raise exception 'Sua conta não possui acesso ativo a esta fazenda.'
      using errcode = '42501';
  end if;

  case p_action
    when 'task_completion' then
      if not exists (
        select 1 from public.tasks task
        where task.id = p_record_id and task.farm_id = p_farm_id
      ) then
        raise exception 'Tarefa não encontrada nesta fazenda.' using errcode = 'P0002';
      end if;

      select to_jsonb(saved)
      into v_result
      from private.set_task_completion_impl(
        p_record_id,
        coalesce((p_payload ->> 'completed')::boolean, false)
      ) saved;

    when 'inventory_movement' then
      if not exists (
        select 1 from public.inventory_items item
        where item.id = p_record_id and item.farm_id = p_farm_id
      ) then
        raise exception 'Item de estoque não encontrado nesta fazenda.' using errcode = 'P0002';
      end if;

      select to_jsonb(saved)
      into v_result
      from private.record_inventory_movement_impl(
        p_record_id,
        p_payload ->> 'movement_type',
        (p_payload ->> 'quantity')::numeric,
        coalesce((p_payload ->> 'occurred_on')::date, current_date),
        nullif(p_payload ->> 'notes', '')
      ) saved;

    when 'machine_activity' then
      if not exists (
        select 1 from public.machines machine
        where machine.id = p_record_id and machine.farm_id = p_farm_id
      ) then
        raise exception 'Máquina não encontrada nesta fazenda.' using errcode = 'P0002';
      end if;

      select to_jsonb(saved)
      into v_result
      from private.record_machine_activity_impl(
        p_record_id,
        p_payload ->> 'activity_type',
        (p_payload ->> 'occurred_on')::date,
        coalesce((p_payload ->> 'added_hours')::numeric, 0),
        coalesce((p_payload ->> 'fuel_liters')::numeric, 0),
        coalesce((p_payload ->> 'cost')::numeric, 0),
        nullif(p_payload ->> 'next_maintenance', '')::date,
        coalesce(nullif(p_payload ->> 'status_after', ''), 'disponivel'),
        nullif(p_payload ->> 'notes', '')
      ) saved;

    else
      raise exception 'Tipo de operação offline não reconhecido.' using errcode = '22023';
  end case;

  if v_result is null then
    raise exception 'A operação offline não retornou resultado.' using errcode = 'P0002';
  end if;

  insert into private.offline_sync_receipts (
    operation_id,
    user_id,
    farm_id,
    operation_kind,
    result
  ) values (
    p_operation_id,
    v_user_id,
    p_farm_id,
    p_action,
    v_result
  );

  return v_result;
end;
$$;

revoke all on function private.apply_offline_action_impl(uuid, uuid, text, uuid, jsonb)
  from public, anon;
grant execute on function private.apply_offline_action_impl(uuid, uuid, text, uuid, jsonb)
  to authenticated, service_role;

create or replace function public.apply_offline_action(
  p_operation_id uuid,
  p_farm_id uuid,
  p_action text,
  p_record_id uuid,
  p_payload jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.apply_offline_action_impl(
    p_operation_id,
    p_farm_id,
    p_action,
    p_record_id,
    p_payload
  );
$$;

revoke all on function public.apply_offline_action(uuid, uuid, text, uuid, jsonb)
  from public, anon;
grant execute on function public.apply_offline_action(uuid, uuid, text, uuid, jsonb)
  to authenticated, service_role;

comment on function public.apply_offline_action(uuid, uuid, text, uuid, jsonb) is
  'Reproduz ações de campo com chave idempotente após o aparelho recuperar a conexão.';

comment on table private.offline_sync_receipts is
  'Impede que tarefas, movimentações e atividades offline sejam aplicadas mais de uma vez.';
