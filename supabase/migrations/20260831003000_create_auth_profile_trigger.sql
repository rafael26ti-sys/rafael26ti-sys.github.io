create or replace function private.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  normalized_name text := left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100);
begin
  if char_length(normalized_name) < 2 then
    normalized_name := 'Usuário Rural';
  end if;

  insert into public.profiles (user_id, full_name)
  values (new.id, normalized_name)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

revoke all on function private.handle_new_auth_user_profile() from public, anon, authenticated;
grant execute on function private.handle_new_auth_user_profile() to service_role;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function private.handle_new_auth_user_profile();

insert into public.profiles (user_id, full_name)
select
  users.id,
  case
    when char_length(left(trim(coalesce(users.raw_user_meta_data ->> 'full_name', '')), 100)) >= 2
      then left(trim(users.raw_user_meta_data ->> 'full_name'), 100)
    else 'Usuário Rural'
  end
from auth.users as users
on conflict (user_id) do nothing;

comment on function private.handle_new_auth_user_profile()
is 'Cria o perfil público mínimo quando uma conta é registrada no Supabase Auth.';
