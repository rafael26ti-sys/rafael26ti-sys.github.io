begin;

alter table public.animals
  add column if not exists inactive_reason text,
  add column if not exists inactive_on date;

comment on column public.animals.inactive_reason is
  'Motivo da inatividade do animal: sold (vendido) ou deceased (morto).';
comment on column public.animals.inactive_on is
  'Data da venda ou morte do animal.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'animals_inactive_status_check'
      and conrelid = 'public.animals'::regclass
  ) then
    alter table public.animals
      add constraint animals_inactive_status_check
      check (
        (
          active
          and inactive_reason is null
          and inactive_on is null
        )
        or (
          not active
          and inactive_reason = any (array['sold', 'deceased']::text[])
          and inactive_on is not null
        )
      );
  end if;
end
$$;

grant select (inactive_reason, inactive_on)
  on public.animals to authenticated;
grant insert (inactive_reason, inactive_on)
  on public.animals to authenticated;
grant update (inactive_reason, inactive_on)
  on public.animals to authenticated;

commit;
