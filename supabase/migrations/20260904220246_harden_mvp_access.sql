-- Desativa o acesso à tabela legada de contatos. O formulário atual usa
-- public.contact_messages, que possui validação, limite de envios e RLS próprio.
drop policy if exists "Permitir inserções públicas" on public.contatos;
drop policy if exists "Permitir leitura apenas para usuários autenticados" on public.contatos;
revoke all privileges on table public.contatos from public, anon, authenticated;

-- O cadastro e a entrada na equipe acontecem apenas depois que o Supabase Auth
-- cria uma sessão autenticada. Visitantes anônimos não precisam tocar nestas tabelas.
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.farms from anon;
revoke all privileges on table public.farm_members from anon;
revoke all privileges on table public.farm_invites from anon;

-- Índices das chaves estrangeiras usadas pela Agenda. Eles aceleram consultas,
-- exclusões relacionadas e verificações de integridade conforme o volume cresce.
create index if not exists tasks_assigned_to_idx
  on public.tasks (assigned_to);

create index if not exists tasks_created_by_idx
  on public.tasks (created_by);
