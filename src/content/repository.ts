/**
 * Read access to editable content.
 *
 * Today the data comes from JSON files in /content (validated at build time).
 * An admin panel or headless CMS can replace the loaders below without
 * touching pages or components: every function is async and returns
 * locale-resolved, render-ready data.
 */
import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { localize } from "./localize";
import * as S from "./schema";

import settingsJson from "@content/settings.json";
import servicesJson from "@content/services.json";
import teamJson from "@content/team.json";
import industriesJson from "@content/industries.json";
import regionsJson from "@content/regions.json";
import membersJson from "@content/members.json";
import partnersJson from "@content/partners.json";
import eventsJson from "@content/events.json";
import homePageJson from "@content/pages/home.json";
import aboutPageJson from "@content/pages/about.json";
import teamPageJson from "@content/pages/team.json";
import membersPageJson from "@content/pages/members.json";
import partnersPageJson from "@content/pages/partners.json";
import eventsPageJson from "@content/pages/events.json";
import ukraineItalyPageJson from "@content/pages/ukraine-italy.json";

function validate<T extends z.ZodType>(schema: T, data: unknown, source: string): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${source}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

function assertUnique(items: { id: string }[], source: string) {
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) throw new Error(`Duplicate id "${id}" in ${source}`);
    seen.add(id);
  }
}

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

/* ---------- Validated sources (checked once, at build time) ---------- */

const settings = validate(S.Settings, settingsJson, "content/settings.json");
const services = validate(z.array(S.Service), servicesJson, "content/services.json");
const team = validate(z.array(S.TeamMember), teamJson, "content/team.json");
const industries = validate(z.array(S.Industry), industriesJson, "content/industries.json");
const regions = validate(z.array(S.Region), regionsJson, "content/regions.json");
const members = validate(z.array(S.Member), membersJson, "content/members.json");
const partners = validate(z.array(S.Partner), partnersJson, "content/partners.json");
const events = validate(z.array(S.Event), eventsJson, "content/events.json");

const pages = {
  home: validate(S.HomePage, homePageJson, "content/pages/home.json"),
  about: validate(S.AboutPage, aboutPageJson, "content/pages/about.json"),
  team: validate(S.SimplePage, teamPageJson, "content/pages/team.json"),
  members: validate(S.SimplePage, membersPageJson, "content/pages/members.json"),
  partners: validate(S.PartnersPage, partnersPageJson, "content/pages/partners.json"),
  events: validate(S.SimplePage, eventsPageJson, "content/pages/events.json"),
  ukraineItaly: validate(S.ArticlePage, ukraineItalyPageJson, "content/pages/ukraine-italy.json"),
};

assertUnique(services, "content/services.json");
assertUnique(team, "content/team.json");
assertUnique(industries, "content/industries.json");
assertUnique(members, "content/members.json");
assertUnique(partners, "content/partners.json");
assertUnique(events, "content/events.json");

// Members may only reference industries and regions that exist.
{
  const industryIds = new Set(industries.map((i) => i.id));
  const regionCodes = new Set(regions.map((r) => r.code));
  for (const member of members) {
    for (const id of member.industries) {
      if (!industryIds.has(id)) throw new Error(`Member "${member.id}": unknown industry "${id}"`);
    }
    for (const code of member.regions) {
      if (!regionCodes.has(code)) throw new Error(`Member "${member.id}": unknown region "${code}"`);
    }
  }
}

/* ---------- Public API ---------- */

export type PageKey = keyof typeof pages;

export async function getSettings() {
  return settings;
}

export async function getPage<K extends PageKey>(key: K, locale: Locale) {
  return localize(pages[key], locale);
}

export async function getServices(locale: Locale) {
  return localize(services.filter((s) => s.published).sort(byOrder), locale);
}

export type TeamGroupKey = z.infer<typeof S.TeamGroup>;

export async function getTeam(locale: Locale) {
  const published = team.filter((m) => m.published).sort(byOrder);
  return S.TeamGroup.options
    .map((group) => ({ group, people: localize(published.filter((m) => m.group === group), locale) }))
    .filter((entry) => entry.people.length > 0);
}

export async function getMembersDirectory(locale: Locale) {
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

export async function getPartners(locale: Locale) {
  const published = partners.filter((p) => p.published).sort(byOrder);
  return S.PartnerCategory.options.map((category) => ({
    category,
    partners: localize(published.filter((p) => p.category === category), locale),
  }));
}

export async function getEvents(locale: Locale) {
  const sorted = events
    .filter((e) => e.published)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const years = [...new Set(sorted.map((e) => e.startDate.slice(0, 4)))];
  return years.map((year) => ({
    year,
    events: localize(sorted.filter((e) => e.startDate.startsWith(year)), locale),
  }));
}

/* ---------- Render-ready types for components ---------- */

export type HomePageContent = Awaited<ReturnType<typeof getPage<"home">>>;
export type AboutPageContent = Awaited<ReturnType<typeof getPage<"about">>>;
export type ArticlePageContent = Awaited<ReturnType<typeof getPage<"ukraineItaly">>>;
export type ServiceItem = Awaited<ReturnType<typeof getServices>>[number];
export type TeamGroupEntry = Awaited<ReturnType<typeof getTeam>>[number];
export type MembersDirectory = Awaited<ReturnType<typeof getMembersDirectory>>;
export type PartnerGroupEntry = Awaited<ReturnType<typeof getPartners>>[number];
export type EventYearEntry = Awaited<ReturnType<typeof getEvents>>[number];
