import { localePath, type Locale } from "@/i18n/config";
import { pagePaths, type PageKey } from "./navigation";

/**
 * Addresses of the previous WordPress site on madeinukraine.it that search engines
 * still list (collected from the Web Archive), mapped to the nearest new page.
 * Italian pages were at the root, Ukrainian ones under /ua/ or /uk/.
 * Old news posts and archives go to the calendar, service pages to the home page.
 */
const italian: Record<string, PageKey> = {
  "chi-siamo": "about",
  statuto: "about",
  "codice-etico": "about",
  persone: "team",
  dipartimenti: "team",
  sedi: "team",
  contatti: "team",
  "soci-partners": "members",
  italiani: "members",
  ucraini: "members",
  tesserati: "members",
  affiliazione: "join",
  "rebuild-ukraine-better": "rebuild",
  attivita: "home",
  "certificazioni-prodotti-tecnologie-e-servizi": "home",
  "import-export-italia-ucraina": "home",
  "corsi-e-seminari": "home",
  shop: "home",
  gallery: "events",
  "ultimi-eventi": "events",
  "inout-expo-2024": "events",
  "rally-montecarlo-historique-ucraina": "events",
  "artemilo1941-association-da-vita-a-una-serata-darte": "events",
  "come-aiutare-lucraina-da-torino-e-dal-piemonte": "events",
  "i-designer-ucraini-hanno-presentato-una-nuova-collezione-di-abiti-da-sposa-a-venezia": "events",
  "il-museo-nazionale-del-cinema-e-lassociazione-made-in-ukraine-for-italy-organizzano-una-raccolta-farmaci-alla-mole-antonelliana":
    "events",
  "intervista-ad-oksana-filonenko-ambasciatrice-di-arte-e-cultura-ucraina-in-italia": "events",
  "mostra-di-pittura-del-maestro-ivan-turetskyy": "events",
  "oksana-filonenko-a-genova-dallambasciatore-onorario-di-odessa": "events",
  "torino-kiev-firmato-accordo-tra-le-accademie-di-belle-arti": "events",
};

const ukrainian: Record<string, PageKey> = {
  "home-українська": "home",
  "про-нас": "about",
  персони: "team",
  "керівники-департаментів": "team",
  "відділ-молоді": "team",
  "юридични-департамент": "team",
  "soci-e-partners-ukr": "members",
  "українські-члени": "members",
  "італійські-члени": "members",
  "rebuild-ukraine-better-2": "rebuild",
  діяльність: "home",
  "імпорт-експорт-італія-україна": "home",
  "курси-та-семінари": "home",
  news: "events",
  "inout-expo": "events",
  "made-expo-2023-miufi": "events",
  "український-національний-стенд-на-ви": "events",
  "українські-дизайнери-презентували-н": "events",
};

/** Families of old addresses: departments, certification pages (one slug starts with a Latin "c"), archives. */
const italianPrefixes: [RegExp, PageKey][] = [
  [/^dipartimento-/, "team"],
  [/^(category|\d{4})(\/|$)/, "events"],
  [/^(jet-menu|jet-popup|type)(\/|$)/, "home"],
  [/^elementor-/, "home"],
];
const ukrainianPrefixes: [RegExp, PageKey][] = [
  [/^департамент/, "team"],
  [/^[сc]ертифікація/, "home"],
  [/^(category|\d{4})(\/|$)/, "events"],
];

const lookup = (slug: string, exact: Record<string, PageKey>, prefixes: [RegExp, PageKey][]) =>
  exact[slug] ?? prefixes.find(([pattern]) => pattern.test(slug))?.[1];

/** New path for an address of the old site, or null when it is not one. */
export function legacyRedirect(pathname: string): string | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  path = path.toLowerCase().replace(/\/+$/, "");
  const ukrainianPath = path.match(/^\/(ua|uk)\/(.+)$/);
  const [locale, page]: [Locale, PageKey | undefined] = ukrainianPath
    ? ["uk", lookup(ukrainianPath[2], ukrainian, ukrainianPrefixes)]
    : ["it", lookup(path.slice(1), italian, italianPrefixes)];
  return page ? localePath(locale, pagePaths[page]) : null;
}
