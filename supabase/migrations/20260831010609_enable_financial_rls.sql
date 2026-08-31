revoke all on table public.transactions from anon;
grant select, insert, update, delete on table public.transactions to authenticated;

drop policy if exists transactions_select_owner on public.transactions;
drop policy if exists transactions_insert_owner on public.transactions;
drop policy if exists transactions_update_owner on public.transactions;
drop policy if exists transactions_delete_owner on public.transactions;

create policy transactions_select_owner
on public.transactions
for select
to authenticated
using (
  private.is_farm_owner(farm_id, (select auth.uid()))
);

create policy transactions_insert_owner
on public.transactions
for insert
to authenticated
with check (
  private.is_farm_owner(farm_id, (select auth.uid()))
);

create policy transactions_update_owner
on public.transactions
for update
to authenticated
using (
  private.is_farm_owner(farm_id, (select auth.uid()))
)
with check (
  private.is_farm_owner(farm_id, (select auth.uid()))
);

create policy transactions_delete_owner
on public.transactions
for delete
to authenticated
using (
  private.is_farm_owner(farm_id, (select auth.uid()))
);
