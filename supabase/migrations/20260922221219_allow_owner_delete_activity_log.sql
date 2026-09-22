-- Owners can remove individual history entries without deleting source records.
-- The existing SELECT policy remains required for DELETE ... RETURNING.
begin;

alter table public.activity_log enable row level security;

drop policy if exists activity_log_delete_owner on public.activity_log;
create policy activity_log_delete_owner
on public.activity_log
for delete
to authenticated
using (
  (select private.is_farm_owner(farm_id, (select auth.uid())))
);

grant delete on table public.activity_log to authenticated;

comment on table public.activity_log is
  'Histórico automático por fazenda. Somente o dono pode consultar e excluir atividades; inclusão e edição diretas continuam bloqueadas.';

commit;
