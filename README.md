# Made in Ukraine for Italy — website

Next.js 16 (App Router, TypeScript, CSS Modules), Ukrainian and Italian versions, statically generated.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static pages for every locale)
npm run lint
```

Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) to the production domain so canonical and hreflang links are absolute.

## Pages

| Route (`/uk`, `/it`) | Page | Content source |
|---|---|---|
| `/` | Home: hero, service cards (jump to details), join button, service details | `content/pages/home.json`, `content/services.json` |
| `/about` | Association: vision and mission, market entry, history | `content/pages/about.json` |
| `/team` | Team, grouped by leadership, departments, regions | `content/pages/team.json`, `content/team.json` |
| `/members` | Member directory: search by industry, name and region (maps) | `content/pages/members.json`, `content/members.json`, `industries.json`, `regions.json` |
| `/partners` | Partners in three groups | `content/pages/partners.json`, `content/partners.json` |
| `/events` | Events calendar by year | `content/pages/events.json`, `content/events.json` |
| `/ukraine-italy` | Article: economic cooperation | `content/pages/ukraine-italy.json` |
| `/join` | Placeholder until the join form exists | interface strings |

## Architecture

```
content/                    # everything an editor may change (JSON, both languages side by side)
public/media/               # images referenced from content ("/media/…")
src/
  proxy.ts                  # "/" and paths without a locale -> /uk or /it (cookie, then Accept-Language)
  content/
    schema.ts               # zod schemas = the content model (also usable for admin forms / API validation)
    repository.ts           # async read API: getPage, getServices, getTeam, getMembersDirectory, …
    localize.ts             # turns { uk, it } fields into strings for one locale
  config/site-pages.ts      # list of pages used by header and footer menus
  i18n/                     # locales, interface strings (buttons, labels, a11y texts), hreflang helpers
  app/[lang]/               # routes; pages only call the repository and render components
  components/               # layout/, ui/, home/, about/, team/, members/, partners/, events/, article/
static-prototype/           # first static HTML version, kept for reference
```

### Content model

- Translatable fields are objects `{ "uk": "…", "it": "…" }`. Company names and official event names are plain strings.
- Inline emphasis: `<b>…</b>` and `<i>…</i>`. Line breaks in titles: `\n`.
- Images: `{ "src": "/media/…", "width": …, "height": …, "alt": { "uk": "…", "it": "…" } }`. Leave `alt` out only for purely decorative images.
- Collections have `id` (kebab-case), `order` and `published`, which is what an admin list/table needs.
- Every JSON file is validated at build time. A typo, a missing translation, an unknown industry id or a duplicate id fails the build with a readable message instead of breaking the site.

### Connecting an admin panel

Pages never read JSON directly — only `src/content/repository.ts` does. To move to an admin:

1. **Git-based CMS** (Keystatic, Decap, TinaCMS): point it at the `content/` folder; the files and the schema stay as they are.
2. **Database / headless CMS** (Payload, Strapi, Supabase…): reimplement the functions in `repository.ts` to fetch from the API and keep validating with the same zod schemas. Components and pages do not change.

Interface strings (buttons, form labels, screen-reader texts) stay in `src/i18n/dictionaries/*.ts` because they belong to the code, not to editors.

## Accessibility (WCAG 2.2 AA)

Checked with axe-core on every page in both languages: no violations. Built in:

- One `h1` per page, ordered headings, landmarks (`header`, `nav` with names, `main`, `footer`), skip link.
- Text contrast of at least 4.5:1: dark text on the orange buttons, a darker amber for eyebrow labels.
- Visible focus on every control; touch targets at least 44 px; no horizontal scrolling at 320 px.
- The language switcher keeps its visible code in the accessible name (WCAG 2.5.3), and links carry `lang` and `hreflang`.
- Links to other sites say "opens in a new tab", visually and for screen readers.
- Member directory: real `<label>`s, `fieldset`/`legend`, toggle buttons with `aria-pressed`, a status message for the result count, and an empty state. The region `<select>` is the accessible equivalent of the clickable maps.
- Animations respect `prefers-reduced-motion`; revealed content stays readable to screen readers and appears as soon as it receives keyboard focus.
- Text is left-aligned rather than justified, for readability.

## Sources and licences

- Photos and texts: the association's PDF mock-ups. The history photos and Thesis-I images are small; replace them in `public/media/` with originals under the same names.
- Region maps: Natural Earth 1:10m admin-1 boundaries (public domain), simplified. Crimea and Sevastopol are drawn as part of Ukraine.
