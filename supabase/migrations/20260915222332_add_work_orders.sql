alter table public.tasks
  add column if not exists status text not null default 'aberta',
  add column if not exists started_at timestamptz,
  add column if not exists completed_by uuid references auth.users(id) on delete set null;

update public.tasks
set status = case when completed then 'concluida' else 'aberta' end
where status not in ('aberta', 'em_andamento', 'concluida')
   or (completed and status <> 'concluida');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_status_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_status_check
      check (status in ('aberta', 'em_andamento', 'concluida'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_notes_length_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_notes_length_check
      check (notes is null or char_length(notes) <= 1500);
  end if;
end;
$$;

create index if not exists tasks_farm_status_due_idx
  on public.tasks (farm_id, status, due_date);

create index if not exists tasks_completed_by_idx
  on public.tasks (completed_by)
  where completed_by is not null;

grant insert (status, started_at, completed_by) on table public.tasks to authenticated;
grant update (status, started_at, completed_by) on table public.tasks to authenticated;

create table if not exists public.task_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  farm_id uuid not null references public.farms(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete restrict default auth.uid(),
  update_type text not null default 'comentario'
    constraint task_updates_type_check
    check (update_type in ('comentario', 'iniciada', 'concluida', 'reaberta')),
  message text
    constraint task_updates_message_check
    check (message is null or char_length(btrim(message)) between 1 and 1000),
  photo_path text
    constraint task_updates_photo_path_check
    check (photo_path is null or char_length(photo_path) between 20 and 500),
  created_at timestamptz not null default now(),
  constraint task_updates_content_check
    check (update_type <> 'comentario' or message is not null or photo_path is not null)
);

comment on table public.task_updates is
  'Histórico imutável de comentários, fotos e mudanças de situação das ordens de serviço.';

create index if not exists task_updates_task_created_idx
  on public.task_updates (task_id, created_at desc);

create index if not exists task_updates_farm_created_idx
  on public.task_updates (farm_id, created_at desc);

create index if not exists task_updates_author_id_idx
  on public.task_updates (author_id);

alter table public.task_updates enable row level security;

revoke all privileges on table public.task_updates from public, anon, authenticated;
grant select on table public.task_updates to authenticated;
grant insert (task_id, farm_id, author_id, update_type, message, photo_path)
  on table public.task_updates to authenticated;

drop policy if exists task_updates_select_member on public.task_updates;
create policy task_updates_select_member
on public.task_updates
for select
to authenticated
using (
  private.is_farm_member(farm_id, (select auth.uid()))
);

drop policy if exists task_updates_insert_participant on public.task_updates;
create policy task_updates_insert_participant
on public.task_updates
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_farm_member(farm_id, (select auth.uid()))
  and exists (
    select 1
    from public.tasks task
    where task.id = task_id
      and task.farm_id = farm_id
      and (
        private.is_farm_owner(farm_id, (select auth.uid()))
        or task.assigned_to is null
        or task.assigned_to = (select auth.uid())
      )
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-evidence',
  'task-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists task_evidence_select_member on storage.objects;
create policy task_evidence_select_member
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-evidence'
  and exists (
    select 1
    from public.tasks task
    where task.farm_id::text = (storage.foldername(name))[1]
      and task.id::text = (storage.foldername(name))[2]
      and private.is_farm_member(task.farm_id, (select auth.uid()))
  )
);

drop policy if exists task_evidence_insert_participant on storage.objects;
create policy task_evidence_insert_participant
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-evidence'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[3] = (select auth.uid())::text
  and exists (
    select 1
    from public.tasks task
    where task.farm_id::text = (storage.foldername(name))[1]
      and task.id::text = (storage.foldername(name))[2]
      and (
        private.is_farm_owner(task.farm_id, (select auth.uid()))
        or task.assigned_to is null
        or task.assigned_to = (select auth.uid())
      )
  )
);

drop policy if exists task_evidence_delete_uploader_or_owner on storage.objects;
create policy task_evidence_delete_uploader_or_owner
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'task-evidence'
  and exists (
    select 1
    from public.tasks task
    where task.farm_id::text = (storage.foldername(name))[1]
      and task.id::text = (storage.foldername(name))[2]
      and (
        owner_id = (select auth.uid())::text
        or private.is_farm_owner(task.farm_id, (select auth.uid()))
      )
  )
);

