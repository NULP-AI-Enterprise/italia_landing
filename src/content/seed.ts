/**
 * Starting content: the JSON files in /content, bundled with the app.
 * The site uses them until a document is saved in the admin panel, and falls
 * back to them if the database cannot be reached.
 */
import type { CollectionKey, PageKey } from "./registry";

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
import rebuildPageJson from "@content/pages/rebuild-ukraine-better.json";
import institutionalPageJson from "@content/pages/institutional-partners.json";
import eventsPageJson from "@content/pages/events.json";
import ukraineItalyPageJson from "@content/pages/ukraine-italy.json";

export const seedCollections: Record<CollectionKey, unknown> = {
  services: servicesJson,
  team: teamJson,
  members: membersJson,
  industries: industriesJson,
  regions: regionsJson,
  partners: partnersJson,
  events: eventsJson,
};

export const seedPages: Record<PageKey, unknown> = {
  home: homePageJson,
  about: aboutPageJson,
  team: teamPageJson,
  members: membersPageJson,
  partners: partnersPageJson,
  rebuild: rebuildPageJson,
  institutional: institutionalPageJson,
  events: eventsPageJson,
  ukraineItaly: ukraineItalyPageJson,
};
