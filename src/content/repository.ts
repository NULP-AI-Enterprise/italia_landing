/**
 * Read access to editable content for pages and components.
 *
 * Content comes from src/content/store.ts (database with the bundled JSON as
 * fallback). Every function is async and returns locale-resolved,
 * render-ready data, so pages never deal with storage.
 */
import type { z } from "zod";
import type { Locale } from "@/i18n/config";
import { localize } from "./localize";
import type { PageKey } from "./registry";
import * as S from "./schema";
import { loadContent } from "./store";

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

/* ---------- Public API ---------- */

export type { PageKey };

export async function getPage<K extends PageKey>(key: K, locale: Locale) {
  const { pages } = await loadContent();
  return localize(pages[key], locale);
}

export async function getServices(locale: Locale) {
  const { services } = (await loadContent()).collections;
  return localize(services.filter((s) => s.published).sort(byOrder), locale);
}

export type TeamGroupKey = z.infer<typeof S.TeamGroup>;

export async function getTeam(locale: Locale) {
  const { team } = (await loadContent()).collections;
  const published = team.filter((m) => m.published).sort(byOrder);
  return S.TeamGroup.options
    .map((group) => ({ group, people: localize(published.filter((m) => m.group === group), locale) }))
    .filter((entry) => entry.people.length > 0);
}

/** One published team member, or null (used to validate "Contact" requests). */
export async function getTeamMember(id: string, locale: Locale) {
  const { team } = (await loadContent()).collections;
  const person = team.find((m) => m.published && m.id === id);
  return person ? localize(person, locale) : null;
}

export async function getMembersDirectory(locale: Locale) {
  const { members, industries, regions } = (await loadContent()).collections;
  const collator = new Intl.Collator(locale);
  return {
    members: localize(
      members.filter((m) => m.published).sort((a, b) => collator.compare(a.name, b.name)),
      locale,
    ),
    industries: localize([...industries].sort(byOrder), locale),
    regions: localize(regions, locale),
  };
}

export type PartnerCategoryKey = z.infer<typeof S.PartnerCategory>;

/** Published partners of one category ("association", "rebuild", "institutional"). */
export async function getPartners(category: PartnerCategoryKey, locale: Locale) {
  const { partners } = (await loadContent()).collections;
  return localize(
    partners.filter((p) => p.published && p.category === category).sort(byOrder),
    locale,
  );
}

/** Published events, earliest first. */
export async function getEvents(locale: Locale) {
  const { events } = (await loadContent()).collections;
  return localize(
    events.filter((e) => e.published).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    locale,
  );
}

/* ---------- Render-ready types for components ---------- */

export type HomePageContent = Awaited<ReturnType<typeof getPage<"home">>>;
export type AboutPageContent = Awaited<ReturnType<typeof getPage<"about">>>;
export type ArticlePageContent = Awaited<ReturnType<typeof getPage<"ukraineItaly">>>;
export type ServiceItem = Awaited<ReturnType<typeof getServices>>[number];
export type TeamGroupEntry = Awaited<ReturnType<typeof getTeam>>[number];
export type MembersDirectory = Awaited<ReturnType<typeof getMembersDirectory>>;
export type PartnerItem = Awaited<ReturnType<typeof getPartners>>[number];
export type EventItem = Awaited<ReturnType<typeof getEvents>>[number];
