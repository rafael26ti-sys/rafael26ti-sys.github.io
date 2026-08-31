create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  notification_type text not null default 'task_assigned'
    constraint notifications_type_check check (notification_type in ('task_assigned')),
  title text not null
    constraint notifications_title_check check (
      char_length(btrim(title)) between 2 and 100
    ),
  message text not null
    constraint notifications_message_check check (
      char_length(btrim(message)) between 2 and 300
    ),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'Avisos privados enviados aos membros da fazenda, inclusive novas atividades.';

create index notifications_farm_id_idx
  on public.notifications (farm_id);

create index notifications_task_id_idx
  on public.notifications (task_id);

create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

revoke all on table public.notifications from public, anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

create policy notifications_select_recipient
on public.notifications
for select
to authenticated
using (
  recipient_id = (select auth.uid())
  and (select private.is_farm_member(farm_id, (select auth.uid())))
);

create policy notifications_update_read_status
on public.notifications
for update
to authenticated
using (
  recipient_id = (select auth.uid())
  and (select private.is_farm_member(farm_id, (select auth.uid())))
)
with check (
  recipient_id = (select auth.uid())
  and (select private.is_farm_member(farm_id, (select auth.uid())))
);

create or replace function private.create_task_assignment_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  notification_title text := 'Nova atividade para você';
  notification_message text;
begin
  if caller_id is not null
    and not (select private.is_farm_owner(new.farm_id, caller_id)) then
    raise exception 'Somente o dono da fazenda pode atribuir atividades.';
  end if;

  if tg_op = 'UPDATE' and new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;

  notification_message := format(
    '%s · prazo %s',
    new.title,
    to_char(new.due_date, 'DD/MM/YYYY')
  );

  if new.assigned_to is not null then
    if new.assigned_to is distinct from new.created_by then
      insert into public.notifications (
        farm_id,
        recipient_id,
        task_id,
        notification_type,
        title,
        message
      )
      values (
        new.farm_id,
        new.assigned_to,
        new.id,
        'task_assigned',
        notification_title,
        notification_message
      );
    end if;
  else
    insert into public.notifications (
      farm_id,
      recipient_id,
      task_id,
      notification_type,
      title,
      message
    )
    select
      new.farm_id,
      member.user_id,
      new.id,
      'task_assigned',
      notification_title,
      notification_message
    from public.farm_members as member
    where member.farm_id = new.farm_id
      and member.status = 'active'
      and member.user_id is distinct from new.created_by;
  end if;

  return new;
end;
$$;

revoke execute on function private.create_task_assignment_notifications()
  from public, anon, authenticated, service_role;

create trigger tasks_create_assignment_notifications
after insert or update of assigned_to on public.tasks
for each row
execute function private.create_task_assignment_notifications();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