create or replace function private.set_task_status_impl(
  p_task_id uuid,
  p_status text,
  p_message text default null,
  p_photo_path text default null
)
returns table (
  task_id uuid,
  task_status text,
  task_completed boolean,
  task_started_at timestamptz,
  task_completed_at timestamptz,
  task_completed_by uuid,
  task_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_farm_id uuid;
  v_assigned_to uuid;
  v_is_owner boolean;
  v_update_type text;
  v_message text := nullif(btrim(p_message), '');
begin
  if v_user_id is null then
    raise exception 'É necessário entrar na conta.' using errcode = '42501';
  end if;

  if p_status not in ('aberta', 'em_andamento', 'concluida') then
    raise exception 'Situação da ordem de serviço inválida.' using errcode = '22023';
  end if;

  if v_message is not null and char_length(v_message) > 1000 then
    raise exception 'A atualização deve ter no máximo 1000 caracteres.' using errcode = '22023';
  end if;

  select task.farm_id, task.assigned_to
  into v_farm_id, v_assigned_to
  from public.tasks task
  where task.id = p_task_id
  for update;

  if v_farm_id is null then
    raise exception 'Ordem de serviço não encontrada.' using errcode = 'P0002';
  end if;

  if not private.is_farm_member(v_farm_id, v_user_id) then
    raise exception 'Você não possui acesso a esta ordem de serviço.' using errcode = '42501';
  end if;

  v_is_owner := private.is_farm_owner(v_farm_id, v_user_id);
  if not v_is_owner and v_assigned_to is not null and v_assigned_to <> v_user_id then
    raise exception 'Somente o responsável ou o dono pode atualizar esta ordem.' using errcode = '42501';
  end if;

  if p_status = 'aberta' and not v_is_owner then
    raise exception 'Somente o dono pode reabrir uma ordem de serviço.' using errcode = '42501';
  end if;

  if p_photo_path is not null and p_photo_path not like
    v_farm_id::text || '/' || p_task_id::text || '/' || v_user_id::text || '/%' then
    raise exception 'A foto informada não pertence a esta ordem.' using errcode = '22023';
  end if;

  v_update_type := case p_status
    when 'em_andamento' then 'iniciada'
    when 'concluida' then 'concluida'
    else 'reaberta'
  end;

  return query
  update public.tasks task
  set status = p_status,
      completed = p_status = 'concluida',
      started_at = case
        when p_status = 'aberta' then null
        when task.started_at is null then now()
        else task.started_at
      end,
      completed_at = case when p_status = 'concluida' then now() else null end,
      completed_by = case when p_status = 'concluida' then v_user_id else null end,
      updated_at = now()
  where task.id = p_task_id
  returning
    task.id,
    task.status,
    task.completed,
    task.started_at,
    task.completed_at,
    task.completed_by,
    task.updated_at;

  insert into public.task_updates (
    task_id,
    farm_id,
    author_id,
    update_type,
    message,
    photo_path
  ) values (
    p_task_id,
    v_farm_id,
    v_user_id,
    v_update_type,
    v_message,
    p_photo_path
  );
end;
$$;

create or replace function public.set_task_status(
  p_task_id uuid,
  p_status text,
  p_message text default null,
  p_photo_path text default null
)
returns table (
  task_id uuid,
  task_status text,
  task_completed boolean,
  task_started_at timestamptz,
  task_completed_at timestamptz,
  task_completed_by uuid,
  task_updated_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.set_task_status_impl(p_task_id, p_status, p_message, p_photo_path);
$$;

revoke all on function private.set_task_status_impl(uuid, text, text, text)
  from public, anon;
grant execute on function private.set_task_status_impl(uuid, text, text, text)
  to authenticated, service_role;

revoke all on function public.set_task_status(uuid, text, text, text)
  from public, anon;
grant execute on function public.set_task_status(uuid, text, text, text)
  to authenticated, service_role;

create or replace function private.set_task_completion_impl(
  p_task_id uuid,
  p_completed boolean
)
returns table (
  task_id uuid,
  task_completed boolean,
  task_completed_at timestamptz,
  task_updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    saved.task_id,
    saved.task_completed,
    saved.task_completed_at,
    saved.task_updated_at
  from private.set_task_status_impl(
    p_task_id,
    case when p_completed then 'concluida' else 'aberta' end,
    null,
    null
  ) saved;
$$;

revoke all on function private.set_task_completion_impl(uuid, boolean)
  from public, anon;
grant execute on function private.set_task_completion_impl(uuid, boolean)
  to authenticated, service_role;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (notification_type in ('task_assigned', 'task_update'));

create or replace function private.create_task_update_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_assigned_to uuid;
  v_task_title text;
  v_title text;
  v_message text;
begin
  select farm.owner_id, task.assigned_to, task.title
  into v_owner_id, v_assigned_to, v_task_title
  from public.tasks task
  join public.farms farm on farm.id = task.farm_id
  where task.id = new.task_id;

  v_title := case new.update_type
    when 'comentario' then 'Nova atualização na ordem'
    when 'iniciada' then 'Ordem de serviço iniciada'
    when 'concluida' then 'Ordem de serviço concluída'
    else 'Ordem de serviço reaberta'
  end;

  v_message := left(
    v_task_title || case
      when new.message is not null then ' · ' || new.message
      when new.photo_path is not null then ' · nova foto anexada'
      else ''
    end,
    300
  );

  if new.author_id <> v_owner_id then
    insert into public.notifications (
      farm_id, recipient_id, task_id, notification_type, title, message
    ) values (
      new.farm_id, v_owner_id, new.task_id, 'task_update', v_title, v_message
    );
  elsif v_assigned_to is not null and v_assigned_to <> new.author_id then
    insert into public.notifications (
      farm_id, recipient_id, task_id, notification_type, title, message
    ) values (
      new.farm_id, v_assigned_to, new.task_id, 'task_update', v_title, v_message
    );
  else
    insert into public.notifications (
      farm_id, recipient_id, task_id, notification_type, title, message
    )
    select
      new.farm_id,
      member.user_id,
      new.task_id,
      'task_update',
      v_title,
      v_message
    from public.farm_members member
    where member.farm_id = new.farm_id
      and member.status = 'active'
      and member.user_id <> new.author_id;
  end if;

  return new;
end;
$$;

revoke execute on function private.create_task_update_notifications()
  from public, anon, authenticated, service_role;

drop trigger if exists task_updates_create_notifications on public.task_updates;
create trigger task_updates_create_notifications
after insert on public.task_updates
for each row execute function private.create_task_update_notifications();

comment on function public.set_task_status(uuid, text, text, text) is
  'Atualiza com segurança a situação de uma ordem de serviço e registra seu histórico.';
