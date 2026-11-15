-- SewIt — проверка RLS боевой базы (T-03, T-47, бэклог 7.2).
--
-- Запуск:
--   Supabase → SQL Editor → вставить файл целиком;
--   либо psql "$SUPABASE_DB_URL" -f scripts/check-rls.sql
--
-- Скрипт печатает NOTICE «OK …», а на нарушении падает с исключением
-- (ненулевой код возврата), поэтому его можно вызывать в CI и перед демо.
-- Ожидания: аноним видит только опубликованные выкройки и категории;
-- черновики, заказы, права и мерки закрыты; pattern_files недоступна вовсе.

\echo '1. RLS включён на всех таблицах public (все строки должны быть true)'
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

\echo '2. Политики по таблицам (для глаза: у каждой таблицы своя политика)'
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

\echo '3. Проверки от имени anon'

set role anon;

do $$
declare
  visible_rows integer;
begin
  -- Опубликованные выкройки аноним видеть должен.
  select count(*) into visible_rows from public.patterns where status = 'published';
  if visible_rows < 6 then
    raise exception 'FAIL: аноним видит только % опубликованных выкроек, ожидается ≥ 6', visible_rows;
  end if;
  raise notice 'OK: опубликованных выкроек для анонима — %', visible_rows;

  -- Черновики — не должен.
  select count(*) into visible_rows from public.patterns where status = 'draft';
  if visible_rows <> 0 then
    raise exception 'FAIL: аноним видит % черновиков', visible_rows;
  end if;
  raise notice 'OK: черновики скрыты от анонима';

  -- Категории публичны, это часть витрины.
  select count(*) into visible_rows from public.categories;
  if visible_rows < 5 then
    raise exception 'FAIL: аноним видит % категорий, ожидается ≥ 5', visible_rows;
  end if;
  raise notice 'OK: категорий для анонима — %', visible_rows;

  -- Заказы и права — только владелец, у анонима их нет.
  select count(*) into visible_rows from public.orders;
  if visible_rows <> 0 then
    raise exception 'FAIL: аноним видит % заказов', visible_rows;
  end if;
  raise notice 'OK: заказы скрыты от анонима';

  select count(*) into visible_rows from public.entitlements;
  if visible_rows <> 0 then
    raise exception 'FAIL: аноним видит % entitlements', visible_rows;
  end if;
  raise notice 'OK: entitlements скрыты от анонима';

  select count(*) into visible_rows from public.download_log;
  if visible_rows <> 0 then
    raise exception 'FAIL: аноним видит % записей журнала скачиваний', visible_rows;
  end if;
  raise notice 'OK: download_log скрыт от анонима';

  select count(*) into visible_rows from public.profiles;
  if visible_rows <> 0 then
    raise exception 'FAIL: аноним видит % профилей', visible_rows;
  end if;
  raise notice 'OK: профили скрыты от анонима';

  select count(*) into visible_rows from public.measurements;
  if visible_rows <> 0 then
    raise exception 'FAIL: аноним видит % строк мерок', visible_rows;
  end if;
  raise notice 'OK: мерки скрыты от анонима';

  -- Файлы лекал: у роли нет даже права SELECT (revoke в миграции).
  begin
    select count(*) into visible_rows from public.pattern_files;
    raise exception 'FAIL: pattern_files читается анонимом (% строк)', visible_rows;
  exception
    when insufficient_privilege then
      raise notice 'OK: pattern_files закрыта для anon (42501)';
  end;
end $$;

reset role;

\echo '4. Storage: публичные только covers и models'
select name, public
from storage.buckets
order by name;
