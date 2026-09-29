/**
 * Content model for everything an editor may change (the future admin panel).
 *
 * - Every translatable field is a `Localized` object: { uk, it }.
 * - Inline emphasis inside text fields uses <b>…</b> and <i>…</i>.
 * - Line breaks inside titles use "\n".
 * - Images live in /public/media and are referenced by path.
 *
 * The same schemas validate the JSON files in /content at build time and can
 * later validate admin form input or CMS responses.
 */
import { z } from "zod";

const text = z.string().trim().min(1);

export const Localized = z.object({ uk: text, it: text });

export const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase-kebab-case");

export const IsoDate = z.iso.date();

export const RegionCode = z.string().regex(/^(UA|IT)-\d{2}$/, "Use an ISO 3166-2 code, e.g. UA-46 or IT-25");

export const Media = z.object({
  src: z.string().startsWith("/media/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Omit only for purely decorative images. */
  alt: Localized.optional(),
});

/** Internal link, written without the locale prefix: "/events", "/#services". */
export const InternalLink = z.object({
  label: Localized,
  href: z.string().startsWith("/"),
});

export const Seo = z.object({
  title: Localized,
  description: Localized,
});

export const Hero = z.object({
  title: Localized,
  lead: Localized.optional(),
});

/* ---------- Collections ---------- */

export const Service = z.object({
  id: Id,
  order: z.number().int(),
  published: z.boolean(),
  title: Localized,
  summary: Localized,
  lead: Localized,
  body: z.array(Localized).min(1),
  image: Media,
  link: InternalLink.optional(),
});

export const TeamGroup = z.enum(["leadership", "departments", "regions"]);

export const TeamMember = z.object({
  id: Id,
  order: z.number().int(),
  published: z.boolean(),
  group: TeamGroup,
  name: Localized,
  role: Localized,
  quote: Localized.optional(),
  email: z.email().optional(),
  photo: Media.optional(),
});

export const Industry = z.object({
  id: Id,
  order: z.number().int(),
  name: Localized,
});

export const Region = z.object({
  code: RegionCode,
  name: Localized,
});

export const Member = z.object({
  id: Id,
  published: z.boolean(),
  /** Company names are not translated. */
  name: text,
  tagline: Localized.optional(),
  description: Localized.optional(),
  industries: z.array(Id),
  regions: z.array(RegionCode),
  expertise: z.array(text),
  website: z.url().optional(),
  logo: Media.optional(),
  contact: z
    .object({
      name: text,
      position: Localized.optional(),
      email: z.email().optional(),
      phone: z.string().regex(/^\+\d{8,15}$/, "Use E.164, e.g. +380501234567").optional(),
      photo: Media.optional(),
    })
    .optional(),
  offers: z.array(Localized),
  seeks: z.array(Localized),
});

export const PartnerCategory = z.enum(["association", "rebuild", "institutional"]);

export const Partner = z.object({
  id: Id,
  order: z.number().int(),
  published: z.boolean(),
  category: PartnerCategory,
  name: Localized,
  description: Localized.optional(),
  website: z.url().optional(),
  logo: Media.optional(),
});

export const Event = z
  .object({
    id: Id,
    published: z.boolean(),
    /** Official event names are not translated. */
    title: text,
    description: Localized.optional(),
    city: Localized,
    startDate: IsoDate,
    endDate: IsoDate,
    website: z.url().optional(),
  })
  .refine((event) => event.endDate >= event.startDate, "endDate must not be before startDate");

/* ---------- Page documents ---------- */

export const HomePage = z.object({
  seo: Seo,
  hero: Hero.extend({ cities: z.array(Localized) }),
  servicesHeading: Localized,
  detailsHeading: Localized,
});

export const AboutPage = z.object({
  seo: Seo,
  hero: Hero,
  intro: z.object({
    title: Localized,
    vision: z.object({ title: Localized, text: Localized }),
    mission: z.object({ title: Localized, text: Localized }),
    image: Media,
  }),
  market: z.object({ title: Localized, text: Localized, image: Media }),
  history: z.object({
    eyebrow: Localized,
    title: Localized,
    paragraphs: z.array(Localized).min(1),
    images: z.array(Media),
  }),
});

export const SimplePage = z.object({ seo: Seo, hero: Hero });

export const PartnersPage = SimplePage.extend({
  sections: z.record(PartnerCategory, z.object({ title: Localized, intro: Localized.optional() })),
});

export const ArticleBlock = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: Localized }),
  z.object({ type: z.literal("heading"), text: Localized }),
  z.object({ type: z.literal("list"), items: z.array(Localized).min(1) }),
  z.object({
    type: z.literal("figures"),
    items: z.array(z.object({ value: Localized, label: Localized })).min(1),
  }),
]);

export const ArticlePage = SimplePage.extend({
  blocks: z.array(ArticleBlock).min(1),
});

export const Settings = z.object({
  /** Where "Contact" buttons lead when a person has no e-mail yet. */
  contactHref: z.string().startsWith("/"),
});

export type LocalizedText = z.infer<typeof Localized>;
