import type { Metadata } from "next";
import { defaultLocale, localePath, locales, type Locale } from "./config";

/** Canonical + hreflang links for a page that exists in every locale. */
export function localeAlternates(locale: Locale, path = "/"): Metadata["alternates"] {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])),
      "x-default": localePath(defaultLocale, path),
    },
  };
}
