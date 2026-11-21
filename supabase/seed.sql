-- SewIt MVP — демо-данные (T-04).
-- Запускать ПОСЛЕ миграции 20261113183900_init.sql, от имени postgres.
-- Скрипт идемпотентен: повторный запуск обновляет данные, а не дублирует их.
--
-- Каталог совпадает с README 9: 5 категорий, 6 опубликованных моделей + 1 черновик,
-- размеры 42/46/48/50, параметры пресетов, промокод SEWIT10.
-- Пути в pattern_files — заглушки: реальные PDF появятся в T-C01/T-C02 и должны
-- лежать в приватном бакете `patterns` ровно по этим путям.

-- ─────────────────────────────── Категории ────────────────────────────────

insert into public.categories (id, slug, title, sort)
values
  ('10000000-0000-4000-8000-000000000001', 'dresses', 'Платья', 1),
  ('10000000-0000-4000-8000-000000000002', 'skirts', 'Юбки', 2),
  ('10000000-0000-4000-8000-000000000003', 'trousers', 'Брюки', 3),
  ('10000000-0000-4000-8000-000000000004', 'tops', 'Топы', 4),
  ('10000000-0000-4000-8000-000000000005', 'outerwear', 'Верхняя одежда', 5)
on conflict (slug) do update
  set title = excluded.title,
      sort = excluded.sort;

-- ─────────────────────────────── Выкройки ─────────────────────────────────

insert into public.patterns (
  slug, title, description, category_id, level, sewing_hours, fabric_note,
  materials, allowances, price, cover_url, model_3d_url, status, sales_count,
  created_at, published_at
)
select
  v.slug,
  v.title,
  v.description,
  c.id,
  v.level,
  v.sewing_hours,
  v.fabric_note,
  v.materials,
  v.allowances,
  v.price,
  null,
  -- Демо-модель для 3D-вьюера (T-43): одна на все карточки, пока нет GLB из T-C07.
  '/models/demo-dress-form.glb',
  v.status::public.pattern_status,
  v.sales_count,
  v.created_at,
  v.published_at
