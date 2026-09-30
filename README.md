# Made in Ukraine for Italy — website

Next.js 16 (App Router, TypeScript, CSS Modules), Ukrainian and Italian versions. Public pages are statically generated; the contact forms write to PostgreSQL and are handled in a small CRM at `/admin`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (pages render on first visit, then stay cached)
npm run lint
```

**Admin panel:** http://localhost:3000/admin (production: `https://<domain>/admin`). Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment: the first administrator is created from them when the database has none. Locally they are in `.env.local`.

Copy `.env.example` to `.env.local` and fill it in. Locally `DATABASE_URL` can stay empty: the dev server then uses an embedded PostgreSQL (PGlite) in `.data/`. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to get the first administrator.

| Variable | Needed | Purpose |
|---|---|---|
| `SITE_URL` | production | Absolute canonical and hreflang links; read at request time (set in `k8s/deployment.yaml`) |
| `DATABASE_URL` | production | PostgreSQL connection string. The site refuses to start the forms in production without it |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | first start | Creates the first administrator when the table is empty; changing them later does nothing |
| `IP_HASH_SALT` | production | Salt for hashing visitor IPs (rate limit); IPs are never stored in clear |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | optional | Cloudflare Turnstile captcha on the forms; on only when both are set |

In Kubernetes these come from the secret `italia-landing-secret` (`envFrom` in `k8s/deployment.yaml`, optional so the pod still starts without it).

## Pages

| Route (`/uk`, `/it`) | Page | Content source |
|---|---|---|
| `/` | Home: hero, service cards (jump to details), join button, service details | `content/pages/home.json`, `content/services.json` |
| `/about` | Association (Візія): intro with photo, export sectors, history, closing | `content/pages/about.json` |
| `/team` | Team, grouped by leadership, departments, regions | `content/pages/team.json`, `content/team.json` |
| `/members` | Member directory: industry drop-down, name search, region (Ukraine/Italy map); a result opens the profile card | `content/pages/members.json`, `content/members.json`, `industries.json`, `regions.json` |
| `/partners` | Partners of the association | `content/pages/partners.json`, `content/partners.json` (`category: association`) |
| `/rebuild-ukraine-better` | Rebuild Ukraine Better participants | `content/pages/rebuild-ukraine-better.json`, `content/partners.json` (`category: rebuild`) |
| `/institutional-partners` | Institutional partner organizations | `content/pages/institutional-partners.json`, `content/partners.json` (`category: institutional`) |
| `/events` | Calendar: date-range filter and sort direction (kept in the URL), grouped by year | `content/pages/events.json`, `content/events.json` |
| `/ukraine-italy` | Article: economic cooperation (linked from the Association page, not in the menu) | `content/pages/ukraine-italy.json` |
| `/join` | The join form as a page; `?to=<team id>` turns it into a message to that person. Without JavaScript every "Приєднатися" / "Зв’язатися" button leads here | interface strings |

The menu has exactly the eight pages from the design: Головна, Асоціація, Команда, Члени, Партнери (a drop-down with the three partner pages) and Календар. "Приєднатися" is a button, not a page in the menu.

## Architecture

```
content/                    # everything an editor may change (JSON, both languages side by side)
public/media/               # images referenced from content ("/media/…")
src/
  proxy.ts                  # "/" and paths without a locale -> /uk or /it (cookie, then Accept-Language)
  content/
    schema.ts               # zod schemas = the content model (validates JSON, database rows and admin saves)
    registry.ts             # every editable document: title, schema, id field, list columns
    store.ts                # loads content: database rows over the bundled JSON, validated
    repository.ts           # async read API for pages: getPage, getServices, getTeam, getMembersDirectory, …
    form-model.ts           # turns schemas into admin form fields; empty values, errors, slugs
    localize.ts             # turns { uk, it } fields into strings for one locale
  config/navigation.ts      # menu model shared by header and footer: pages only, named as in the design
  i18n/                     # locales, interface strings (buttons, labels, a11y texts), hreflang helpers
  app/[lang]/               # routes; pages only call the repository and render components
  app/admin/                # CRM: login, submissions, content editor (own root layout, noindex)
  app/media/uploads/        # images uploaded in the admin panel (served from the database)
  server/
    db/                     # Drizzle schema and client (PostgreSQL, or PGlite in development)
    auth/                   # scrypt password hashes, session cookie
    actions/submit-form.ts  # server action behind every contact form
    submissions.ts          # queries used by the CRM
  components/               # layout/, ui/, forms/, home/, about/, team/, members/, partners/, events/, article/
drizzle/                    # SQL migrations (generated), applied automatically on first database use
static-prototype/           # first static HTML version, kept for reference
```

### Content model

