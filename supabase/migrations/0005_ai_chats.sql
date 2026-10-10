-- История диалогов с AI-помощником. Каждый пользователь видит и меняет только свои чаты.
-- messages — массив {"role": "user" | "model", "text": "...", "links"?: [{slug, short, name, city}]}
create table public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_chats_user_updated_idx on public.ai_chats (user_id, updated_at desc);

create trigger ai_chats_updated_at before update on public.ai_chats
  for each row execute function public.set_updated_at();

alter table public.ai_chats enable row level security;

create policy "users read own chats" on public.ai_chats
  for select to authenticated using (user_id = (select auth.uid()));
create policy "users create own chats" on public.ai_chats
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users update own chats" on public.ai_chats
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users delete own chats" on public.ai_chats
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.ai_chats from anon;