from (
  values
    (
      'dress-shirt',
      'Платье-рубашка',
      'Свободное платье с отложным воротником, планкой и накладными карманами. Длина midi или maxi, рукав на выбор — от короткого до длинного.',
      'dresses',
      3,
      6,
      'Плотный хлопок, лён или тенсел: ткань держит форму воротника и не просвечивает.',
      array['2,5 м основной ткани при ширине 140 см', 'Флизелин для воротника и планки', '6 пуговиц 12 мм', 'Нитки в тон'],
      '1 см по всем срезам, 3 см по низу и низу рукава. Припуски уже в лекалах.',
      249000,
      'published',
      128,
      '2026-10-02T00:00:00Z'::timestamptz,
      '2026-10-05T00:00:00Z'::timestamptz
    ),
    (
      'skirt-slit',
      'Прямая юбка с разрезом',
      'Юбка на притачном поясе с разрезом сзади. Держит форму, но не сковывает шаг; длина mini или midi.',
      'skirts',
      1,
      3,
      'Костюмная шерсть, вискоза или плотный деним.',
      array['1,2 м ткани при ширине 140 см', 'Потайная молния 20 см', 'Клеевой пояс', 'Нитки в тон'],
      '1 см по боковым швам, 3 см по низу. Припуски уже в лекалах.',
      149000,
      'published',
      96,
      '2026-09-18T00:00:00Z'::timestamptz,
      '2026-09-20T00:00:00Z'::timestamptz
    ),
    (
      'trousers-palazzo',
      'Брюки-палаццо',
      'Широкие брюки с завышенной посадкой и мягкими складками от пояса. Скрытая молния и карманы в боковых швах.',
      'trousers',
      3,
      5,
      'Вискоза, лён или струящийся полиэстер.',
      array['2,6 м ткани при ширине 140 см', 'Потайная молния 18 см', 'Клеевой пояс', 'Нитки в тон'],
      '1 см по швам, 3 см по низу. Припуски уже в лекалах.',
      189000,
      'published',
      88,
      '2026-10-11T00:00:00Z'::timestamptz,
      '2026-10-12T00:00:00Z'::timestamptz
    ),
    (
      'top-puff',
      'Топ с рукавом-фонариком',
      'Топ с круглым или V-образным вырезом и рукавом-фонариком на манжете. Быстрый проект для первой пробы.',
      'tops',
      2,
      3,
      'Хлопковый поплин, вискоза или лёгкий лён.',
      array['1,1 м ткани', 'Резинка 1 см для манжет', 'Нитки в тон'],
      '1 см по швам, 2 см по низу. Припуски уже в лекалах.',
      129000,
      'published',
      74,
      '2026-09-30T00:00:00Z'::timestamptz,
      '2026-10-01T00:00:00Z'::timestamptz
    ),
    (
      'hoodie-oversize',
      'Худи оверсайз',
      'Худи с капюшоном, спущенной проймой и карманом-кенгуру. Свободная посадка, мягкий трикотаж и регулируемая длина.',
      'outerwear',
      4,
      7,
      'Футер двунитка или плотный флис.',
      array['2,2 м футера', 'Резинка 5 см для манжет и пояса', 'Шнурок 1,5 м', 'Нитки в тон'],
      '1 см по швам, 2,5 см по низу. Припуски уже в лекалах.',
      219000,
      'published',
      112,
      '2026-10-20T00:00:00Z'::timestamptz,
      '2026-10-21T00:00:00Z'::timestamptz
    ),
    (
      'slip-dress',
      'Платье-комбинация',
      'Платье по косой с тонкими бретелями и мягкой драпировкой. Длина midi или maxi, вырез V или лодочка.',
      'dresses',
      2,
      4,
      'Атлас, вискозный креп или шёлк. Проверьте драпируемость и осыпаемость.',
      array['1,8 м ткани при ширине 145 см', 'Косая бейка для обработки выреза', 'Регуляторы для бретелей', 'Нитки в тон'],
      '1 см по швам, 2 см по низу. Припуски уже в лекалах.',
      229000,
      'published',
      67,
      '2026-10-28T00:00:00Z'::timestamptz,
      '2026-10-29T00:00:00Z'::timestamptz
    ),
    (
      'dress-back',
      'Платье с открытой спиной',
      'Платье с открытой спиной и мягкой драпировкой по спинке. Модель готовится к публикации в каталоге.',
      'dresses',
      4,
      7,
      'Креп или вискоза.',
      array['2,0 м ткани', 'Потайная молния', 'Нитки в тон'],
      '1 см по швам, 2 см по низу.',
      259000,
      'draft',
      0,
      '2026-11-10T00:00:00Z'::timestamptz,
      null
    )
) as v(
  slug, title, description, category_slug, level, sewing_hours, fabric_note,
  materials, allowances, price, status, sales_count, created_at, published_at
)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      category_id = excluded.category_id,
      level = excluded.level,
      sewing_hours = excluded.sewing_hours,
      fabric_note = excluded.fabric_note,
      materials = excluded.materials,
      allowances = excluded.allowances,
      price = excluded.price,
      cover_url = excluded.cover_url,
      model_3d_url = excluded.model_3d_url,
      status = excluded.status,
      sales_count = excluded.sales_count,
      created_at = excluded.created_at,
      published_at = excluded.published_at;

-- ─────────────────────────────── Размеры ──────────────────────────────────

insert into public.pattern_sizes (
  pattern_id, label, bust, waist, hips, height_min, height_max, fabric_consumption_m
)
select
  p.id,
  v.label,
  v.bust,
  v.waist,
  v.hips,
  v.height_min,
  v.height_max,
  v.fabric_consumption_m
