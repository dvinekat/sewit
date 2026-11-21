# SewIt — runbook деплоя на free tier

**Документ:** runbook · **Версия:** 1.1 · **Дата:** 21.11.2026
**Статус:** ✅ approved · **Связанные документы:** [README.md](../README.md) (8.4, 8.5, 12), [tasks.MD](tasks.MD) (T-47, 7.2), [architecture.md](architecture.md)

---

## 1. Контекст

Деплой MVP стоит **0 ₽**: Supabase Free + Vercel Hobby, карта не нужна.

**Текущий прод:** https://sewit.vercel.app (Vercel Hobby, проект `sewit`, ветка `main`) · **Код:** https://github.com/dvinekat/sewit (публичный).

❗Ссылку преподавателю и в README даём только как `https://sewit.vercel.app`. У каждой сборки есть свой адрес вида `https://sewit-<hash>-dvinekat.vercel.app` — он одноразовый и закрыт Vercel Authentication (для посторонних 401), делиться им нельзя.

Две части живут раздельно и обновляются независимо:

| Часть | Где | Что обновляет |
|---|---|---|
| База, Auth, Storage | Supabase (free) | админка на живом сайте, миграции, загрузка PDF/фото/GLB |
| Фронтенд | Vercel (Hobby) | `git push` в `main` → автодеплой |

❗Базу **не нужно создавать заново**: у проекта уже есть hosted-проект Supabase, где применены миграции, загружен сид, лежат демо-PDF и проверен RLS (см. раздел 6). Отдельный `sewit-prod` нужен только если хочется изолировать демо от текущих данных.

---

## 2. Переменные окружения

Значения берутся из локального `.env.local` (в git не попадают). В Vercel → Project → Settings → Environment Variables:

| Переменная | Значение | Окружения |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon-ключ | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | service role, пометить **Sensitive** | Production, Preview |
| `DOWNLOAD_URL_TTL_SECONDS` | `600` | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | `https://<project>.vercel.app` или свой домен | Production |

❗`NEXT_PUBLIC_*` вшиваются в сборку: после изменения любой из них нужен **Redeploy**, иначе на сайте останутся старые значения.

`SUPABASE_ACCESS_TOKEN` и `SUPABASE_PROJECT_REF` в Vercel **не задаются** — они нужны только для `supabase link` / `db push` локально и в CI.

---

## 3. Первый деплой (Vercel Hobby)

1. Зарегистрироваться на vercel.com через GitHub (Free/Hobby, карта не требуется).
2. **Add New → Project → Import Git Repository** → `dvinekat/sewit` (Vercel попросит доступ к репозиторию — приватный тоже поддерживается).
3. Framework Preset определится как **Next.js**; Install Command и Build Command оставить автоматическими (`pnpm install --frozen-lockfile`, `pnpm build`), Node.js — 22 (совпадает с `.nvmrc`).
4. Добавить env из раздела 2. `NEXT_PUBLIC_SITE_URL` на этом шаге можно поставить временно — правильный домен станет известен после первого билда.
5. **Deploy**. Первая сборка занимает 2–4 минуты.
6. Скопировать выданный домен (`https://sewit-*.vercel.app`), обновить `NEXT_PUBLIC_SITE_URL`, нажать **Redeploy**.

---

## 4. Проверка после деплоя

Быстрые проверки без браузера:

```powershell
$site = "https://<project>.vercel.app"
(Invoke-WebRequest "$site/" -UseBasicParsing).StatusCode                  # 200
(Invoke-WebRequest "$site/catalog" -UseBasicParsing).StatusCode           # 200
(Invoke-WebRequest "$site/patterns/dress-shirt" -UseBasicParsing).Content # есть «3D-просмотр»
(Invoke-WebRequest "$site/sitemap.xml" -UseBasicParsing).Content          # домен верный, не localhost
(Invoke-WebRequest "$site/admin" -MaximumRedirection 0 -UseBasicParsing)  # 307 на /login
```

Сценарные проверки (README 12, 13):

- [ ] Вход админом `admin@sewit.example` с паролем `DEMO_ADMIN_PASSWORD` из `.env.local` (не `sewit-demo`), публикация черновика (в сиде есть `dress-back`) → выкройка видна в каталоге.
- [ ] Вход покупателем `user@sewit.example` / `sewit-demo`, демо-покупка с промокодом `SEWIT10` → заказ и библиотека.
- [ ] PDF из библиотеки скачивается и открывается; прямая ссылка без сессии — 401.
- [ ] 3D на карточке платья-рубашки открывается.
- [ ] Мобильная вёрстка 360 px и десктоп 1440 px без горизонтального скролла.
- [ ] `scripts/check-rls.sql` прогнан на боевой базе: аноним не видит черновики, заказы и файлы лекал.

---

## 5. Жизненный цикл после запуска

