begin;

-- Keep the farm stored on an update tied to the same farm as its work order.
-- The composite constraint is a second line of defense beyond RLS.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_id_farm_id_unique'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_id_farm_id_unique unique (id, farm_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'task_updates_task_farm_fkey'
      and conrelid = 'public.task_updates'::regclass
  ) then
    alter table public.task_updates
      add constraint task_updates_task_farm_fkey
      foreign key (task_id, farm_id)
      references public.tasks (id, farm_id)
      on delete cascade;
  end if;
end
$$;

drop policy if exists task_updates_insert_participant on public.task_updates;

create policy task_updates_insert_participant
on public.task_updates
for insert
to authenticated
with check (
  task_updates.author_id = (select auth.uid())
  and private.is_farm_member(task_updates.farm_id, (select auth.uid()))
  and exists (
    select 1
    from public.tasks as linked_task
    where linked_task.id = task_updates.task_id
      and linked_task.farm_id = task_updates.farm_id
      and (
        private.is_farm_owner(linked_task.farm_id, (select auth.uid()))
        or linked_task.assigned_to is null
        or linked_task.assigned_to = (select auth.uid())
      )
  )
);

commit;
