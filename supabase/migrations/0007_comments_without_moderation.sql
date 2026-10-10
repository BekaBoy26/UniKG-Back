-- Комментарии публикуются сразу, без модерации. Удалить может автор или админ (политика "delete own or as admin").
alter table public.comments alter column status set default 'approved';

-- Всё, что ждало проверки, публикуем
update public.comments set status = 'approved' where status = 'pending';

-- Пользователь добавляет только опубликованный комментарий от своего имени
drop policy "users create pending comments" on public.comments;
create policy "users create comments" on public.comments
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'approved');
