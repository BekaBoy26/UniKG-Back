-- UniKG: базовая схема — учебные заведения, профили, комментарии с модерацией

create type public.institution_type as enum ('university', 'college');
create type public.ownership as enum ('state', 'private');
create type public.user_role as enum ('user', 'admin');
create type public.comment_status as enum ('pending', 'approved', 'rejected');

-- Учебные заведения. Локализованные поля — jsonb вида {"ru": "...", "ky": "...", "en": "..."}
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  type public.institution_type not null,
  short text not null,
  name jsonb not null,
  city jsonb not null,
  ownership public.ownership not null,
  fields text[] not null default '{}',
  image text,
  description jsonb,
  languages jsonb,
  study_form jsonb,
  tuition_from integer check (tuition_from >= 0), -- сом в год, null — неизвестно
  programs jsonb not null default '[]',
  website text,
  address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index institutions_type_idx on public.institutions (type);

-- Профиль пользователя (создаётся автоматически при регистрации)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status public.comment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index comments_institution_status_idx on public.comments (institution_id, status, created_at desc);
create index comments_user_idx on public.comments (user_id);
create index comments_status_idx on public.comments (status, created_at);

-- updated_at
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger institutions_updated_at before update on public.institutions
  for each row execute function public.set_updated_at();

-- Профиль при регистрации
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Проверка роли для политик
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- RLS
alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.comments enable row level security;

-- institutions: читают все, меняют только админы
create policy "institutions are public" on public.institutions
  for select to anon, authenticated using (true);
create policy "admins manage institutions" on public.institutions
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- profiles: имя автора видно всем (для комментариев), менять можно только своё имя
create policy "profiles are public" on public.profiles
  for select to anon, authenticated using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Роль меняется только вручную (SQL / дашборд), не через API
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- comments: видны одобренные, свои и все — админам
create policy "anon reads approved comments" on public.comments
  for select to anon using (status = 'approved');
create policy "users read comments" on public.comments
  for select to authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or (select public.is_admin()));
create policy "users create pending comments" on public.comments
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
create policy "admins moderate comments" on public.comments
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "delete own or as admin" on public.comments
  for delete to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Обычный пользователь может только добавить комментарий, менять статус — админ
revoke update on public.comments from anon, authenticated;
grant update (status) on public.comments to authenticated;
