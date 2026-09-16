begin;

create index if not exists milk_production_animal_farm_date_idx
  on public.milk_production_records (animal_id, farm_id, production_date desc);

create index if not exists milk_production_created_by_idx
  on public.milk_production_records (created_by);

drop index if exists public.milk_production_animal_date_idx;

commit;
