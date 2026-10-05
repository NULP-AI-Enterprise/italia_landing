# Переїзд на Vercel + Supabase

Покрокова інструкція: як перенести сайт `italia.thesis-i.com` з Kubernetes на Vercel (хостинг) і Supabase (PostgreSQL), разом з усім, що зібрано в адмінці: тексти, учасники, фото, заявки, адміністратори.

Код уже готовий до переїзду. Нижче лише те, що треба зробити руками в панелях Supabase, Vercel, пошти та DNS. Розраховано на 1–2 години, з них 15–30 хвилин адмінку не можна чіпати.

---

## Зміст

0. [Як це влаштовано](#0-як-це-влаштовано)
1. [Що знадобиться](#1-що-знадобиться)
2. [Порядок дій](#2-порядок-дій-важливо)
3. [Supabase: база даних](#3-supabase-база-даних)
4. [Перенесення даних з Kubernetes](#4-перенесення-даних-з-kubernetes)
5. [Пошта (SMTP)](#5-пошта-smtp)
6. [Капча Turnstile](#6-капча-turnstile)
7. [Vercel: проєкт і змінні](#7-vercel-проєкт-і-змінні)
8. [Перевірка на тимчасовій адресі](#8-перевірка-на-тимчасовій-адресі)
9. [Домен italia.thesis-i.com](#9-домен-italiathesis-icom)
10. [Після переїзду](#10-після-переїзду)
11. [Довідник змінних оточення](#11-довідник-змінних-оточення)
12. [Як тепер працюють деплої](#12-як-тепер-працюють-деплої)
13. [Якщо щось не так](#13-якщо-щось-не-так)

---

## 0. Як це влаштовано

```
Відвідувач ──► Vercel (Next.js, регіон fra1 — Франкфурт)
                 │  сторінки кешуються на годину, адмінка оновлює кеш одразу
                 │
                 ├──► Supabase PostgreSQL (eu-central-1 — Франкфурт)
                 │      таблиці: content_documents (тексти з адмінки),
                 │      media_files (завантажені фото), submissions (заявки),
                 │      admin_users, admin_sessions
                 │
                 └──► SMTP (Resend або інша пошта) — листи про заявки
```

- **Усі дані в PostgreSQL.** Фото з адмінки теж лежать у базі, тому окреме сховище файлів не потрібне.
- **Тексти в `/content/*.json` — стартовий вміст.** Те, що змінили в адмінці, лежить у базі й має пріоритет. Деплой правки з адмінки не перезаписує.
- **Що вже зроблено в коді для Vercel і Supabase:**
  - Підключення через пулер Supabase: одне з'єднання на функцію, без prepared statements.
  - Сайт розуміє і `DATABASE_URL`, і змінні, які додає інтеграція Supabase (`POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`). Зайві параметри на зразок `?supa=…` з рядка підключення прибираються.
  - Міграції застосовуються перед кожною продакшн-збіркою (`npm run vercel-build` → `scripts/migrate.mjs`), бажано через session pooler (`DATABASE_URL_UNPOOLED`).
  - **RLS (row-level security)** увімкнено на всіх таблицях (міграція `0003_enable_rls`). Публічний Data API Supabase не бачить жодного рядка: ні паролів адмінів, ні заявок. Сам сайт працює як власник таблиць, і RLS його не обмежує.
  - Preview-збірки (гілки, PR) ніколи не змінюють схему бази й не дописують у неї стартовий вміст.
  - `vercel.json`: регіон функцій `fra1` поруч із базою. Щоденний cron викликає `/api/health/db`, щоб безкоштовний проєкт Supabase не «засинав».
  - Великі фото в адмінці стискаються в браузері до заливки, бо Vercel не приймає запити понад 4.5 МБ.
  - Якщо збереження в адмінці зірвалось (деплой, зв'язок), набране не губиться: воно зберігається у вкладці браузера.
  - Листи надсилаються після відповіді відвідувачу (`after()`), а результат видно в CRM.

---

## 1. Що знадобиться

| Що | Навіщо | Хто має |
|---|---|---|
| Акаунт **Vercel** (бажано Team / Pro) | хостинг | — |
| Доступ Vercel до GitHub-організації `NULP-AI-Enterprise` | імпорт репозиторію | адмін організації на GitHub |
| Акаунт **Supabase** | база даних | — |
| `kubectl` з доступом до неймспейсу `italia-landing` | вивантажити поточні дані | той, хто має доступ до кластера |
| `psql` 16+ на своєму комп'ютері | завантажити дані в Supabase | див. нижче |
| Доступ до DNS домену `thesis-i.com` | перемкнути `italia.thesis-i.com` | власник домену |
| Поштовий сервіс: **Resend** (рекомендовано) або SMTP наявної пошти + доступ до DNS домену відправника | листи про заявки | — |
| Cloudflare (якщо капча Turnstile уже ввімкнена) | додати новий хост | — |

**Тарифи, коротко:**
- **Vercel Hobby** — лише для некомерційного особистого використання. Приватні репозиторії GitHub-організацій зазвичай вимагають **Pro**, $20 на місяць за учасника.
- **Supabase Free:**
  - 500 МБ бази, з запасом для цього сайту.
  - Проєкт призупиняється після тижня без запитів. Від цього захищає наш щоденний cron.
  - Резервних копій з відновленням з панелі немає. Вони є в **Pro**, $25 на місяць.
  - Для продакшну з заявками клієнтів бажано Pro або регулярний ручний бекап (розділ 10).

**Встановити `psql` на Mac** (Homebrew, без сервера PostgreSQL):

```bash
brew install libpq
```

```bash
echo 'export PATH="$(brew --prefix libpq)/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc && psql --version
```

---

## 2. Порядок дій (важливо)

Порядок має значення. Дані треба завантажити в Supabase **до першого деплою на Vercel**. Інакше сайт на першому запиті сам створить адміністратора і стартовий вміст, і вони конфліктуватимуть з перенесеними. Якщо так уже сталось, див. крок 4.4.

0. Закомітити й запушити поточний код у `main`: Vercel збирає саме його. Пуш запустить і звичний деплой у Kubernetes, він теж застосує нові міграції до старої бази. Це безпечно.
1. Supabase: створити проєкт, отримати два рядки підключення (розділ 3).
2. Створити таблиці в Supabase міграціями з репозиторію (4.2).
3. **Попередити менеджера:** нічого не зберігати в адмінці, доки не скажемо.
4. Вивантажити дані з Kubernetes і завантажити в Supabase (4.3–4.5). Записати час дампу.
5. Пошта й капча (розділи 5–6), можна заздалегідь.
6. Vercel: проєкт і змінні, деплой (розділ 7).
7. Перевірити на `*.vercel.app` (розділ 8).
8. Перемкнути DNS (розділ 9). Менеджер може працювати в адмінці на новому сайті.
9. Добрати заявки, що прийшли на старий сервер під час перемикання. Через день-два вимкнути Kubernetes (розділ 10).

---

## 3. Supabase: база даних

### 3.1. Створити проєкт

1. https://supabase.com/dashboard → **New project**.
2. **Name:** `miufi` (будь-яка назва).
3. **Database Password:** натисніть **Generate a password** і збережіть у менеджері паролів.
   - Бажано лише латинські літери й цифри.
   - Символи `@ # / ? % :` у паролі треба кодувати в рядку підключення (`@` → `%40` тощо), інакше підключення не спрацює.
4. **Region:** **Central EU (Frankfurt)** (`eu-central-1`). Функції Vercel теж будуть у Франкфурті (`fra1`), тож запит до бази займає кілька мілісекунд.
5. **Create new project**, зачекайте 1–2 хвилини.

### 3.2. Вимкнути публічний Data API

Сайт працює з базою напряму, а REST/GraphQL API Supabase йому не потрібен.

- **Project Settings → Data API** (у старішому інтерфейсі **Settings → API**) → вимкнути **Enable Data API**.

Навіть якщо API лишиться ввімкненим, RLS на всіх таблицях не віддасть через нього жодного рядка. Це другий рівень захисту.

### 3.3. Скопіювати рядки підключення

Кнопка **Connect** угорі сторінки проєкту → **Connection String** → тип **URI**. Потрібні два рядки:

| Змінна | Метод у Supabase | Порт | Для чого |
|---|---|---|---|
| `DATABASE_URL` | **Transaction pooler** | `6543` | сайт (багато коротких serverless-з'єднань) |
| `DATABASE_URL_UNPOOLED` | **Session pooler** | `5432` | міграції та перенесення даних |

Вигляд (хост і `project-ref` у вас свої):

```
postgresql://postgres.abcdefghijklmnop:ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
postgresql://postgres.abcdefghijklmnop:ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```

- Замініть `[YOUR-PASSWORD]` на пароль з 3.1 і **допишіть у кінці `?sslmode=require`**.
- Користувач для пулера має вигляд `postgres.<project-ref>`, з крапкою. Просто `postgres` не підійде.
- **Direct connection** (`db.<ref>.supabase.co`) не використовуйте: він працює лише через IPv6, а Vercel і більшість домашніх мереж його не мають.

Збережіть обидва рядки в локальний файл, який не потрапить у git (`.env*` уже в `.gitignore`):

```bash
cat > .env.supabase <<'EOF'
DATABASE_URL='postgresql://postgres.REF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require'
DATABASE_URL_UNPOOLED='postgresql://postgres.REF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require'
EOF
```

(Відкрийте файл і вставте справжні значення.) Далі в кожному новому терміналі:

```bash
set -a; source .env.supabase; set +a
```

Перевірка з'єднання:

```bash
psql "$DATABASE_URL_UNPOOLED" -c "select version();"
```

---

## 4. Перенесення даних з Kubernetes

### 4.1. Що переноситься

Усе з таблиць `public`:
- **`content_documents`:** усі правки з адмінки (тексти, учасники, партнери, події, команда), стан злиття стартового вмісту.
- **`media_files`:** завантажені фото.
- **`submissions`:** заявки з форм.
- **`admin_users`, `admin_sessions`:** адміністратори з тими самими паролями. Після перемикання DNS вхід навіть збережеться.

### 4.2. Створити таблиці в Supabase

З кореня репозиторію, з підвантаженим `.env.supabase`:

```bash
npm ci
```

```bash
npm run db:migrate
```

Очікувано: `migrate: database at aws-0-eu-central-1.pooler.supabase.com is up to date.` Таблиці створено, RLS увімкнено, історію міграцій записано в схему `drizzle`.

### 4.3. Вивантажити дані з Kubernetes

**Перед цим кроком менеджер не зберігає нічого в адмінці.** Запишіть час, наприклад `2026-10-06 10:00 UTC+3`, він знадобиться в розділі 10.

Лише дані (без схеми; схему вже створили міграції), тільки `public`:

```bash
kubectl -n italia-landing exec italia-landing-postgres-0 -- pg_dump -U miufi -d miufi --data-only --no-owner --no-privileges --schema=public > miufi-data.sql
```

Перевірка: файл не порожній, у ньому є `COPY` для всіх таблиць.

```bash
ls -lh miufi-data.sql && grep -c "^COPY public\." miufi-data.sql
```

Очікувано 5 (`admin_users`, `admin_sessions`, `content_documents`, `media_files`, `submissions`).

### 4.4. Завантажити дані в Supabase

**Увага:** команда спочатку очищає ці таблиці **в Supabase** (`$DATABASE_URL_UNPOOLED`), а потім заливає дамп. Так прибирається все, що сайт міг створити сам, якщо його вже запускали. Перевірте, що змінна вказує на Supabase (`echo $DATABASE_URL_UNPOOLED`), а не на іншу базу. Усе виконується однією транзакцією: при помилці не зміниться нічого.

```bash
psql "$DATABASE_URL_UNPOOLED" -v ON_ERROR_STOP=1 --single-transaction -c "TRUNCATE submissions, admin_sessions, admin_users, content_documents, media_files;" -f miufi-data.sql
```

### 4.5. Звірити кількість рядків

Supabase:

```bash
psql "$DATABASE_URL_UNPOOLED" -c "select (select count(*) from submissions) as submissions, (select count(*) from admin_users) as admins, (select count(*) from content_documents) as documents, (select count(*) from media_files) as media;"
```

Kubernetes (має збігтися):

```bash
kubectl -n italia-landing exec italia-landing-postgres-0 -- psql -U miufi -d miufi -c "select (select count(*) from submissions) as submissions, (select count(*) from admin_users) as admins, (select count(*) from content_documents) as documents, (select count(*) from media_files) as media;"
```

Після успіху дамп можна видалити (`rm miufi-data.sql`). У ньому заявки з персональними даними й хеші паролів, тож не надсилайте його в чати.

---

## 5. Пошта (SMTP)

Сайт надсилає:
- **«Зв'язатися»** (сторінка «Команда») — на e-mail того члена команди, якому пишуть. E-mail задається в адмінці: Команда → людина → e-mail. Якщо e-mail не задано, лист іде на `MAIL_TO`.
- **«Приєднатися»** — на `MAIL_TO`.
- `MAIL_BCC` (необов'язково) — прихована копія кожної заявки.

У листі поле «Відповісти» = відвідувач: відповідь піде йому напряму. Кожна заявка й без пошти зберігається в CRM (Адмінка → Заявки), а там видно, чи пішов лист і куди.

### Варіант А (рекомендовано): Resend

Безкоштовно 3 000 листів на місяць, 100 на день.

1. https://resend.com → зареєструватись.
2. **Domains → Add Domain:**
   - домен відправника: `madeinukraine.it`, якщо асоціація має доступ до його DNS; інакше `thesis-i.com`;
   - регіон **eu-west-1**.
3. Resend покаже 3 DNS-записи: MX і TXT (SPF) на піддомені `send`, TXT (DKIM) на `resend._domainkey`.
   - Додайте їх у DNS домену. Наявну пошту на домені вони не зачіпають.
   - Рекомендовано ще DMARC: TXT `_dmarc` → `v=DMARC1; p=none;`.
   - Натисніть **Verify** і зачекайте статусу **Verified** (від хвилин до кількох годин).
4. **API Keys → Create API Key:** permission **Sending access**, domain — ваш домен. Скопіюйте ключ `re_…`, він показується один раз.
5. Значення:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxxxxxx
MAIL_FROM=Made in Ukraine for Italy <site@madeinukraine.it>
MAIL_TO=<скринька асоціації для заявок>
MAIL_BCC=
```

`MAIL_FROM` має бути на **верифікованому** домені, інакше Resend відхилить лист.

### Варіант Б: Google Workspace / Gmail

1. В акаунті-відправнику увімкнути двоетапну перевірку.
2. https://myaccount.google.com/apppasswords → створити пароль застосунку.
3. Значення:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=site@ваш-домен
SMTP_PASS=<пароль застосунку, 16 символів>
MAIL_FROM=Made in Ukraine for Italy <site@ваш-домен>
```

Ліміт Workspace — близько 2 000 листів на день, для цього сайту з запасом.

### Варіант В: пошта хостингу домену

Візьміть у провайдера пошти домену `SMTP_HOST`, порт (465 = SSL або 587 = STARTTLS), логін і пароль скриньки. Сайт працює з будь-яким SMTP. Порт 25 на Vercel заблоковано, використовуйте 465 або 587.

---

## 6. Капча Turnstile

Якщо `TURNSTILE_SITE_KEY` і `TURNSTILE_SECRET_KEY` уже є в секреті Kubernetes:
1. Cloudflare → **Turnstile** → ваш віджет → **Hostname Management**.
2. Додайте `<проєкт>.vercel.app`, щоб працювало на тимчасовій адресі. `italia.thesis-i.com` уже там.
3. Ключі ті самі, перенесіть їх у Vercel.

Якщо капчі ще немає, можна пропустити: форма працює й без неї (є обмеження частоти за IP). Капча вмикається, лише коли задано обидва ключі.

---

## 7. Vercel: проєкт і змінні

### 7.1. Імпорт репозиторію

1. https://vercel.com/new → **Import Git Repository** → GitHub → `NULP-AI-Enterprise/italia_landing`.
   - Якщо організації немає в списку: **Adjust GitHub App Permissions** і дайте Vercel доступ до репозиторію. Може знадобитись схвалення адміна організації.
2. **Framework Preset:** Next.js (визначиться сам).
3. **Root Directory:** `./`.
4. **Build Command:** не змінювати. Vercel сам запускає скрипт `vercel-build` з `package.json`: міграції, потім `next build`.
5. **Не натискайте Deploy**, доки не додасте змінні (7.2). Якщо вже натиснули, нічого страшного: додайте змінні й зробіть **Redeploy**.

Регіон функцій (`fra1`) і cron задано в `vercel.json`, вручну нічого не потрібно. Перевірити: Settings → Functions → Function Region = Frankfurt. Node.js — версія за замовчуванням (22.x), Next.js 16 потребує 20.9+.

### 7.2. Змінні оточення

**Settings → Environment Variables.** Можна вставити все одразу: скопіюйте блок нижче в поле «Key» (Vercel розбере `.env`-формат), заповніть значення, середовище — **Production**. Для паролів і ключів увімкніть **Sensitive**.

```
DATABASE_URL=postgresql://postgres.REF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://postgres.REF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
SITE_URL=https://italia.thesis-i.com
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=Адміністратор
IP_HASH_SALT=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=
MAIL_FROM=Made in Ukraine for Italy <site@madeinukraine.it>
MAIL_TO=
MAIL_BCC=
```

- **`ADMIN_EMAIL` / `ADMIN_PASSWORD`** створюють адміністратора, **лише якщо в базі немає жодного**. Після перенесення адміни вже є (зі старими паролями), тож ці змінні — запасний варіант для порожньої бази. Зміна змінної пароль наявного адміна не змінює.
- **`IP_HASH_SALT`:** можна перенести зі старого секрету або згенерувати новий: `openssl rand -hex 32`.
- **Чому лише Production:** preview-збірки гілок не повинні працювати з продакшн-базою і слати листи. Без цих змінних preview показує стартовий вміст з `/content`, а адмінка там не працює, і так задумано. Якщо потрібні повноцінні preview, створіть окремий проєкт Supabase і задайте його змінні для **Preview**.
- **Інтеграція Supabase з Vercel Marketplace** (замість ручних змінних) теж підходить: код розуміє `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`. Але вона ставить змінні в усі середовища, тож preview матимуть доступ до продакшн-бази. Ручний спосіб надійніший.

Через CLI (альтернатива):

```bash
npx vercel link
```

```bash
npx vercel env add DATABASE_URL production
```

(і так для кожної змінної; значення вводиться інтерактивно, не потрапляє в історію shell).

**Не робіть `vercel env pull .env.local`**, інакше локальний `npm run dev` працюватиме з продакшн-базою. Для розробки `.env.local` без `DATABASE_URL` (вбудована PGlite) — так і має бути.

### 7.3. Деплой

**Deployments → Deploy / Redeploy.** У лозі збірки має бути рядок:

```
migrate: database at aws-0-eu-central-1.pooler.supabase.com is up to date.
```

---

## 8. Перевірка на тимчасовій адресі

Vercel дасть адресу на зразок `https://italia-landing-xxxx.vercel.app`. Пройдіть:

- [ ] `/uk`, `/it` відкриваються, тексти — ті, що були змінені в адмінці (не стартові з JSON).
- [ ] «Члени»: є всі учасники, Thesis-I закріплений, картка відкривається.
- [ ] Фото з адмінки відображаються (`/media/uploads/…`).
- [ ] `/admin` — вхід зі **старими** логіном і паролем.
- [ ] Адмінка: змінити будь-який текст → «Збережено» → видно на сайті → повернути як було.
- [ ] Адмінка: завантажити фото (у т. ч. велике з телефона) — завантажується.
- [ ] Адмінка → Заявки: старі заявки на місці.
- [ ] Форма «Приєднатися» з тестовими даними: заявка в CRM, лист прийшов на `MAIL_TO`, у заявці рядок «Лист: надіслано …». Тестову заявку потім позначте «Спам».
- [ ] «Команда» → «Зв'язатися» в людини з e-mail: лист прийшов їй.
- [ ] `https://…vercel.app/api/health/db` → `{"status":"ok","database":"ok",…}`.
- [ ] Settings → Cron Jobs: є `/api/health/db` щодня о 06:00 UTC.

Канонічні посилання вже вказують на `https://italia.thesis-i.com` (`SITE_URL`), тож тимчасова адреса не потрапить у пошук як дублікат.

---

## 9. Домен italia.thesis-i.com

1. **За день** (бажано) зменшіть TTL запису `italia` у DNS `thesis-i.com` до 300 секунд, щоб перемикання пройшло за хвилини.
2. Vercel → Settings → **Domains → Add** → `italia.thesis-i.com`.
3. Vercel покаже потрібний запис: **CNAME** `italia` → `cname.vercel-dns.com` (або адресу, яку покаже Vercel для проєкту).
4. У DNS `thesis-i.com` замініть поточний запис `italia` (A на кластер або CNAME) цим CNAME.
5. Зачекайте статусу **Valid Configuration**. SSL-сертифікат Vercel випустить сам за кілька хвилин.
6. Перевірте `https://italia.thesis-i.com` і вхід в адмінку. Після цього менеджер може знову працювати в адмінці.

Ingress і cert-manager у кластері для цього домену більше не потрібні. Їх приберемо разом з рештою (розділ 10).

---

## 10. Після переїзду

### 10.1. Добрати пізні заявки

Поки DNS оновлювався, частина відвідувачів ще потрапляла на старий сервер. Через добу після перемикання перевірте, чи прийшли туди заявки після часу дампу (4.3):

```bash
kubectl -n italia-landing exec italia-landing-postgres-0 -- psql -U miufi -d miufi -c "select id, kind, contact_name, created_at from submissions where created_at > '2026-10-06 10:00+03' order by created_at;"
```

Якщо є, перенесіть їх:

```bash
kubectl -n italia-landing exec italia-landing-postgres-0 -- psql -U miufi -d miufi -c "\copy (select id, kind, contact_name, company_name, phone, email, message, recipient_id, recipient_name, locale, status, note, ip_hash, user_agent, created_at, updated_at from submissions where created_at > '2026-10-06 10:00+03') to stdout with csv" > late-submissions.csv
```

```bash
psql "$DATABASE_URL_UNPOOLED" -c "\copy submissions (id, kind, contact_name, company_name, phone, email, message, recipient_id, recipient_name, locale, status, note, ip_hash, user_agent, created_at, updated_at) from 'late-submissions.csv' with csv"
```

```bash
rm late-submissions.csv
```

### 10.2. Вимкнути Kubernetes

Через 1–2 дні, коли все стабільно:

1. **ArgoCD:** вимкніть автосинхронізацію застосунку `italia-landing` або видаліть його. Інакше він поверне deployment.
2. **Зупиніть сайт** (база лишається як резервна копія):

```bash
kubectl -n italia-landing scale deployment italia-landing --replicas=0
```

3. **GitHub Actions:** вимкніть workflow збірки Docker-образу (Actions → `docker-build` → **Disable workflow**). Інакше кожен пуш збиратиме непотрібний образ і комітитиме `ci: pin image …`, а кожен такий коміт запускатиме ще один деплой на Vercel.
4. Через кілька тижнів, коли впевнені, що не повертатиметесь: видаліть StatefulSet PostgreSQL і його PVC. **Це назавжди**, тому спершу зробіть фінальний дамп у сховище.

Каталоги `k8s/`, `Dockerfile`, `.github/workflows/` можна лишити (код і далі вміє працювати в Docker) або прибрати окремим комітом.

### 10.3. Резервні копії

- **Supabase Pro:** щоденні бекапи з відновленням у панелі (Database → Backups).
- **Supabase Free:** робіть дамп вручну, наприклад раз на тиждень, і зберігайте в надійному місці (не в git):

```bash
pg_dump "$DATABASE_URL_UNPOOLED" --no-owner --no-privileges --schema=public --schema=drizzle -Fc -f "miufi-$(date +%F).dump"
```

Потрібен `pg_dump` тієї ж або новішої версії, ніж сервер Supabase (`brew install libpq` ставить актуальну).

---

## 11. Довідник змінних оточення

| Змінна | Обов'язкова | Звідки | Приклад / примітка |
|---|---|---|---|
| `DATABASE_URL` | так | Supabase → Connect → Transaction pooler (6543) | `postgresql://postgres.REF:PASS@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | бажано | Supabase → Connect → Session pooler (5432) | те саме, порт `5432`; для міграцій під час збірки |
| `SITE_URL` | бажано | — | `https://italia.thesis-i.com`; без неї береться продакшн-домен Vercel |
| `ADMIN_EMAIL` | для порожньої бази | — | створює першого адміна, лише якщо адмінів немає |
| `ADMIN_PASSWORD` | для порожньої бази | менеджер паролів | без кутових дужок і лапок навколо |
| `ADMIN_NAME` | ні | — | `Адміністратор` |
| `IP_HASH_SALT` | так | `openssl rand -hex 32` | сіль для хешу IP (обмеження частоти форм) |
| `TURNSTILE_SITE_KEY` | ні | Cloudflare Turnstile | капча вмикається лише з обома ключами |
| `TURNSTILE_SECRET_KEY` | ні | Cloudflare Turnstile | |
| `SMTP_HOST` | для листів | поштовий сервіс | `smtp.resend.com`; без неї листи не йдуть, заявки лише в CRM |
| `SMTP_PORT` | для листів | | `465` (SSL) або `587` (STARTTLS) |
| `SMTP_USER` | для листів | | `resend` / адреса скриньки |
| `SMTP_PASS` | для листів | | API-ключ Resend / пароль застосунку |
| `MAIL_FROM` | для листів | | `Made in Ukraine for Italy <site@madeinukraine.it>`, верифікований домен |
| `MAIL_TO` | для листів | | скринька асоціації: «Приєднатися» і «Зв'язатися» без e-mail |
| `MAIL_BCC` | ні | | копія кожної заявки |
| `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` | ні | інтеграція Supabase | використовуються, лише якщо немає `DATABASE_URL` / `DATABASE_URL_UNPOOLED` |

Vercel сам задає `VERCEL`, `VERCEL_ENV`, `VERCEL_PROJECT_PRODUCTION_URL`. Код ними користується, вручну задавати не треба.

**Безпека:**
- Секрети живуть лише у Vercel (Sensitive) і в менеджері паролів. Не в git, не в чатах.
- `.env.supabase` і `.env.local` у `.gitignore`. Після переїзду `.env.supabase` краще видалити.
- Якщо пароль бази засвітився: Supabase → Project Settings → Database → **Reset database password**, оновіть `DATABASE_URL*` у Vercel → Redeploy.

---

## 12. Як тепер працюють деплої

- **Пуш у `main`** → продакшн-деплой на Vercel (1–3 хвилини):
  - Спершу міграції, потім збірка.
  - Новий деплой вмикається миттєво, без простою.
  - Сторінка адмінки, відкрита до деплою, при збереженні попросить «Оновити сторінку». Набране при цьому не губиться.
- **Інші гілки та PR** → preview-адреса з стартовим вмістом. Базу preview не змінює (розділ 7.2).
- **Відкотитись:** Vercel → Deployments → попередній → **Instant Rollback**. Нові міграції в цьому проєкті лише додають колонки чи налаштування, тож старий код з новою базою працює.
- **Правки з адмінки** діють одразу й деплоєм не перезаписуються. Нові записи з `/content/*.json` (наприклад, новий учасник у коді) при деплої додаються до бази, а видалені в адмінці назад не повертаються.

---

## 13. Якщо щось не так

| Симптом | Причина | Що робити |
|---|---|---|
| Збірка падає на `migrate` з `password authentication failed` | неправильний пароль або не закодовані спецсимволи | скинути пароль у Supabase на буквено-цифровий, оновити змінні |
| `Tenant or user not found` | користувач `postgres` замість `postgres.<project-ref>` | скопіювати рядок саме з Transaction/Session pooler |
| `getaddrinfo ENOTFOUND db.….supabase.co` або таймаут | Direct connection (лише IPv6) | використовувати pooler-адреси `…pooler.supabase.com` |
| `unrecognized configuration parameter` | зайві параметри в URL | код прибирає `supa`, `pgbouncer` тощо; інші приберіть вручну, лишіть лише `?sslmode=require` |
| Сайт показує стартові тексти, а не з адмінки | немає `DATABASE_URL` у Production або база недоступна | Vercel → Logs: шукати `Content: the database is unavailable`; перевірити змінні → Redeploy |
| Не вдається увійти в адмінку | адмінів у базі немає, а `ADMIN_*` не задано; або перенесено інших адмінів | перевірити `select email from admin_users;`; якщо таблиця порожня — задати `ADMIN_*` → Redeploy → увійти |
| 4.4 падає з `duplicate key` | у таблицях уже є дані, а `TRUNCATE` не виконався | запускати команду 4.4 повністю, з `-c "TRUNCATE …"` |
| Листи не приходять | SMTP не задано, домен не верифіковано, неправильний `MAIL_FROM` | Адмінка → Заявки → заявка → рядок «Лист» показує помилку SMTP; Resend → Logs |
| Листи йдуть у спам | немає SPF/DKIM/DMARC | додати всі записи з Resend і DMARC (розділ 5) |
| Фото не завантажується (413) | файл понад 4.5 МБ після стиснення (напр., GIF) | зменшити файл або зберегти як JPG/WebP |
| Сайт повільний | функції не у Франкфурті | Settings → Functions → Region = `fra1` (задано в `vercel.json`) |
| Supabase «Project paused» | тиждень без запитів на Free | Restore project у панелі; перевірити Cron Jobs у Vercel |
