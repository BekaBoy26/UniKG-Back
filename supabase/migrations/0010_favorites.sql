-- Избранные учебные заведения. Каждый пользователь видит и меняет только свой список
-- (у гостей избранное хранится в localStorage браузера и переносится сюда после входа)
create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, institution_id)
);

create index favorites_institution_idx on public.favorites (institution_id);

alter table public.favorites enable row level security;

create policy "users read own favorites" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy "users add own favorites" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users remove own favorites" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.favorites from anon;
