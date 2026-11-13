-- SewIt MVP — начальная схема (README 5, doc/architecture.md 4).
-- Применяется на пустой проект Supabase: SQL Editor или `supabase db push`.
-- Скрипт можно запускать повторно: таблицы и типы создаются с IF NOT EXISTS,
-- политики и триггеры пересоздаются.
--
-- ВАЖНО: выполнять от имени postgres (SQL Editor так и работает).
-- RLS включён на всех 14 таблицах; service_role обходит RLS только на сервере.

-- ─────────────────────────────── Расширения ───────────────────────────────

create extension if not exists pgcrypto;

-- ─────────────────────────────── Перечисления ─────────────────────────────

do $$
begin
  create type public.user_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.pattern_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('paid', 'refunded');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.param_code as enum ('length', 'sleeve', 'neckline', 'fit');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_format as enum ('pdf_a4');
exception
  when duplicate_object then null;
end $$;

-- ─────────────────────────────── Таблицы ──────────────────────────────────

-- Профиль: одна строка на auth.users, роль по умолчанию user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Мерки пользователя: одна актуальная строка (история — в снапшотах заказов).
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  bust numeric(5, 1) not null check (bust between 50 and 200),
  waist numeric(5, 1) not null check (waist between 40 and 200),
  hips numeric(5, 1) not null check (hips between 50 and 200),
  height numeric(5, 1) not null check (height between 120 and 220),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  parent_id uuid references public.categories (id) on delete set null,
  sort integer not null default 0
);

create table if not exists public.patterns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  category_id uuid not null references public.categories (id) on delete restrict,
  level smallint not null check (level between 1 and 5),
  sewing_hours numeric(4, 1) not null check (sewing_hours > 0),
  fabric_note text not null,
  materials text[] not null default '{}',
  allowances text not null,
  -- Цена в копейках: целые числа вместо float, как в orders.
  price integer not null check (price >= 0),
  cover_url text,
  model_3d_url text,
  status public.pattern_status not null default 'draft',
  sales_count integer not null default 0 check (sales_count >= 0),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.pattern_sizes (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references public.patterns (id) on delete cascade,
  label text not null,
  bust numeric(5, 1) not null,
  waist numeric(5, 1) not null,
  hips numeric(5, 1) not null,
  height_min smallint not null,
  height_max smallint not null,
  fabric_consumption_m numeric(4, 2) not null check (fabric_consumption_m > 0),
  unique (pattern_id, label),
  check (height_min < height_max)
);

-- Параметры пресета (FR-4.1): "values" — jsonb-массив {value, title, available}.
create table if not exists public.pattern_params (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references public.patterns (id) on delete cascade,
  code public.param_code not null,
  title text not null,
  "values" jsonb not null default '[]'::jsonb,
  unique (pattern_id, code),
  check (jsonb_typeof("values") = 'array')
);

-- Пути к PDF в приватном бакете. Клиенту таблица недоступна: путь отдаёт сервер.
create table if not exists public.pattern_files (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references public.patterns (id) on delete cascade,
  size_id uuid not null references public.pattern_sizes (id) on delete cascade,
  variant_key text not null default 'none',
  format public.file_format not null default 'pdf_a4',
  storage_path text not null,
  pages smallint,
  unique (pattern_id, size_id, variant_key, format)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  -- При удалении аккаунта заказ остаётся обезличенным (FR-6.5).
  user_id uuid references auth.users (id) on delete set null,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  promo_code text,
  status public.order_status not null default 'paid',
  measurements_snapshot jsonb,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  check (discount <= subtotal),
  check (total = subtotal - discount)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  pattern_id uuid not null references public.patterns (id) on delete restrict,
  size_label text not null,
  variant_key text not null default 'none',
  title text not null,
  price integer not null check (price >= 0)
);

-- Единственный источник права на скачивание. Создаётся только сервером.
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern_id uuid not null references public.patterns (id) on delete restrict,
  order_item_id uuid not null unique references public.order_items (id) on delete cascade,
  size_label text not null,
  variant_key text not null default 'none',
  granted_at timestamptz not null default now()
);

