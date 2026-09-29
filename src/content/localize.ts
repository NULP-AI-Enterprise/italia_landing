import { locales, type Locale } from "@/i18n/config";

type LocalizedValue = Record<Locale, string>;

/** Replaces every { uk, it } object in T with a plain string. */
export type Localize<T> = T extends LocalizedValue
  ? string
  : T extends readonly (infer U)[]
    ? Localize<U>[]
    : T extends object
      ? { [K in keyof T]: Localize<T[K]> }
      : T;

function isLocalizedValue(value: object): value is LocalizedValue {
  const keys = Object.keys(value);
  return (
    keys.length === locales.length &&
    locales.every((locale) => typeof (value as Record<string, unknown>)[locale] === "string")
  );
}

/** Deep-resolves localized fields of validated content for one locale. */
export function localize<T>(value: T, locale: Locale): Localize<T> {
  if (Array.isArray(value)) {
    return value.map((item) => localize(item, locale)) as Localize<T>;
  }
  if (value && typeof value === "object") {
    if (isLocalizedValue(value)) return value[locale] as Localize<T>;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localize(item, locale)]),
    ) as Localize<T>;
  }
  return value as Localize<T>;
}
