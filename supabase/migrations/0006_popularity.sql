-- Порядок «по популярности»: меньше — выше в каталоге и на главной; null — после ранжированных, по названию
alter table public.institutions add column popularity smallint check (popularity > 0);

create or replace function public.search_institutions(
  q text default null,
  p_type public.institution_type default null,
  p_city text default null,
  p_field text default null,
  p_ownership public.ownership default null,
  p_max_tuition integer default null,
  p_limit integer default 10
) returns setof public.institutions
language sql stable security invoker set search_path = '' as $$
  select i.*
  from public.institutions i
  where (coalesce(q, '') = ''
         or i.short ilike '%' || q || '%'
         or i.slug ilike '%' || q || '%'
         or i.name::text ilike '%' || q || '%'
         or i.programs::text ilike '%' || q || '%'
         or i.description::text ilike '%' || q || '%')
    and (p_type is null or i.type = p_type)
    and (coalesce(p_city, '') = '' or i.city::text ilike '%' || p_city || '%')
    and (p_field is null or p_field = any (i.fields))
    and (p_ownership is null or i.ownership = p_ownership)
    and (p_max_tuition is null or i.tuition_from <= p_max_tuition)
  order by i.popularity nulls last, i.short
  limit least(greatest(coalesce(p_limit, 10), 1), 30);
$$;