create table if not exists public.download_log (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid references public.entitlements (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  pattern_file_id uuid references public.pattern_files (id) on delete set null,
  at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern_id uuid not null references public.patterns (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pattern_id)
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  percent smallint not null check (percent between 1 and 100),
  max_uses integer not null check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (used_count <= max_uses)
);

create table if not exists public.instructions (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null unique references public.patterns (id) on delete cascade,
  content_md text not null,
  video_url text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────── Индексы ──────────────────────────────────

create index if not exists patterns_status_published_idx
  on public.patterns (status, published_at desc);
create index if not exists patterns_category_idx on public.patterns (category_id);
create index if not exists pattern_sizes_pattern_idx on public.pattern_sizes (pattern_id);
create index if not exists pattern_files_lookup_idx on public.pattern_files (pattern_id, size_id);
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists entitlements_user_idx on public.entitlements (user_id);
create index if not exists entitlements_pattern_idx on public.entitlements (pattern_id);
create index if not exists download_log_user_idx on public.download_log (user_id, at desc);
create index if not exists favorites_pattern_idx on public.favorites (pattern_id);

-- ─────────────────────────────── Функции ──────────────────────────────────

-- Проверка роли для политик. SECURITY DEFINER, чтобы не было рекурсии RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- Автоматическое создание профиля при регистрации (FR-8.1, T-06).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists measurements_set_updated_at on public.measurements;
create trigger measurements_set_updated_at
  before update on public.measurements
  for each row execute function public.set_updated_at();

-- ─────────────────────────────── RLS ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.measurements enable row level security;
alter table public.categories enable row level security;
alter table public.patterns enable row level security;
alter table public.pattern_sizes enable row level security;
alter table public.pattern_params enable row level security;
alter table public.pattern_files enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.entitlements enable row level security;
alter table public.download_log enable row level security;
alter table public.favorites enable row level security;
alter table public.promo_codes enable row level security;
alter table public.instructions enable row level security;

-- profiles: свой профиль; админ видит все. Роль меняется только через service_role.
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- measurements: только свои строки, админ тоже не читает чужие мерки.
drop policy if exists measurements_select_own on public.measurements;
create policy measurements_select_own
  on public.measurements for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists measurements_insert_own on public.measurements;
create policy measurements_insert_own
  on public.measurements for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists measurements_update_own on public.measurements;
create policy measurements_update_own
  on public.measurements for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists measurements_delete_own on public.measurements;
create policy measurements_delete_own
  on public.measurements for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- categories: читают все, меняет только админ.
drop policy if exists categories_select_all on public.categories;
create policy categories_select_all
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- patterns: черновики видит только админ (FR-8.2).
drop policy if exists patterns_select_published_or_admin on public.patterns;
create policy patterns_select_published_or_admin
  on public.patterns for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists patterns_admin_write on public.patterns;
create policy patterns_admin_write
  on public.patterns for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- pattern_sizes: наследуют видимость выкройки.
drop policy if exists pattern_sizes_select_published_or_admin on public.pattern_sizes;
create policy pattern_sizes_select_published_or_admin
  on public.pattern_sizes for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.patterns p
      where p.id = pattern_id and (p.status = 'published' or public.is_admin())
    )
  );

drop policy if exists pattern_sizes_admin_write on public.pattern_sizes;
create policy pattern_sizes_admin_write
  on public.pattern_sizes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- pattern_params: как pattern_sizes.
drop policy if exists pattern_params_select_published_or_admin on public.pattern_params;
create policy pattern_params_select_published_or_admin
  on public.pattern_params for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.patterns p
      where p.id = pattern_id and (p.status = 'published' or public.is_admin())
    )
  );

drop policy if exists pattern_params_admin_write on public.pattern_params;
create policy pattern_params_admin_write
  on public.pattern_params for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- pattern_files: политик нет вообще — таблицу читает только service_role.
-- Путь к PDF не должен утекать в клиентский запрос (architecture.md 4.1).

-- orders: свои заказы; админ видит все и меняет статус. Создаёт заказ сервер.
drop policy if exists orders_select_own_or_admin on public.orders;
create policy orders_select_own_or_admin
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists order_items_select_own_or_admin on public.order_items;
create policy order_items_select_own_or_admin
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin())
    )
  );

