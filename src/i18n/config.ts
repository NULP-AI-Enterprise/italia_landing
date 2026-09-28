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
