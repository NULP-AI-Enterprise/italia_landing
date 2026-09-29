export const locales = ["uk", "it"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

/** Cookie that remembers the language a visitor picked in the switcher. */
export const localeCookie = "NEXT_LOCALE";

export const localeLabels: Record<Locale, string> = {
  uk: "UA",
  it: "IT",
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/**
 * Codes people type or see that mean a supported locale. "UA" is the label in
 * the language switcher (country code), while the language code is "uk".
 */
const localeAliases: Record<string, Locale> = {
  ua: "uk",
};

/** Any 2-letter language code, optionally with a region: "en", "uk-UA", "it_IT". */
export const looksLikeLocale = (value: string) => /^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(value);

/** "UK", "uk-UA", "ua", "it-IT" -> supported locale; anything else -> null. */
export function resolveLocale(value: string): Locale | null {
  const base = value.toLowerCase().split(/[-_]/)[0];
  if (hasLocale(base)) return base;
  return localeAliases[base] ?? null;
}

/**
 * Builds a locale-prefixed path: localePath("it", "/about") -> "/it/about".
 * Hash-only suffixes are kept on the home page: localePath("uk", "/#services") -> "/uk#services".
 */
export function localePath(locale: Locale, path = "/"): string {
  if (path === "/" || path === "") return `/${locale}`;
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Replaces the locale segment of a pathname, keeping the rest of the route. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/");
  if (segments[1] && hasLocale(segments[1])) {
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  }
  return localePath(target, pathname);
}
