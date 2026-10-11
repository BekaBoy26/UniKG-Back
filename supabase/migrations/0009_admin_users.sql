-- Список пользователей для админки. Почта, аватар и способ входа лежат в auth.users, к которой API доступа не имеет,
-- поэтому функция — security definer. Не-админ получает пустой список (private.is_admin проверяет роль вызывающего)
create function public.admin_list_users()
returns table (
  id uuid,
  display_name text,
  role public.user_role,
  created_at timestamptz,
  email text,
  avatar_url text,
  provider text,
  last_sign_in_at timestamptz,
  comments bigint
)
language sql stable security definer set search_path = '' as $$
  select
    p.id,
    p.display_name,
    p.role,
    p.created_at,
    u.email::text,
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_app_meta_data ->> 'provider',
    u.last_sign_in_at,
    (select count(*) from public.comments c where c.user_id = p.id)
  from public.profiles p
  left join auth.users u on u.id = p.id
  where (select private.is_admin())
  order by p.created_at desc;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
