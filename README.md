# Made in Ukraine for Italy — website

Next.js 16 (App Router, TypeScript, CSS Modules) with Ukrainian and Italian versions.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static pages for every locale)
npm run lint
```

Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) to the production domain so canonical and hreflang links are absolute.

## Structure

```
src/
  proxy.ts                  # "/" and paths without a locale -> /uk or /it (cookie, then Accept-Language)
  app/
    globals.css             # design tokens, base styles, shared classes (.container, .eyebrow, .btn, …)
    [lang]/
      layout.tsx            # root layout: fonts, <html lang>, header, footer
      page.tsx              # home
      about/page.tsx        # about
      publications/ members/ join/   # "coming soon" placeholders
      not-found.tsx         # localized 404
      [...rest]/page.tsx    # sends unknown paths to the localized 404
  i18n/
    config.ts               # locales, default locale, path helpers
    dictionaries/uk.ts      # source of truth for all copy (defines the Dictionary type)
    dictionaries/it.ts      # Italian copy, typed against uk.ts
    get-dictionary.ts       # getLocale() / getDictionary() via next/root-params
    alternates.ts           # canonical + hreflang metadata
  components/
    layout/                 # SiteHeader, LanguageSwitcher, SiteFooter
    home/                   # HomeHero, Services, JoinBanner
    about/                  # AboutHero, Intro, MarketEntry, History
    ui/                     # Reveal, RichText, StatusPage, ComingSoon
  assets/images/            # photos and logo (imported statically by next/image)
static-prototype/           # first static HTML version, kept for reference
```

## Common tasks

- **Edit copy:** change `src/i18n/dictionaries/uk.ts` and `it.ts`. Inline emphasis uses `<b>…</b>` and `<i>…</i>`.
- **Add a page:** create `src/app/[lang]/<slug>/page.tsx`, add its strings to both dictionaries, and link it with `localePath(locale, "/<slug>")`.
- **Add a language:** add the code to `locales` in `src/i18n/config.ts`, create `dictionaries/<code>.ts` typed as `Dictionary`, register it in `get-dictionary.ts`, and add a label and flag in the language switcher.

## Assets

- Photos come from the reference PDF (screenshots of the current site), so several are low resolution. Replace them with originals in `src/assets/images/` using the same file names.
- `italy-landscape.jpg`: "Discovering the heart of Chianti with Outdoor Recreation", Wikimedia Commons, public domain.
