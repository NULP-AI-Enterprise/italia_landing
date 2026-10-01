/**
 * Every editable content document, as the admin panel lists them.
 * Safe to import on the client: schemas and labels only, no data.
 *
 * Database keys: a collection is stored under its name ("partners"),
 * a page under "page:<name>" ("page:home").
 */
import { z } from "zod";
import * as S from "./schema";

type AnyItem = Record<string, unknown>;

export type CollectionDef = {
  title: string;
  description: string;
  item: z.ZodType;
  /** Field that identifies an item; it cannot change after creation (other data points to it). */
  idKey: "id" | "code";
  /** Items carry an "order" number and are sorted by it; the list gets move up and down buttons. */
  ordered: boolean;
  /** Items can be edited but not added or removed (e.g. regions drawn on the map). */
  fixed?: boolean;
  /** Field used to suggest the id of a new item. */
  titleKey: string;
  label: (item: AnyItem) => string;
  details?: (item: AnyItem) => string;
  /** Sort for the admin list when the collection is not ordered. */
  sort?: (a: AnyItem, b: AnyItem) => number;
  /** Where the content appears on the site, for "view on site" links. */
  sitePath: string;
};

export type PageDef = {
  title: string;
  description: string;
  schema: z.ZodType;
  sitePath: string;
};

const uk = (value: unknown) =>
  value && typeof value === "object" && "uk" in value ? String((value as { uk: unknown }).uk) : String(value ?? "");

const groupNames: Record<string, string> = {
  leadership: "Керівництво",
  departments: "Керівники напрямів",
  regions: "Регіональні представництва",
};

const partnerCategoryNames: Record<string, string> = {
  association: "Партнери асоціації",
  rebuild: "Rebuild Ukraine Better",
  institutional: "Інституційні партнери",
};

export const collections = {
  services: {
    title: "Міні-статті на головній",
    description: "Картки послуг і детальні блоки під ними.",
    item: S.Service,
    idKey: "id",
    ordered: true,
    titleKey: "title",
    label: (item) => uk(item.title),
    details: (item) => uk(item.summary).slice(0, 90),
    sitePath: "/uk",
  },
  team: {
    title: "Команда",
    description: "Люди на сторінці «Команда»: фото, посада, цитата, контакти.",
    item: S.TeamMember,
    idKey: "id",
    ordered: true,
    titleKey: "name",
    label: (item) => uk(item.name),
    details: (item) => `${groupNames[String(item.group)] ?? ""} · ${uk(item.role)}`,
    sitePath: "/uk/team",
  },
  members: {
    title: "Члени асоціації",
    description: "Компанії в пошуку: профіль, галузі, регіони, контакти.",
    item: S.Member,
    idKey: "id",
    ordered: false,
    titleKey: "name",
    label: (item) => String(item.name),
    details: (item) => uk(item.tagline),
    sort: (a, b) => String(a.name).localeCompare(String(b.name), "uk"),
    sitePath: "/uk/members",
  },
  industries: {
    title: "Галузі",
    description: "Галузі для пошуку членів і те, що до них входить.",
    item: S.Industry,
    idKey: "id",
    ordered: true,
    titleKey: "name",
    label: (item) => uk(item.name),
    sitePath: "/uk/members",
  },
  regions: {
    title: "Регіони",
    description: "Назви регіонів України та Італії на мапі. Самі регіони задані мапою.",
    item: S.Region,
    idKey: "code",
    ordered: false,
    fixed: true,
    titleKey: "name",
    label: (item) => uk(item.name),
    details: (item) => String(item.code),
    sort: (a, b) => String(a.code).localeCompare(String(b.code)),
    sitePath: "/uk/members",
  },
  partners: {
    title: "Партнери",
    description: "Картки на трьох сторінках партнерів; розділ вибирається в картці.",
    item: S.Partner,
    idKey: "id",
    ordered: true,
    titleKey: "name",
    label: (item) => uk(item.name),
    details: (item) => partnerCategoryNames[String(item.category)] ?? "",
    sitePath: "/uk/partners",
  },
  events: {
    title: "Календар подій",
    description: "Виставки й події; на сайті сортуються за датою.",
    item: S.Event,
    idKey: "id",
    ordered: false,
    titleKey: "title",
    label: (item) => String(item.title),
    details: (item) => `${item.startDate} – ${item.endDate} · ${uk(item.city)}`,
    sort: (a, b) => String(a.startDate).localeCompare(String(b.startDate)),
    sitePath: "/uk/events",
  },
} satisfies Record<string, CollectionDef>;

