begin;

alter table public.farms
  add column location_latitude numeric(9, 6),
  add column location_longitude numeric(9, 6),
  add constraint farms_location_pair_check check (
    (location_latitude is null and location_longitude is null)
    or (
      location_latitude between -90 and 90
      and location_longitude between -180 and 180
    )
  );

-- Existing farms_select_members and farms_update_owner policies keep the
-- coordinates private to the farm team and writable only by its owner.

commit;