from (
  values
    ('dress-shirt', '42', 84, 66, 92, 158, 168, 2.20),
    ('dress-shirt', '46', 92, 74, 100, 160, 170, 2.50),
    ('dress-shirt', '48', 96, 78, 104, 161, 171, 2.65),
    ('dress-shirt', '50', 100, 82, 108, 162, 172, 2.80),
    ('skirt-slit', '42', 84, 66, 92, 158, 168, 1.10),
    ('skirt-slit', '46', 92, 74, 100, 160, 170, 1.20),
    ('skirt-slit', '48', 96, 78, 104, 161, 171, 1.30),
    ('skirt-slit', '50', 100, 82, 108, 162, 172, 1.40),
    ('trousers-palazzo', '42', 84, 66, 92, 158, 168, 2.40),
    ('trousers-palazzo', '46', 92, 74, 100, 160, 170, 2.60),
    ('trousers-palazzo', '48', 96, 78, 104, 161, 171, 2.75),
    ('trousers-palazzo', '50', 100, 82, 108, 162, 172, 2.90),
    ('top-puff', '42', 84, 66, 92, 158, 168, 1.00),
    ('top-puff', '46', 92, 74, 100, 160, 170, 1.10),
    ('top-puff', '48', 96, 78, 104, 161, 171, 1.15),
    ('top-puff', '50', 100, 82, 108, 162, 172, 1.20),
    ('hoodie-oversize', '42', 84, 66, 92, 158, 168, 2.00),
    ('hoodie-oversize', '46', 92, 74, 100, 160, 170, 2.20),
    ('hoodie-oversize', '48', 96, 78, 104, 161, 171, 2.35),
    ('hoodie-oversize', '50', 100, 82, 108, 162, 172, 2.50),
    ('slip-dress', '42', 84, 66, 92, 158, 168, 1.60),
    ('slip-dress', '46', 92, 74, 100, 160, 170, 1.80),
    ('slip-dress', '48', 96, 78, 104, 161, 171, 1.90),
    ('slip-dress', '50', 100, 82, 108, 162, 172, 2.00),
    ('dress-back', '42', 84, 66, 92, 158, 168, 1.90),
    ('dress-back', '46', 92, 74, 100, 160, 170, 2.10),
    ('dress-back', '48', 96, 78, 104, 161, 171, 2.25),
    ('dress-back', '50', 100, 82, 108, 162, 172, 2.40)
) as v(slug, label, bust, waist, hips, height_min, height_max, fabric_consumption_m)
join public.patterns p on p.slug = v.slug
on conflict (pattern_id, label) do update
  set bust = excluded.bust,
      waist = excluded.waist,
      hips = excluded.hips,
      height_min = excluded.height_min,
      height_max = excluded.height_max,
      fabric_consumption_m = excluded.fabric_consumption_m;

-- ─────────────────────────────── Параметры ────────────────────────────────

insert into public.pattern_params (pattern_id, code, title, "values")
select
  p.id,
  v.code::public.param_code,
  v.title,
  v.payload::jsonb
from (
  values
    ('dress-shirt', 'length', 'Длина', '[{"value":"midi","title":"Midi","available":true},{"value":"maxi","title":"Maxi","available":true}]'),
    ('dress-shirt', 'sleeve', 'Рукав', '[{"value":"short","title":"Короткий","available":true},{"value":"long","title":"Длинный","available":true}]'),
    ('skirt-slit', 'length', 'Длина', '[{"value":"mini","title":"Mini","available":true},{"value":"midi","title":"Midi","available":true}]'),
    ('trousers-palazzo', 'fit', 'Посадка', '[{"value":"fitted","title":"По фигуре","available":true},{"value":"oversize","title":"Оверсайз","available":true}]'),
    ('top-puff', 'neckline', 'Вырез', '[{"value":"round","title":"Круглый","available":true},{"value":"v","title":"V-образный","available":true}]'),
    ('hoodie-oversize', 'length', 'Длина', '[{"value":"cropped","title":"Укороченная","available":true},{"value":"regular","title":"Стандартная","available":true}]'),
    ('hoodie-oversize', 'sleeve', 'Рукав', '[{"value":"short","title":"Короткий","available":true},{"value":"long","title":"Длинный","available":true}]'),
    ('slip-dress', 'length', 'Длина', '[{"value":"midi","title":"Midi","available":true},{"value":"maxi","title":"Maxi","available":true}]'),
    ('slip-dress', 'neckline', 'Вырез', '[{"value":"v","title":"V-образный","available":true},{"value":"boat","title":"Лодочка","available":false}]'),
    ('dress-back', 'length', 'Длина', '[{"value":"midi","title":"Midi","available":true},{"value":"maxi","title":"Maxi","available":true}]')
) as v(slug, code, title, payload)
join public.patterns p on p.slug = v.slug
on conflict (pattern_id, code) do update
  set title = excluded.title,
      "values" = excluded."values";

