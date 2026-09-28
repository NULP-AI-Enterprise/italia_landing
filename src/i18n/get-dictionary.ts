import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/uk";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  uk: () => import("./dictionaries/uk").then((module) => module.uk),
  it: () => import("./dictionaries/it").then((module) => module.it),
};

/** Resolves the current locale from the `[lang]` root segment. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

/** Loads the dictionary for the current locale (server only). */
export async function getDictionary() {
  return dictionaries[await getLocale()]();
}

export type { Dictionary } from "./dictionaries/uk";
