alter table public.tasks
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete restrict;

alter table public.tasks
  alter column created_by set default auth.uid();

update public.tasks task
set created_by = farm.owner_id
from public.farms farm
where farm.id = task.farm_id
  and task.created_by is null;

alter table public.tasks
  alter column created_by set not null;

create index if not exists tasks_farm_assigned_pending_idx
  on public.tasks (farm_id, assigned_to, due_date)
  where completed = false;

alter table public.tasks enable row level security;

drop policy if exists tasks_select_member on public.tasks;
drop policy if exists tasks_insert_owner on public.tasks;
drop policy if exists tasks_update_owner on public.tasks;
drop policy if exists tasks_delete_owner on public.tasks;

create policy tasks_select_member
on public.tasks
for select
to authenticated
using (
  private.is_farm_member(farm_id, (select auth.uid()))
);

create policy tasks_insert_owner
on public.tasks
for insert
to authenticated
with check (
  private.is_farm_owner(farm_id, (select auth.uid()))
  and created_by = (select auth.uid())
  and (
    assigned_to is null
    or private.is_farm_member(farm_id, assigned_to)
  )
);

create policy tasks_update_owner
on public.tasks
for update
to authenticated
using (
  private.is_farm_owner(farm_id, (select auth.uid()))
)
with check (
  private.is_farm_owner(farm_id, (select auth.uid()))
  and (
    assigned_to is null
    or private.is_farm_member(farm_id, assigned_to)
  )
);

create policy tasks_delete_owner
on public.tasks
for delete
to authenticated
using (
  private.is_farm_owner(farm_id, (select auth.uid()))
);

revoke all on table public.tasks from anon, authenticated;
grant select on table public.tasks to authenticated;
grant insert (
  farm_id,
  title,
  due_date,
  category,
  priority,
  responsible_name,
  assigned_to,
  completed,
  completed_at,
  notes,
  created_by
) on public.tasks to authenticated;
grant update (
  title,
  due_date,
  category,
  priority,
  responsible_name,
  assigned_to,
  completed,
  completed_at,
  notes,
  updated_at
) on public.tasks to authenticated;
grant delete on table public.tasks to authenticated;

create or replace function private.set_task_completion_impl(
  p_task_id uuid,
  p_completed boolean
)
returns table (
  task_id uuid,
  task_completed boolean,
  task_completed_at timestamptz,
  task_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  task_farm_id uuid;
  task_assigned_to uuid;
begin
  if current_user_id is null then
    raise exception 'É necessário entrar na conta.';
  end if;

  select task.farm_id, task.assigned_to
  into task_farm_id, task_assigned_to
  from public.tasks task
  where task.id = p_task_id;

  if task_farm_id is null then
    raise exception 'Tarefa não encontrada.';
  end if;

  if not private.is_farm_member(task_farm_id, current_user_id) then
    raise exception 'Você não possui acesso a esta tarefa.';
  end if;

  if task_assigned_to is not null
    and task_assigned_to <> current_user_id
    and not private.is_farm_owner(task_farm_id, current_user_id) then
    raise exception 'Somente o responsável ou o dono pode concluir esta tarefa.';
  end if;

  return query
  update public.tasks task
  set completed = p_completed,
      completed_at = case when p_completed then now() else null end,
      updated_at = now()
  where task.id = p_task_id
  returning task.id, task.completed, task.completed_at, task.updated_at;
end;
$$;

create or replace function public.set_task_completion(
  p_task_id uuid,
  p_completed boolean
)
returns table (
  task_id uuid,
  task_completed boolean,
  task_completed_at timestamptz,
  task_updated_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.set_task_completion_impl(p_task_id, p_completed);
$$;

revoke all on function private.set_task_completion_impl(uuid, boolean) from public, anon;
grant execute on function private.set_task_completion_impl(uuid, boolean) to authenticated, service_role;

revoke all on function public.set_task_completion(uuid, boolean) from public, anon;
grant execute on function public.set_task_completion(uuid, boolean) to authenticated, service_role;

comment on function public.set_task_completion(uuid, boolean) is
  'Allows the owner or the assigned active member to complete or reopen a task.';
