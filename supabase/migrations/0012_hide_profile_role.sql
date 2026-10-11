-- Роль больше не видна через API: читать можно только id, имя и дату регистрации (раньше любой мог узнать, кто админ).
-- Применять после деплоя бэкенда, который берёт роль через my_role() (0011). Проверки прав
-- (private.is_admin, admin_list_users, my_role) — security definer и работают как раньше.
revoke select on public.profiles from anon, authenticated;
grant select (id, display_name, created_at) on public.profiles to anon, authenticated;