-- ─────────────────────────────── Файлы лекал ──────────────────────────────
-- Базовый файл на каждый размер: variant_key = none (FR-4.3, фолбэк).
-- Вариант-файлы (T-C02) добавляются по мере готовности PDF, например midi+short.

insert into public.pattern_files (pattern_id, size_id, variant_key, format, storage_path, pages)
select
  s.pattern_id,
  s.id,
  'none',
  'pdf_a4'::public.file_format,
  'patterns/' || p.slug || '/' || s.label || '/base.pdf',
  6
from public.pattern_sizes s
join public.patterns p on p.id = s.pattern_id
on conflict (pattern_id, size_id, variant_key, format) do update
  set storage_path = excluded.storage_path,
      pages = excluded.pages;

-- ─────────────────────────────── Промокод ─────────────────────────────────

insert into public.promo_codes (code, percent, max_uses, used_count, expires_at, active)
values ('SEWIT10', 10, 100, 0, '2027-01-01T00:00:00Z'::timestamptz, true)
on conflict (code) do update
  set percent = excluded.percent,
      max_uses = excluded.max_uses,
      expires_at = excluded.expires_at,
      active = excluded.active;

-- ─────────────────────── Тестовые пользователи (демо) ─────────────────────
-- Пароль у обоих: sewit-demo — ❗только для локальной разработки.
-- На боевой базе пароль админа другой: он задаётся
-- `scripts/rotate-demo-passwords.mjs` из DEMO_ADMIN_PASSWORD и хранится только
-- в `.env.local` (в git не попадает). Повторный запуск сида пароли не
-- перезаписывает: вставка идёт с `on conflict (id) do nothing`.
-- admin@sewit.example — роль admin, user@sewit.example — обычный покупатель.
-- Если версия GoTrue не примет прямую вставку, скрипт не упадёт: будет warning,
-- и пользователя можно создать через форму регистрации.

do $$
declare
  admin_id uuid := 'a0000000-0000-4000-8000-000000000001';
  buyer_id uuid := 'a0000000-0000-4000-8000-000000000002';
  demo_password text := 'sewit-demo';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@sewit.example',
      crypt(demo_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Администратор"}'::jsonb,
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      buyer_id,
      'authenticated',
      'authenticated',
      'user@sewit.example',
      crypt(demo_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Тестовый покупатель"}'::jsonb,
      now(),
      now()
    )
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  values
    (
      gen_random_uuid(),
      admin_id,
      admin_id::text,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@sewit.example'),
      'email',
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      buyer_id,
      buyer_id::text,
      jsonb_build_object('sub', buyer_id::text, 'email', 'user@sewit.example'),
      'email',
      now(),
      now(),
      now()
    )
  on conflict do nothing;

  insert into public.profiles (id, email, name, role)
  values
    (admin_id, 'admin@sewit.example', 'Администратор', 'admin'),
    (buyer_id, 'user@sewit.example', 'Тестовый покупатель', 'user')
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        role = excluded.role;
exception
  when others then
    raise warning 'Демо-пользователи не созданы (%): создайте их через форму регистрации', sqlerrm;
end $$;

-- GoTrue при входе ждёт в токен-колонках пустую строку, а не NULL: иначе логин
-- отвечает «Database error querying schema» (scan error: converting NULL to string).
-- Чиним уже созданные строки и страхуем повторный запуск сида.
-- https://supabase.com/docs/guides/troubleshooting/database-error-saving-new-user-RU_EwB
do $$
declare
  col text;
begin
  foreach col in array array[
    'confirmation_token', 'recovery_token', 'email_change_token_new', 'email_change'
  ] loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'auth' and table_name = 'users' and column_name = col
    ) then
      execute format(
        'update auth.users set %I = coalesce(%I, %L) where email in (%L, %L)',
        col, col, '', 'admin@sewit.example', 'user@sewit.example'
      );
    end if;
  end loop;
exception
  when others then
    raise warning 'Не удалось починить токены демо-пользователей: %', sqlerrm;
end $$;

-- Сообщаем PostgREST, что схема изменилась, — иначе первые запросы получат 404.
notify pgrst, 'reload schema';