| Что меняем | Действие | Когда видно |
|---|---|---|
| Код | `git push` в `main` | автодеплой 1–2 мин |
| Контент (выкройки, цены, категории, промокоды, загрузки) | админка на живом сайте | сразу (`revalidatePath` в админ-экшенах) |
| Env | Vercel → Environment Variables → Redeploy | после передеплоя |
| Схема БД | миграция в `supabase/migrations` → `supabase db push` | после пуша; приложение передеплоится отдельно |

Откат: Vercel → Deployments → **Instant Rollback** на прошлую сборку. Миграции БД откату не подлежат — только вперёд (README 8.5).

---

## 6. Free tier: лимиты и риски

| Риск | Что делать |
|---|---|
| Supabase усыпляет free-проект после недели простоя | разбудить в дашборде за день до показа, прогнать смоук |
| Supabase пауза/лимит egress в момент защиты | держать резерв данных и уметь показать локально (`pnpm dev`) |
| Vercel Hobby: ~100 деплоев в день | для правок хватает с запасом |
| Превью-деплой на PR | проверять изменения по preview-ссылке до мержа в `main` |

### 6.1 Пробуждение проекта и резерв демо-данных

Supabase Free ставит проект на паузу после ~7 дней без запросов: сайт и вход начинают отвечать ошибкой, но данные не удаляются — восстановление доступно в течение года.

**Разбудить проект:**

1. Открыть [дашборд](https://supabase.com/dashboard/project/uzesfoapakxavemcdrkf), выбрать организацию и проект `uzesfoapakxavemcdrkf`.
2. Нажать **Resume project** и подтвердить: проект возвращается в состояние до паузы — данные, настройки, бакеты.
3. Дождаться статуса Active (обычно 1–5 минут) и открыть https://sewit.vercel.app/catalog: шесть выкроек означают, что база отвечает.

Вместо дашборда можно вызвать Management API (нужен `SUPABASE_ACCESS_TOKEN`):

```powershell
curl.exe -X POST "https://api.supabase.com/v1/projects/uzesfoapakxavemcdrkf/restore" `
  -H "Authorization: Bearer $env:SUPABASE_ACCESS_TOKEN"

curl.exe "https://api.supabase.com/v1/projects/uzesfoapakxavemcdrkf/health" `
  -H "Authorization: Bearer $env:SUPABASE_ACCESS_TOKEN"
```

`restore` отвечает 200, `health` — пока не вернёт `"healthy": true`.

**Снять свежий резерв:**

```powershell
node --env-file=.env.local scripts/backup-demo-data.mjs
```

Скрипт читает `NEXT_PUBLIC_SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` из `.env.local`, выгружает 14 публичных таблиц (`patterns`, `pattern_files`, `orders`, `entitlements`, `download_log`, …) и кладёт по JSON-файлу на таблицу плюс `manifest.json` со счётчиками в `.cache/backups/<YYYY-MM-DD_HH-mm>/` (время UTC). Каталог в git не попадает.

Что резерв не покрывает: `auth.users`, определения схемы и RLS, объекты Storage (PDF, обложки, `.glb`). Это резерв контента и заказов, а не замена полному дампу; полный дамп — только при Docker и Supabase CLI:

```powershell
supabase db dump -f sewit-demo.sql
```

Когда снимать: за день до показа, за час до показа (сразу после пробуждения) и после массовых правок в админке.

### 6.2 Пароли демо-пользователей

`seed.sql` лежит в публичном репозитории, поэтому его пароль (`sewit-demo`) — только для локальной разработки. На боевой базе пароль админа другой:

```powershell
node --env-file=.env.local scripts/rotate-demo-passwords.mjs
```

Скрипт берёт `DEMO_ADMIN_PASSWORD` из `.env.local` (в git не попадает), обновляет пользователя через Admin API и проверяет, что новый пароль работает, а `sewit-demo` — уже нет. Запускать после каждого `db reset`/`db push` с сидом на боевой базе и при подозрении на утечку.

Пароль покупателя `user@sewit.example / sewit-demo` остаётся публичным осознанно: это демо-доступ для сценария покупки, данные ненастоящие. Если начнут мусорить заказами — задать `DEMO_BUYER_PASSWORD` и повторить запуск скрипта.

**Передача доступа проверяющему.** Покупатель: `user@sewit.example` / `sewit-demo` — публичный демо-доступ, он указан в README. Админ: `admin@sewit.example` + пароль из `.env.local` (`DEMO_ADMIN_PASSWORD`); передавать лично (почта или мессенджер), не добавлять в README и не коммитить. Если пароль забыт — посмотреть `.env.local`, а если его там нет — задать новый и прогнать скрипт выше: он обновит пользователя через Admin API и проверит вход. Альтернатива — Supabase Dashboard → Authentication → Users → сброс пароля.


---

## 7. Открытые вопросы

1. Оставляем текущий hosted-проект Supabase боевым или заводим отдельный `sewit-prod`? Для учебного MVP достаточно текущего: данные и демо уже там.
2. Нужен ли кастомный домен — нет, `*.vercel.app` бесплатен и достаточен для сдачи.
3. Делать ли репозиторий публичным: не требуется для Vercel, но нужно, если преподаватель будет смотреть код без приглашения.
