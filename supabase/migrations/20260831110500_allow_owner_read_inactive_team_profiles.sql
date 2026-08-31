create or replace function private.users_share_farm(
  p_first_user uuid,
  p_second_user uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farm_members first_member
    join public.farm_members second_member
      on second_member.farm_id = first_member.farm_id
    where first_member.user_id = p_first_user
      and second_member.user_id = p_second_user
      and second_member.status = 'active'
      and (
        first_member.status = 'active'
        or second_member.role = 'owner'
      )
  );
$$;

comment on function private.users_share_farm(uuid, uuid) is
  'Allows active teammates to see one another and lets an active owner keep managing inactive members.';
