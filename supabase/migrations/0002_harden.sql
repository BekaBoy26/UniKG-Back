-- Исправления по Supabase advisors

-- Триггерную функцию нельзя вызывать через /rest/v1/rpc
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_admin переносим в схему private, которая не публикуется через API
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- institutions: отдельные политики на запись, чтобы не было двух SELECT-политик
drop policy "admins manage institutions" on public.institutions;
create policy "admins insert institutions" on public.institutions
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update institutions" on public.institutions
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete institutions" on public.institutions
  for delete to authenticated using ((select private.is_admin()));

alter policy "users read comments" on public.comments
  using (status = 'approved' or user_id = (select auth.uid()) or (select private.is_admin()));
alter policy "admins moderate comments" on public.comments
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "delete own or as admin" on public.comments
  using (user_id = (select auth.uid()) or (select private.is_admin()));

drop function public.is_admin();
