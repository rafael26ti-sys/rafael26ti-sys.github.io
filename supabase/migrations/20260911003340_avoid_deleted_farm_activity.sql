-- O histórico pertence à própria fazenda. Ao remover uma fazenda, seus registros
-- são apagados em cascata; portanto não existe destino válido para um evento de exclusão.
drop trigger if exists audit_farms_activity on public.farms;

create trigger audit_farms_activity
after insert or update on public.farms
for each row execute function private.capture_activity_log('propriedade');
