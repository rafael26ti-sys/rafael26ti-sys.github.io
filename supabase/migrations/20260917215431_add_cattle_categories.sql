begin;

alter table public.animals
  add column if not exists cattle_category text;

comment on column public.animals.cattle_category is
  'Categoria do gado: bezerro, novilha, vaca, boi ou touro.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'animals_cattle_category_check'
      and conrelid = 'public.animals'::regclass
  ) then
    alter table public.animals
      add constraint animals_cattle_category_check
      check (
        cattle_category is null
        or (
          cattle_category = any (
            array['bezerro', 'novilha', 'vaca', 'boi', 'touro']::text[]
          )
          and (
            lower(species) like '%bovin%'
            or lower(species) like '%gado%'
            or lower(species) like '%vaca%'
          )
        )
      );
  end if;
end
$$;

grant select (cattle_category)
  on public.animals to authenticated;
grant insert (cattle_category)
  on public.animals to authenticated;
grant update (cattle_category)
  on public.animals to authenticated;

commit;
