-- Защита на уровне БД: публичный ключ позволяет писать в Supabase напрямую, минуя Express,
-- поэтому лимиты и проверки, которые раньше были только на бэкенде, дублируем здесь.

-- 1. Комментарии: пользователь задаёт только заведение, текст и себя как автора (это сверяет RLS);
--    id, статус и дата — по умолчанию, подделать нельзя
revoke insert on public.comments from authenticated;
grant insert (institution_id, user_id, body) on public.comments to authenticated;

-- Не больше 5 комментариев в минуту от одного пользователя (как лимит бэкенда)
create function private.comments_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.comments where user_id = new.user_id and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'comment rate limit';
  end if;
  return new;
end;
$$;
revoke execute on function private.comments_rate_limit() from public, anon, authenticated;
create trigger comments_rate_limit before insert on public.comments
  for each row execute function private.comments_rate_limit();

-- 2. Имя: 1–80 символов (раньше через REST можно было записать строку любой длины)
alter table public.profiles add constraint profiles_display_name_length
  check (char_length(btrim(display_name)) between 1 and 80);

-- Имя при регистрации: без имени — нейтральное «Пользователь», а не начало почты (оно видно в комментариях)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    'Пользователь'
  ), 80));
  return new;
end;
$$;

-- 3. Чаты с AI: не больше 200 сообщений и ~1 МБ на чат (бэкенд хранит последние 100)
alter table public.ai_chats add constraint ai_chats_messages_size
  check (jsonb_array_length(messages) <= 200 and pg_column_size(messages) < 1000000);

-- 4. Своя роль — через my_role() (колонку role закрывает 0012 после обновления бэкенда)
create function public.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid());
$$;
revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- 5. Дневной лимит сообщений AI-помощнику: счётчик по дням, закрыт от API (только через ai_take_quota)
create table private.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  used integer not null default 0,
  primary key (user_id, day)
);
alter table private.ai_usage enable row level security;

-- Засчитывает одно сообщение и возвращает true, пока за сегодня их не больше 100
create function public.ai_take_quota() returns boolean
language sql volatile security definer set search_path = '' as $$
  insert into private.ai_usage as u (user_id, day, used) values ((select auth.uid()), current_date, 1)
  on conflict (user_id, day) do update set used = u.used + 1
  returning used <= 100;
$$;
revoke execute on function public.ai_take_quota() from public, anon;
grant execute on function public.ai_take_quota() to authenticated;