drop policy if exists entitlements_select_own_or_admin on public.entitlements;
create policy entitlements_select_own_or_admin
  on public.entitlements for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists download_log_select_own_or_admin on public.download_log;
create policy download_log_select_own_or_admin
  on public.download_log for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- favorites: только свои.
drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own
  on public.favorites for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own
  on public.favorites for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own
  on public.favorites for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- promo_codes: клиент не читает таблицу целиком, только админ.
drop policy if exists promo_codes_admin_all on public.promo_codes;
create policy promo_codes_admin_all
  on public.promo_codes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- instructions: к опубликованной выкройке — всем, иначе админ.
drop policy if exists instructions_select_published_or_admin on public.instructions;
create policy instructions_select_published_or_admin
  on public.instructions for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.patterns p
      where p.id = pattern_id and (p.status = 'published' or public.is_admin())
    )
  );

drop policy if exists instructions_admin_write on public.instructions;
create policy instructions_admin_write
  on public.instructions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────── Права ────────────────────────────────────

grant usage on schema public to anon, authenticated;

-- Каталог читают гости, RLS отфильтрует черновики.
grant select on public.categories, public.patterns, public.pattern_sizes,
  public.pattern_params, public.instructions to anon, authenticated;

-- Свои заказы, мерки, права и промокоды — только авторизованным.
grant select on public.orders, public.order_items, public.entitlements,
  public.download_log, public.promo_codes, public.profiles, public.measurements
  to authenticated;

-- Действия пользователя; RLS сузит их до собственных строк.
grant insert, delete on public.favorites to authenticated;
grant insert, update, delete on public.measurements to authenticated;

-- Профиль создаёт триггер, из клиента меняются только имя, e-mail и deleted_at.
-- Роль profiles.role недоступна даже админу из клиента: только service_role.
revoke insert, update, delete on public.profiles from authenticated;
grant update (email, name, deleted_at) on public.profiles to authenticated;

-- Админские CRUD; строки ограничены политикой is_admin().
grant insert, update, delete on public.categories, public.patterns,
  public.pattern_sizes, public.pattern_params, public.instructions,
  public.promo_codes to authenticated;
grant update on public.orders to authenticated;

-- Файлы лекал не читаются клиентом ни при каких политиках.
revoke all on public.pattern_files from anon, authenticated;

-- ─────────────────────────────── Storage ──────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('covers', 'covers', true, 5242880),
  ('patterns', 'patterns', false, 10485760),
  ('models', 'models', true, 5242880)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- covers: публичное чтение, запись — админ.
drop policy if exists covers_public_read on storage.objects;
create policy covers_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'covers');

drop policy if exists covers_admin_insert on storage.objects;
create policy covers_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'covers' and public.is_admin());

drop policy if exists covers_admin_update on storage.objects;
create policy covers_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'covers' and public.is_admin())
  with check (bucket_id = 'covers' and public.is_admin());

drop policy if exists covers_admin_delete on storage.objects;
create policy covers_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'covers' and public.is_admin());

-- patterns: публичного чтения нет, только service_role (signed URL).
drop policy if exists patterns_admin_insert on storage.objects;
create policy patterns_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'patterns' and public.is_admin());

drop policy if exists patterns_admin_update on storage.objects;
create policy patterns_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'patterns' and public.is_admin())
  with check (bucket_id = 'patterns' and public.is_admin());

drop policy if exists patterns_admin_delete on storage.objects;
create policy patterns_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'patterns' and public.is_admin());

-- models: .glb — не платный контент, читают все.
drop policy if exists models_public_read on storage.objects;
create policy models_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'models');

drop policy if exists models_admin_insert on storage.objects;
create policy models_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'models' and public.is_admin());

drop policy if exists models_admin_update on storage.objects;
create policy models_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'models' and public.is_admin())
  with check (bucket_id = 'models' and public.is_admin());

drop policy if exists models_admin_delete on storage.objects;
create policy models_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'models' and public.is_admin());
