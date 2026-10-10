-- Ссылки на открытые источники, из которых взяты данные о вузе
alter table public.institutions add column sources text[] not null default '{}';
