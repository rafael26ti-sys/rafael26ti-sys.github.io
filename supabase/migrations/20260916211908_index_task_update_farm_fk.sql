-- Index the child-side columns used by the composite foreign key.
-- The database migration 20260916211908 is already applied in production.
create index if not exists task_updates_task_farm_idx
  on public.task_updates (task_id, farm_id);