export const pages = {
  home: { title: "Головна", description: "Шапка, міста, заголовки блоків.", schema: S.HomePage, sitePath: "/uk" },
  about: {
    title: "Асоціація (Візія)",
    description: "Шапка з містами, головні тези, тексти, широке фото.",
    schema: S.AboutPage,
    sitePath: "/uk/about",
  },
  team: {
    title: "Команда",
    description: "Шапка сторінки й кількість людей у рядах.",
    schema: S.TeamPage,
    sitePath: "/uk/team",
  },
  members: { title: "Члени", description: "Шапка сторінки.", schema: S.SimplePage, sitePath: "/uk/members" },
  partners: {
    title: "Партнери асоціації",
    description: "Шапка сторінки.",
    schema: S.SimplePage,
    sitePath: "/uk/partners",
  },
  rebuild: {
    title: "Учасники програми Rebuild Ukraine Better",
    description: "Шапка сторінки.",
    schema: S.SimplePage,
    sitePath: "/uk/rebuild-ukraine-better",
  },
  institutional: {
    title: "Інституційні організації-партнери",
    description: "Шапка сторінки.",
    schema: S.SimplePage,
    sitePath: "/uk/institutional-partners",
  },
  events: { title: "Календар", description: "Шапка сторінки.", schema: S.SimplePage, sitePath: "/uk/events" },
} satisfies Record<string, PageDef>;

export type CollectionKey = keyof typeof collections;
export type PageKey = keyof typeof pages;

export const pageDocumentKey = (page: PageKey) => `page:${page}`;

/** The same definitions, widened to the common shape. */
export const collectionDef = (key: CollectionKey): CollectionDef => collections[key];
export const pageDef = (key: PageKey): PageDef => pages[key];

export const isCollectionKey = (key: string): key is CollectionKey => Object.hasOwn(collections, key);
export const isPageKey = (key: string): key is PageKey => Object.hasOwn(pages, key);

/** Labels for enum values in the admin forms. */
export const enumLabels: Record<string, string> = {
  ...groupNames,
  ...partnerCategoryNames,
  cover: "Фото зверху",
  thumb: "Логотип зліва",
};

/* ---------- Admin navigation: content grouped by the page of the site ---------- */

export type SectionLink =
  | { kind: "collection"; key: CollectionKey; label: string }
  | { kind: "page"; key: PageKey; label: string };

export type SiteSection = { id: string; title: string; description: string; sitePath: string; links: SectionLink[] };

export const siteSections: SiteSection[] = [
  {
    id: "home",
    title: "Головна",
    description: "Міні-статті з фото, детальні блоки, міста в шапці.",
    sitePath: "/uk",
    links: [
      { kind: "collection", key: "services", label: "Міні-статті" },
      { kind: "page", key: "home", label: "Шапка і заголовки" },
    ],
  },
  {
    id: "about",
    title: "Асоціація",
    description: "Тези, тексти й широке фото.",
    sitePath: "/uk/about",
    links: [{ kind: "page", key: "about", label: "Сторінка" }],
  },
  {
    id: "team",
    title: "Команда",
    description: "Люди: фото, посади, цитати, контакти.",
    sitePath: "/uk/team",
    links: [
      { kind: "collection", key: "team", label: "Люди" },
      { kind: "page", key: "team", label: "Шапка і ряди" },
    ],
  },
  {
    id: "members",
    title: "Члени",
    description: "Компанії в пошуку, галузі та регіони.",
    sitePath: "/uk/members",
    links: [
      { kind: "collection", key: "members", label: "Компанії" },
      { kind: "collection", key: "industries", label: "Галузі" },
      { kind: "collection", key: "regions", label: "Регіони" },
      { kind: "page", key: "members", label: "Шапка сторінки" },
    ],
  },
  {
    id: "partners",
    title: "Партнери",
    description: "Картки на трьох сторінках партнерів.",
    sitePath: "/uk/partners",
    links: [
      { kind: "collection", key: "partners", label: "Картки партнерів" },
      { kind: "page", key: "partners", label: "Шапка: партнери асоціації" },
      { kind: "page", key: "rebuild", label: "Шапка: Rebuild Ukraine Better" },
      { kind: "page", key: "institutional", label: "Шапка: інституційні" },
    ],
  },
  {
    id: "events",
    title: "Календар",
    description: "Виставки й події.",
    sitePath: "/uk/events",
    links: [
      { kind: "collection", key: "events", label: "Події" },
      { kind: "page", key: "events", label: "Шапка сторінки" },
    ],
  },
];

export const sectionLinkHref = (link: SectionLink) =>
  link.kind === "collection" ? `/admin/content/${link.key}` : `/admin/content/pages/${link.key}`;

/** The section a collection or page belongs to. */
export function sectionFor(kind: SectionLink["kind"], key: string) {
  return siteSections.find((section) => section.links.some((link) => link.kind === kind && link.key === key));
}
