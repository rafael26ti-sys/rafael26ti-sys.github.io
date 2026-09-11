create index if not exists offline_sync_receipts_farm_id_idx
  on private.offline_sync_receipts (farm_id);

create policy offline_sync_receipts_service_role
on private.offline_sync_receipts
for all
to service_role
using (true)
with check (true);
