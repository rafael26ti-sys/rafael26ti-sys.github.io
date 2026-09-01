create index if not exists inventory_movements_created_by_idx
  on public.inventory_movements (created_by);

create index if not exists machine_records_created_by_idx
  on public.machine_records (created_by);
