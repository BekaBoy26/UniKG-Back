-- Комментарии в реальном времени: сайт и админка подписываются на изменения через Supabase Realtime.
-- Какие строки увидит подписчик, решает RLS (аноним — только опубликованные, админ — все)
alter publication supabase_realtime add table public.comments;
