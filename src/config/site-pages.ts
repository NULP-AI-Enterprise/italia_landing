import type { Dictionary } from "@/i18n/dictionaries/uk";

export type SitePageKey = keyof Dictionary["nav"];

type SitePage = {
  key: SitePageKey;
  /** Path without the locale prefix. */
  path: string;
  /** Shown in the header menu (the design lists the five main sections). */
  inHeader: boolean;
};

/** Every public page of the site, in menu order. */
export const sitePages = [
  { key: "home", path: "/", inHeader: true },
  { key: "about", path: "/about", inHeader: true },
  { key: "team", path: "/team", inHeader: true },
  { key: "members", path: "/members", inHeader: true },
  { key: "partners", path: "/partners", inHeader: true },
  { key: "ukraineItaly", path: "/ukraine-italy", inHeader: false },
  { key: "events", path: "/events", inHeader: false },
  { key: "join", path: "/join", inHeader: false },
] as const satisfies readonly SitePage[];
