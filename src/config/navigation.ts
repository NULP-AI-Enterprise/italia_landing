import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uk";

/** Every page of the site, path without the locale prefix. */
export const pagePaths = {
  home: "/",
  about: "/about",
  team: "/team",
  members: "/members",
  partners: "/partners",
  rebuild: "/rebuild-ukraine-better",
  institutional: "/institutional-partners",
  ukraineItaly: "/ukraine-italy",
  events: "/events",
  join: "/join",
} as const;

export type PageKey = keyof typeof pagePaths;

export type NavItem = { href: string; label: string };

/** A menu entry is either a page link or a drop-down of related pages. */
export type NavEntry =
  | ({ type: "link" } & NavItem)
  | { type: "group"; id: string; label: string; items: NavItem[] };

export type Navigation = {
  home: NavItem;
  /** Header menu, in design order. Only pages, named as in the design. */
  entries: NavEntry[];
  join: NavItem;
  /** The eight pages of the site (task tracker THE-5…THE-12) for the footer. */
  sitemap: NavItem[];
};

/** One navigation model for the header and the footer. */
export function buildNavigation(locale: Locale, nav: Dictionary["nav"]): Navigation {
  const page = (key: PageKey): NavItem => ({
    href: localePath(locale, pagePaths[key]),
    label: nav.pages[key],
  });
  const link = (key: PageKey): NavEntry => ({ type: "link", ...page(key) });

  return {
    home: page("home"),
    entries: [
      link("home"),
      link("about"),
      link("team"),
      link("members"),
      {
        type: "group",
        id: "partners",
        label: nav.partnersMenu,
        items: [page("partners"), page("rebuild"), page("institutional")],
      },
      link("events"),
    ],
    join: page("join"),
    sitemap: (["home", "about", "team", "members", "partners", "rebuild", "institutional", "events"] as const).map(page),
  };
}
