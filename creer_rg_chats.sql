-- RestoGest : création de la table de messagerie (Support)
-- À exécuter UNE fois dans Supabase > SQL Editor > Run

create table if not exists public.rg_chats (
  id   text primary key,
  data jsonb not null,
  seq  bigint generated always as identity
);

create index if not exists rg_chats_seq_idx on public.rg_chats (seq);

alter table public.rg_chats enable row level security;

drop policy if exists "rg_chats_all" on public.rg_chats;
create policy "rg_chats_all" on public.rg_chats
  for all to anon, authenticated
  using (true) with check (true);

grant select, insert, update, delete on public.rg_chats to anon, authenticated;

-- Force PostgREST à recharger son cache de schéma (corrige l'erreur PGRST205)
notify pgrst, 'reload schema';
