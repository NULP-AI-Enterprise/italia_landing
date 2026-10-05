import type { MetadataRoute } from "next";
import { pagePaths } from "@/config/navigation";
import { siteUrl } from "@/config/site-url";
import { defaultLocale, localePath, locales } from "@/i18n/config";

export const dynamic = "force-dynamic";

/** Every page in both languages, each with its hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const absolute = (path: string) => new URL(path, base).toString();

  return locales.flatMap((locale) =>
    Object.values(pagePaths).map((path) => ({
      url: absolute(localePath(locale, path)),
      changeFrequency: path === pagePaths.events || path === pagePaths.members ? "weekly" : "monthly",
      priority: path === pagePaths.home ? 1 : 0.7,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((other) => [other, absolute(localePath(other, path))])),
          "x-default": absolute(localePath(defaultLocale, path)),
        },
      },
    })),
  );
}