- Translatable fields are objects `{ "uk": "…", "it": "…" }`. Company names and official event names are plain strings.
- Inline emphasis: `<b>…</b>` and `<i>…</i>`. Line breaks in titles: `\n`.
- Images: `{ "src": "/media/…", "width": …, "height": …, "alt": { "uk": "…", "it": "…" } }`. Leave `alt` out only for purely decorative images.
- Partners and events are shown as link previews, as in the design. Optional `image` plus `imageLayout`: `"cover"` (wide picture on top) or `"thumb"` (logo on the left). Without `image` the card is text only. With `website` the whole card opens that site in a new tab.
- Partners are laid out in two columns: items alternate left, right, left… in `order`.
- Collections have `id` (kebab-case), `order` and `published`.

### Editing content in the admin panel

Everything in `content/` is editable at **/admin → Контент сайту**: the pages (headers, texts, SEO), the home page mini-articles, team, members, industries, region names, partners and events.

- **Storage.** A saved document goes to the table `content_documents` (one row per collection or page, key as in `src/content/registry.ts`). Anything never saved is read from the JSON in `content/`, which is the starting point of a fresh database. The JSON files are therefore not updated by the admin panel.
- **Validation.** The admin forms are generated from the zod schemas in `src/content/schema.ts`: a new field in the schema appears in the form. Every save is validated with the same schema, plus checks across collections (unique ids, a member may only use existing industries and regions, an industry in use cannot be deleted). A broken row can never break the site: it is logged and the bundled JSON is shown instead.
- **Publishing.** Pages are not built ahead of time: each page is rendered on its first visit and cached. A save calls `revalidatePath("/", "layout")`, so changes are live at once; pages also refresh every hour as a safety net. This relies on one replica (see `k8s/deployment.yaml`); with several replicas use a shared cache handler.
- **Images.** Uploads are re-encoded with sharp (upright, at most 2400 px, WebP) and stored in the table `media_files`, served from `/media/uploads/<id>.webp`. They survive redeploys because they live in PostgreSQL, not in the container.
- **Labels.** Field names and hints shown to editors are in `src/content/field-labels.ts`; list titles and descriptions in `src/content/registry.ts`.

Interface strings (buttons, form labels, screen-reader texts) and the menu names stay in `src/i18n/dictionaries/*.ts`: they belong to the code, and the page names follow the design.

## Forms and CRM

Every "Приєднатися" button opens the join form in a dialog; "Зв’язатися" on the team page opens the same form addressed to that person. Both post to the server action `submitForm`:

1. Spam checks: a hidden honeypot field, a minimum fill time, an optional Turnstile captcha, and at most 5 submissions per 10 minutes from one (hashed) IP.
2. Validation with zod; errors come back per field and are shown inline, focus moves to the first invalid field.
3. The submission is stored in the `submissions` table with its kind (join / contact), the addressee, the page language and status `new`.

The CRM at `/admin` (sign in with an administrator account) lists submissions with status tabs and counts, text search and a kind filter. A submission page shows the full message, lets you change the status (new, in progress, done, spam), keep an internal note, or delete it.

Database changes: edit `src/server/db/schema.ts`, then run `npx drizzle-kit generate` and commit the new file in `drizzle/`. Migrations run on the next start.

## Accessibility (WCAG 2.2 AA)

Checked with axe-core on every page in both languages: no violations. Built in:

- One `h1` per page, ordered headings, landmarks (`header`, `nav` with names, `main`, `footer`), skip link.
- Text contrast of at least 4.5:1: dark text on the orange buttons, a darker amber for eyebrow labels.
- Visible focus on every control; touch targets at least 44 px; no horizontal scrolling at 320 px.
- The language switcher keeps its visible code in the accessible name (WCAG 2.5.3), and links carry `lang` and `hreflang`.
- Links to other sites say "opens in a new tab", visually and for screen readers.
- Member directory and calendar: real `<label>`s, `fieldset`/`legend`, native radio buttons for the country and the sort direction, a status message for the result count, and an empty state. The region `<select>` is the accessible equivalent of the clickable map; the profile opens in a native modal `<dialog>`.
- Forms: visible labels, required fields marked in text, inline errors linked with `aria-describedby`, an error summary, and focus management in the dialog (focus goes to the first field and returns to the button on close).
- Link-preview cards: the title is the link and stretches over the card, so a screen reader hears only the name and "opens in a new tab".
- Animations respect `prefers-reduced-motion`; revealed content stays readable to screen readers and appears as soon as it receives keyboard focus.
- Long text is justified only on wide screens (as in the design) with hyphenation, and left-aligned on phones.

## Sources and licences

- Photos and texts: the association's PDF mock-ups. Partner and event previews are cropped from the link previews in the mock-ups (`public/media/partners/`, `public/media/events/`). The history photos and Thesis-I images are small; replace them in `public/media/` with originals under the same names.
- Region maps: Natural Earth 1:10m admin-1 boundaries (public domain), simplified. Crimea and Sevastopol are drawn as part of Ukraine.
